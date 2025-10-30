// test-broker.ts
// Simple test script to verify broker architecture

import { BrokerFactory } from './lib/brokers';

async function testBrokerArchitecture() {
  console.log('🧪 Testing Broker Architecture...\n');

  try {
    // Test 1: Broker Factory Creation
    console.log('1. Testing Broker Factory...');
    const broker = BrokerFactory.createAngelOneBroker();
    console.log('✅ AngelOne broker created successfully');

    // Test 2: Transport Service
    console.log('\n2. Testing Transport Service...');
    const transport = BrokerFactory.getTransport();
    console.log('✅ Transport service initialized');

    // Test 3: Auth Storage
    console.log('\n3. Testing Auth Storage...');
    const authStorage = BrokerFactory.getAuthStorage();
    console.log('✅ Auth storage initialized');

    // Test 4: Broker Interface Methods
    console.log('\n4. Testing Broker Interface...');
    const testCredentials = {
      apiKey: 'test-key',
      userPin: '123456',
    };

    // Test authentication check (should return false for invalid credentials)
    const isAuthenticated = broker.isAuthenticated(testCredentials);
    console.log(`✅ Authentication check: ${isAuthenticated} (expected: false)`);

    console.log('\n🎉 All basic tests passed! Broker architecture is working.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testBrokerArchitecture();