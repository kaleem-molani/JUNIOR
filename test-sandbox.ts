// test-sandbox.ts
// Test script to verify sandbox mode and mock broker integration

const { BrokerFactory } = require('./lib/brokers/factory');
const { IBrokerCredentials, IOrderRequest } = require('./lib/brokers/interfaces');

// Set sandbox environment variables
process.env.SANDBOX_MODE = 'true';
process.env.MOCK_BROKER_API = 'true';

async function testSandboxMode() {
  console.log('🧪 Testing Sandbox Mode Integration...');

  try {
    // Test that factory creates mock broker in sandbox mode
    const broker = BrokerFactory.createAngelOneBroker();
    console.log('✅ Broker created:', broker.constructor.name);

    // Test basic broker interface
    const hasRequiredMethods = typeof broker.placeOrder === 'function' &&
                              typeof broker.getOrderBook === 'function' &&
                              typeof broker.getTradeBook === 'function';

    console.log('✅ Broker has required methods:', hasRequiredMethods);

    // Test mock order placement
    const mockCredentials: IBrokerCredentials = {
      apiKey: 'test-key',
      userPin: '123456'
    };

    const mockOrder: IOrderRequest = {
      symbol: 'RELIANCE',
      side: 'BUY',
      quantity: 1,
      orderType: 'MARKET',
      productType: 'DELIVERY',
      exchange: 'NSE'
    };

    console.log('🧪 Testing mock order placement...');
    const orderResult = await broker.placeOrder(mockCredentials, mockOrder);
    console.log('✅ Mock order result:', orderResult);

    console.log('🎉 Sandbox mode test completed successfully!');

  } catch (error) {
    console.error('❌ Sandbox mode test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSandboxMode();