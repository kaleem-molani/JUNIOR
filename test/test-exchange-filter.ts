// test-exchange-filter.ts
async function testExchangeFilter() {
  console.log('🧪 Testing exchange filter in symbol search...\n');

  try {
    // Test NSE (default)
    console.log('🔍 Testing NSE search (default):');
    const res1 = await fetch('http://localhost:3000/api/symbols/search?q=RELIANCE');
    const data1 = await res1.json();
    console.log('NSE results:', data1.data?.length || 0);
    if (data1.data?.[0]) {
      console.log('Sample NSE result:', data1.data[0].exchange);
    }

    // Test BSE
    console.log('\n🔍 Testing BSE search:');
    const res2 = await fetch('http://localhost:3000/api/symbols/search?q=RELIANCE&exchange=BSE');
    const data2 = await res2.json();
    console.log('BSE results:', data2.data?.length || 0);
    if (data2.data?.[0]) {
      console.log('Sample BSE result:', data2.data[0].exchange);
    }

    // Test BFO
    console.log('\n🔍 Testing BFO search:');
    const res3 = await fetch('http://localhost:3000/api/symbols/search?q=RELIANCE&exchange=BFO');
    const data3 = await res3.json();
    console.log('BFO results:', data3.data?.length || 0);
    if (data3.data?.[0]) {
      console.log('Sample BFO result:', data3.data[0].exchange);
    }

    // Test with limit
    console.log('\n🔍 Testing with limit=5:');
    const res4 = await fetch('http://localhost:3000/api/symbols/search?q=RELIANCE&limit=5');
    const data4 = await res4.json();
    console.log('Limited results:', data4.data?.length || 0);

    console.log('\n✅ Exchange filter tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testExchangeFilter();