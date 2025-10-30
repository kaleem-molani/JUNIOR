// test-api.ts
// Test script to verify API endpoints work with the new broker architecture

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test 1: Account auth endpoint (should return null for non-existent account)
    console.log('1. Testing account auth endpoint...');
    const authResponse = await fetch(`${baseUrl}/api/accounts/test-account/auth`);
    const authData = await authResponse.json();

    if (authData.data === null) {
      console.log('✅ Account auth endpoint: Returns null for non-existent account');
    } else {
      console.log('❌ Account auth endpoint: Unexpected response:', authData);
    }

    // Test 2: AngelOne token generation endpoint (should require auth)
    console.log('\n2. Testing AngelOne token generation endpoint...');
    const tokenResponse = await fetch(`${baseUrl}/api/auth/angel_one/generate/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_code: 'test',
        client_pin: '123456',
        totp: '123456',
        apiKey: 'test-key',
        accountName: 'test-account'
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenResponse.status === 401 && tokenData.error === 'Unauthorized') {
      console.log('✅ Token generation endpoint: Properly requires authentication');
    } else {
      console.log('❌ Token generation endpoint: Unexpected response:', tokenData);
    }

    console.log('\n🎉 API endpoint tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run the test
testAPI();