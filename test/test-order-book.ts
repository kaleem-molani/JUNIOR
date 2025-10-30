// test-order-book.ts
// Test script to check order book functionality

import { BrokerFactory } from '../lib/brokers';

async function testOrderBook() {
  console.log('🧪 Testing Order Book API...\n');

  try {
    // Get the auth storage and load credentials
    const authStorage = BrokerFactory.getAuthStorage();

    // Try to load auth data for the test account
    // We'll use the account ID from our database check
    const accountId = 'cmhcmueol0001yhgkzinpxsoc';
    console.log('Loading auth data for account:', accountId);

    const credentials = await authStorage.loadAuth(accountId);
    if (!credentials) {
      console.log('❌ No credentials found for account');
      return;
    }

    console.log('✅ Credentials loaded successfully');
    console.log('Access token present:', !!credentials.accessToken);

    if (!credentials.accessToken) {
      console.log('❌ No access token available');
      return;
    }

    // Create broker and test order book
    const broker = BrokerFactory.createAngelOneBroker();
    console.log('Calling getOrderBook...');

    const orderBook = await broker.getOrderBook(credentials);
    console.log('Order book result:', orderBook);
    console.log('Order count:', orderBook.length);

    if (orderBook.length > 0) {
      console.log('Sample order:', orderBook[0]);
    }

    console.log('\n🎉 Order book test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOrderBook();