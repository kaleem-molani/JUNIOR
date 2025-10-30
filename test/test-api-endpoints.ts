// test-api-endpoints.ts
// Test script for API endpoints

async function testAPIEndpoints() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 [API TEST] Testing instrument API endpoints...\n');

  try {
    // Test 1: Get refresh status
    console.log('📊 [TEST 1] Getting refresh status...');
    const statusResponse = await fetch(`${baseUrl}/api/admin/instruments/refresh`);
    const statusData = await statusResponse.json();
    console.log('📊 [TEST 1] Status:', statusData);
    console.log('✅ [TEST 1] Status check completed\n');

    // Test 2: Test symbol search (should work even with empty data)
    console.log('🔍 [TEST 2] Testing symbol search...');
    const searchResponse = await fetch(`${baseUrl}/api/symbols/search?q=RELIANCE`);
    const searchData = await searchResponse.json();
    console.log('🔍 [TEST 2] Search results:', searchData);
    console.log('✅ [TEST 2] Search test completed\n');

    // Test 2b: Test symbol search with exchange filter
    console.log('🔍 [TEST 2b] Testing symbol search with BSE exchange...');
    const searchBseResponse = await fetch(`${baseUrl}/api/symbols/search?q=RELIANCE&exchange=BSE`);
    const searchBseData = await searchBseResponse.json();
    console.log('🔍 [TEST 2b] BSE search results:', searchBseData.data?.length || 0);
    console.log('✅ [TEST 2b] Exchange filter test completed\n');

    // Test 3: Trigger refresh
    console.log('🔄 [TEST 3] Triggering instrument refresh...');
    const refreshResponse = await fetch(`${baseUrl}/api/admin/instruments/refresh`, {
      method: 'POST',
    });
    const refreshData = await refreshResponse.json();
    console.log('🔄 [TEST 3] Refresh result:', refreshData);
    console.log('✅ [TEST 3] Refresh test completed\n');

    console.log('🎉 [API TEST] All API tests completed successfully!');

  } catch (error) {
    console.error('❌ [API TEST] API test failed:', error);
  }
}

testAPIEndpoints();