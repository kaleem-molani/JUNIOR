import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BrokerFactory } from '@/lib/brokers';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderIds, accountIds } = await request.json();

    // Get orders to update - either specific orders or all pending orders
    let ordersToUpdate;

    if (orderIds && orderIds.length > 0) {
      // Update specific orders
      ordersToUpdate = await prisma.order.findMany({
        where: {
          id: { in: orderIds },
          status: { in: ['pending', 'partially_executed'] }
        },
        include: {
          account: true,
          signal: true
        }
      });
    } else if (accountIds && accountIds.length > 0) {
      // Update orders for specific accounts
      ordersToUpdate = await prisma.order.findMany({
        where: {
          accountId: { in: accountIds },
          status: { in: ['pending', 'partially_executed'] }
        },
        include: {
          account: true,
          signal: true
        }
      });
    } else {
      // Update all pending orders
      ordersToUpdate = await prisma.order.findMany({
        where: {
          status: { in: ['pending', 'partially_executed'] }
        },
        include: {
          account: true,
          signal: true
        }
      });
    }

    const results = [];
    const accountGroups = new Map<string, typeof ordersToUpdate>();

    // Group orders by account for efficient API calls
    for (const order of ordersToUpdate) {
      if (!accountGroups.has(order.accountId)) {
        accountGroups.set(order.accountId, []);
      }
      accountGroups.get(order.accountId)!.push(order);
    }

    // Process each account's orders
    for (const [accountId, accountOrders] of accountGroups) {
      const account = accountOrders[0].account;

      try {
        const broker = BrokerFactory.createAngelOneBroker();
        const authStorage = BrokerFactory.getAuthStorage();
        const credentials = await authStorage.loadAuth(accountId);

        if (!credentials) {
          console.error(`No credentials found for account ${account.name}`);
          continue;
        }

        // Get order book from broker
        const orderBook = await broker.getOrderBook(credentials);

        // Create a map of broker order IDs to order book entries
        const orderBookMap = new Map(
          orderBook.map(entry => [entry.orderId, entry])
        );

        // Update each order's status
        for (const order of accountOrders) {
          const orderBookEntry = orderBookMap.get(order.brokerOrderId);

          if (orderBookEntry) {
            // Map broker status to our status
            const newStatus = mapBrokerStatus(orderBookEntry.status);

            if (newStatus !== order.status) {
              // Status has changed, update in database
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  status: newStatus,
                  executedAt: newStatus === 'executed' ? new Date() : order.executedAt,
                  errorMessage: newStatus === 'failed' ? `Order ${orderBookEntry.status}` : order.errorMessage
                }
              });

              // Log status change
              await prisma.log.create({
                data: {
                  userId: session.user.id,
                  action: 'ORDER_STATUS_UPDATE',
                  details: {
                    orderId: order.id,
                    brokerOrderId: order.brokerOrderId,
                    accountId: accountId,
                    accountName: account.name,
                    oldStatus: order.status,
                    newStatus: newStatus,
                    brokerStatus: orderBookEntry.status,
                    symbol: order.signal.symbol,
                    quantity: order.signal.quantity,
                    action: order.signal.action
                  },
                  level: 'info'
                }
              });

              results.push({
                orderId: order.id,
                brokerOrderId: order.brokerOrderId,
                oldStatus: order.status,
                newStatus: newStatus,
                updated: true
              });
            } else {
              results.push({
                orderId: order.id,
                brokerOrderId: order.brokerOrderId,
                status: order.status,
                updated: false
              });
            }
          } else {
            // Order not found in broker's order book - might be too old or error
            results.push({
              orderId: order.id,
              brokerOrderId: order.brokerOrderId,
              status: order.status,
              error: 'Order not found in broker order book',
              updated: false
            });
          }
        }

      } catch (error) {
        console.error(`Error updating orders for account ${account.name}:`, error);

        // Mark all orders for this account as having update errors
        for (const order of accountOrders) {
          results.push({
            orderId: order.id,
            brokerOrderId: order.brokerOrderId,
            status: order.status,
            error: (error as Error).message,
            updated: false
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.filter(r => r.updated).length,
      total: results.length,
      results
    });

  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Map broker-specific status to our standardized status
function mapBrokerStatus(brokerStatus: string): 'pending' | 'executed' | 'partially_executed' | 'failed' | 'cancelled' {
  const status = brokerStatus.toLowerCase();

  if (status.includes('complete') || status.includes('executed') || status === 'executed') {
    return 'executed';
  } else if (status.includes('partial') || status.includes('partially')) {
    return 'partially_executed';
  } else if (status.includes('cancel') || status.includes('cancelled')) {
    return 'cancelled';
  } else if (status.includes('reject') || status.includes('failed') || status === 'failed') {
    return 'failed';
  } else if (status.includes('open') || status.includes('pending') || status === 'pending') {
    return 'pending';
  } else {
    // Default to pending for unknown statuses
    return 'pending';
  }
}