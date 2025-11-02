import { InstrumentService } from './lib/services/instrument-service';

async function testSearch() {
  const service = new InstrumentService();

  try {
    console.log('Testing symbol search for YESBANK...');
    const results = await service.searchSymbols('YESBANK', 10, 'NSE');

    console.log('Search results:', results.length);
    results.forEach(result => {
      console.log(result);
    });

  } catch (error) {
    console.error('Search test failed:', error);
  }
}

testSearch();