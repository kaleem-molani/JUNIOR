// refresh-instruments.ts
import { InstrumentService } from './lib/services/instrument-service';

async function refreshInstruments() {
  console.log('🔄 Starting instrument refresh...');

  try {
    const service = new InstrumentService();
    await service.refreshInstruments();
    console.log('✅ Refresh completed successfully');
  } catch (error) {
    console.error('❌ Refresh failed:', error);
  }
}

refreshInstruments();