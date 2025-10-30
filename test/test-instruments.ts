// test-instruments.ts
// Test script for instrument service functionality

import { InstrumentService } from '../lib/services/instrument-service';

async function testInstrumentService() {
  console.log('🧪 [TEST] Starting instrument service tests...\n');

  const service = new InstrumentService();

  try {
    // Test 1: Check current refresh status
    console.log('📊 [TEST 1] Checking current refresh status...');
    const lastRefresh = await service.getLastRefreshTime();
    console.log('📊 [TEST 1] Last refresh:', lastRefresh?.toISOString() || 'Never');
    console.log('✅ [TEST 1] Status check completed\n');

    // Test 2: Test symbol search (should return empty if no data)
    console.log('🔍 [TEST 2] Testing symbol search with "RELIANCE"...');
    const searchResults = await service.searchSymbols('RELIANCE', 5);
    console.log('🔍 [TEST 2] Found', searchResults.length, 'results');
    if (searchResults.length > 0) {
      console.log('🔍 [TEST 2] Sample result:', searchResults[0]);
    }
    console.log('✅ [TEST 2] Search test completed\n');

    // Test 3: Fetch instruments from API (commented out to avoid unnecessary API calls)
    console.log('⚠️  [TEST 3] Skipping API fetch test (uncomment to test)');
    // console.log('📡 [TEST 3] Fetching instruments from AngelOne API...');
    // const instruments = await service.fetchInstrumentsFromAPI();
    // console.log('📡 [TEST 3] Fetched', instruments.length, 'instruments');
    // console.log('✅ [TEST 3] API fetch test completed\n');

    // Test 4: Test instrument details lookup (should return null if no data)
    console.log('📋 [TEST 4] Testing instrument lookup for token "738561"...');
    const instrument = await service.getInstrumentByToken('738561');
    console.log('📋 [TEST 4] Instrument found:', !!instrument);
    if (instrument) {
      console.log('📋 [TEST 4] Instrument details:', instrument);
    }
    console.log('✅ [TEST 4] Lookup test completed\n');

    console.log('🎉 [TEST] All tests completed successfully!');

  } catch (error) {
    console.error('❌ [TEST] Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testInstrumentService();
}

export { testInstrumentService };