import { InstrumentService } from './lib/services/instrument-service';

async function testStore() {
  const service = new InstrumentService();

  try {
    console.log('Testing manual storage of YESBANK-EQ...');

    // Manually create the YESBANK-EQ instrument as it appears in the JSON
    const yesbankEq = {
      token: '11915',
      symbol: 'YESBANK-EQ',
      name: 'YESBANK',
      expiry: '',
      strike: null,
      lotsize: 1,
      instrumenttype: '',
      exch_seg: 'NSE',
      tick_size: 1.0,
    };

    console.log('Storing instrument:', yesbankEq);

    await service.storeInstruments([yesbankEq]);

    console.log('Storage test completed');

  } catch (error) {
    console.error('Storage test failed:', error);
  }
}

testStore();