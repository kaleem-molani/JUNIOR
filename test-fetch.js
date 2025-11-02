import { InstrumentService } from './lib/services/instrument-service';

async function testFetch() {
  const service = new InstrumentService();

  try {
    console.log('Testing instrument fetch...');
    const instruments = await service.fetchInstrumentsFromAPI();

    // Look for YESBANK variants
    const yesbankVariants = instruments.filter(i =>
      i.symbol.includes('YESBANK') ||
      i.name.includes('YESBANK')
    );

    console.log('YESBANK variants found:', yesbankVariants.length);
    yesbankVariants.forEach(yb => {
      console.log('YESBANK variant:', {
        token: yb.token,
        symbol: yb.symbol,
        exch_seg: yb.exch_seg,
        name: yb.name,
      });
    });

    // Show first 5 instruments
    console.log('First 5 instruments:');
    instruments.slice(0, 5).forEach(inst => {
      console.log(inst);
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFetch();