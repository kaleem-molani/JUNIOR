// lib/brokers/profile.ts
// SOLID: Single Responsibility - AngelOne profile service implementation

import { IProfileService, IBrokerCredentials, IAngelOneProfile } from './interfaces';
import { ITransportService } from './interfaces';

export class AngelOneProfileService implements IProfileService {
  constructor(private transport: ITransportService) {}

  async getProfile(credentials: IBrokerCredentials): Promise<IAngelOneProfile> {
    const headers = {
      'Authorization': `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-SourceID': 'WEB',
      'X-PrivateKey': credentials.apiKey,
    };

    const data = await this.transport.get<IAngelOneProfile>(
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getProfile',
      headers
    );

    if (data.status !== true) {
      throw new Error(`Profile API error: ${data.message || 'Unknown error'}`);
    }

    return data;
  }
}