// lib/brokers/orders.ts
// SOLID: Single Responsibility - Handles order operations

import { IAngelOneOrderData, IBrokerCredentials, IOrderRequest, IOrderResponse, IOrderService, ITransportService, IOrderBookEntry, ITradeBookEntry } from './interfaces';

interface AngelOneOrderResponse {
  status: boolean;
  data?: {
    orderid: string;
    message?: string;
  };
  error?: {
    message: string;
  };
}

interface AngelOneOrderBookResponse {
  status: boolean;
  data?: Array<{
    orderid: string;
    symboltoken: string;
    tradingsymbol: string;
    transactiontype: string;
    quantity: number | string;
    price: number | string;
    status: string;
    orderdate?: string;
    orderDate?: string;
    date?: string;
    timestamp?: string;
    createdAt?: string;
    order_timestamp?: string;
    [key: string]: any; // Allow any other fields
  }>;
}

interface AngelOneTradeBookResponse {
  status: boolean;
  data?: Array<{
    tradeid: string;
    orderid: string;
    symboltoken: string;
    tradingsymbol: string;
    transactiontype: string;
    quantity: number | string;
    price: number | string;
    tradedate: string;
  }>;
}

export class AngelOneOrderService implements IOrderService {
  private transport: ITransportService;
  private readonly placeOrderEndpoint = '/rest/secure/angelbroking/order/v1/placeOrder';
  private readonly orderBookEndpoint = '/rest/secure/angelbroking/order/v1/getOrderBook';
  private readonly tradeBookEndpoint = '/rest/secure/angelbroking/order/v1/getTradeBook';
  private readonly cancelOrderEndpoint = '/rest/secure/angelbroking/order/v1/cancelOrder';

  constructor(transport: ITransportService) {
    this.transport = transport;
  }

  async placeOrder(credentials: IBrokerCredentials, order: IOrderRequest): Promise<IOrderResponse> {
    if (!credentials.accessToken) {
      throw new Error('Not authenticated');
    }

    const orderData: IAngelOneOrderData = {
      variety: 'NORMAL', // Required field for AngelOne API
      tradingsymbol: order.symbol,
      symboltoken: String(order.symbolToken || order.symbol), // Ensure it's a string
      transactiontype: order.side,
      exchange: order.exchange,
      ordertype: order.orderType,
      producttype: order.productType,
      duration: 'DAY',
      quantity: String(order.quantity), // Ensure it's a string
      triggerprice: '0', // String format for stop loss orders
    };

    // Only include price for non-MARKET orders
    if (order.orderType !== 'MARKET') {
      orderData.price = String(order.price || 0);
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
        'X-PrivateKey': credentials.apiKey,
      };

      const response = await this.transport.post<AngelOneOrderResponse>(
        this.placeOrderEndpoint,
        orderData as unknown as Record<string, unknown>,
        headers
      );

      if (response.status && response.data) {
        return {
          orderId: response.data.orderid,
          status: 'pending',
          message: response.data.message,
          requestData: orderData,
          responseData: response,
        };
      }

      return {
        orderId: '',
        status: 'failed',
        message: response.error?.message || 'Order placement failed',
        requestData: orderData,
        responseData: response,
      };
    } catch (error) {
      console.error('Order placement failed:', error);
      return {
        orderId: '',
        status: 'failed',
        message: 'Order placement failed due to network error',
        requestData: orderData,
        responseData: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  async getOrderBook(credentials: IBrokerCredentials): Promise<IOrderBookEntry[]> {
    console.log('📊 [Order Service] ===== GETTING ORDER BOOK =====');
    console.log('📊 [Order Service] Access token present:', !!credentials.accessToken);
    console.log('📊 [Order Service] Access token length:', credentials.accessToken?.length || 0);

    if (!credentials.accessToken) {
      console.log('❌ [Order Service] No access token available');
      throw new Error('Not authenticated');
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
        'X-PrivateKey': credentials.apiKey,
      };

      console.log('📊 [Order Service] Making API call to order book endpoint...');
      const response = await this.transport.get<AngelOneOrderBookResponse>(
        this.orderBookEndpoint,
        headers
      );

      console.log('📊 [Order Service] API response status:', response.status);
      console.log('📊 [Order Service] API response has data:', !!response.data);
      if (response.status && response.data) {
        console.log('📊 [Order Service] Raw order data sample:', response.data.slice(0, 2));
        response.data.forEach((order, index) => {
          console.log(`📊 [Order Service] Order ${index + 1} full data:`, order);
          console.log(`📊 [Order Service] Order ${index + 1} keys:`, Object.keys(order));
          // Check for any date-related fields
          const dateFields = Object.keys(order).filter(key => 
            key.toLowerCase().includes('date') || 
            key.toLowerCase().includes('time') ||
            key.toLowerCase().includes('created') ||
            key.toLowerCase().includes('timestamp')
          );
          console.log(`📊 [Order Service] Date-related fields:`, dateFields);
          
          // Check for numeric fields that might be timestamps
          const numericFields = Object.entries(order).filter(([key, value]) => 
            typeof value === 'number' && value > 1000000000
          ).map(([key, value]) => ({ field: key, value }));
          console.log(`📊 [Order Service] Potential timestamp fields:`, numericFields);
        });
      } else {
        console.log('📊 [Order Service] No data in response');
      }

      if (response.status && response.data) {
        const orders = response.data.map(order => {
          // Try multiple possible date field names and formats
          let orderDate = order.orderdate || order.orderDate || order.date || 
                         order.timestamp || order.createdAt || order.order_timestamp;
          
          // If it's a Unix timestamp (number), convert it
          if (typeof orderDate === 'number' || (typeof orderDate === 'string' && !isNaN(Number(orderDate)))) {
            const timestamp = Number(orderDate);
            if (timestamp > 1000000000) { // Likely a Unix timestamp in seconds
              orderDate = new Date(timestamp * 1000).toLocaleString();
            } else if (timestamp > 1000000000000) { // Unix timestamp in milliseconds
              orderDate = new Date(timestamp).toLocaleString();
            }
          }
          
          // If still no date, try to extract from order ID
          if (!orderDate || orderDate === 'N/A') {
            // Some brokers embed timestamp in order ID
            if (order.orderid && typeof order.orderid === 'string') {
              // Look for patterns like YYYYMMDD or timestamp in order ID
              const dateMatch = order.orderid.match(/(\d{4})(\d{2})(\d{2})/);
              if (dateMatch) {
                try {
                  const [, year, month, day] = dateMatch;
                  const date = new Date(`${year}-${month}-${day}`);
                  if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
                    orderDate = date.toLocaleDateString();
                  }
                } catch {
                  // Invalid date, continue
                }
              }
              
              // Try Unix timestamp patterns
              const timestampMatch = order.orderid.match(/(\d{10,13})/);
              if (timestampMatch && !orderDate) {
                try {
                  const timestamp = Number(timestampMatch[1]);
                  if (timestamp > 1000000000) {
                    const date = new Date(timestamp * (timestamp > 1000000000000 ? 1 : 1000));
                    if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
                      orderDate = date.toLocaleDateString();
                    }
                  }
                } catch {
                  // Invalid timestamp, continue
                }
              }
            }
          }
          
          // Final fallback
          if (!orderDate || orderDate === 'N/A') {
            orderDate = 'Not available';
          }
          
          console.log(`📊 [Order Service] Order ${order.orderid} date processing:`, {
            raw: order.orderdate || order.orderDate || order.date || order.timestamp,
            processed: orderDate
          });
          
          return {
            orderId: order.orderid,
            symbol: order.tradingsymbol,
            side: order.transactiontype as 'BUY' | 'SELL',
            quantity: parseInt(String(order.quantity || 0)), // Ensure quantity is a number
            price: parseFloat(String(order.price || 0)), // Ensure price is a number
            status: order.status,
            orderDate: orderDate,
          };
        });
        console.log('📊 [Order Service] Mapped orders count:', orders.length);
        console.log('📊 [Order Service] ===== ORDER BOOK COMPLETE =====');
        return orders;
      }

      console.log('📊 [Order Service] Returning empty array (no valid response)');
      console.log('📊 [Order Service] ===== ORDER BOOK COMPLETE =====');
      return [];
    } catch (error) {
      console.error('❌ [Order Service] Order book fetch failed:', error);
      console.log('📊 [Order Service] ===== ORDER BOOK FAILED =====');
      return [];
    }
  }

  async getTradeBook(credentials: IBrokerCredentials): Promise<ITradeBookEntry[]> {
    if (!credentials.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
        'X-PrivateKey': credentials.apiKey,
      };

      const response = await this.transport.get<AngelOneTradeBookResponse>(
        this.tradeBookEndpoint,
        headers
      );

      if (response.status && response.data) {
        console.log('📊 [Order Service] Raw trade data sample:', response.data.slice(0, 2));
        response.data.forEach((trade, index) => {
          console.log(`📊 [Order Service] Trade ${index + 1}:`, {
            tradeid: trade.tradeid,
            quantity: trade.quantity,
            price: trade.price,
            quantityType: typeof trade.quantity,
            priceType: typeof trade.price
          });
        });
        return response.data.map(trade => {
          const quantity = trade.quantity ? parseInt(String(trade.quantity)) : 0;
          const price = trade.price ? parseFloat(String(trade.price)) : 0;
          
          console.log(`📊 [Order Service] Parsed trade ${trade.tradeid}:`, {
            quantity: quantity,
            price: price,
            originalQuantity: trade.quantity,
            originalPrice: trade.price
          });
          
          return {
            tradeId: trade.tradeid,
            orderId: trade.orderid,
            symbol: trade.tradingsymbol,
            side: trade.transactiontype as 'BUY' | 'SELL',
            quantity: quantity,
            price: price,
            tradeDate: trade.tradedate,
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Trade book fetch failed:', error);
      return [];
    }
  }

  async cancelOrder(credentials: IBrokerCredentials, orderId: string): Promise<boolean> {
    if (!credentials.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
        'X-PrivateKey': credentials.apiKey,
      };

      const response = await this.transport.post<AngelOneOrderResponse>(
        this.cancelOrderEndpoint,
        { orderid: orderId },
        headers
      );

      return response.status;
    } catch (error) {
      console.error('Order cancellation failed:', error);
      return false;
    }
  }
}