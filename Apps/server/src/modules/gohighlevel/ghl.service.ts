import { config } from '../../config';
import { encryptionService } from '../../utils/encryption.service';
import { prisma } from '../../prisma';
import { createHttpClient } from '../../utils/http-client';

interface OAuthState {
  userId: string;
  timestamp: number;
}

interface GHLLocationSearchResponse {
  locations: Array<{
    id: string;
    name: string;
  }>;
}

export class GHLService {
  private ghlBaseUrl = 'https://marketplace.gohighlevel.com/oauth';
  private ghlTokenUrl = 'https://api.gohighlevel.com/oauth/token';
  private ghlApiBase = 'https://rest.gohighlevel.com/v1';
  private httpClient = createHttpClient();

  generateOAuthUrl(userId: string): string {
    if (!config.integrations.gohighlevel.clientId || config.integrations.gohighlevel.clientId === 'ghl_test_missing') {
      throw new Error('GoHighLevel Client ID not configured properly. Please set a valid GHL_CLIENT_ID environment variable from https://system.gohighlevel.com/marketplace');
    }

    const state = this.encodeState({ userId, timestamp: Date.now() });

    const params = new URLSearchParams({
      client_id: config.integrations.gohighlevel.clientId,
      response_type: 'code',
      scope: 'locations/read appointments/read contacts/read opportunities/read',
      state,
      redirect_uri: `${config.frontendUrl}/gohighlevel/callback`,
    });

    return `${this.ghlBaseUrl}/chooselocation?${params.toString()}`;
  }

  async handleOAuthCallback(
    userId: string,
    code: string,
    state: string,
    locationId: string
  ): Promise<void> {
    // Verify state hasn't expired (5 minute window)
    const stateData = this.decodeState(state);
    if (!stateData || stateData.userId !== userId) {
      throw new Error('Invalid OAuth state');
    }

    const ageMs = Date.now() - stateData.timestamp;
    if (ageMs > 5 * 60 * 1000) {
      throw new Error('OAuth state expired');
    }

    // Exchange code for token
    const tokenData = await this.exchangeCodeForToken(code, locationId);

    // Validate and store
    const encryptedToken = encryptionService.encrypt(tokenData.access_token);

    await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: 'GOHIGHLEVEL' } },
      update: {
        oauthAccessToken: encryptedToken,
        accountId: locationId,
        status: 'CONNECTED',
        lastSyncError: null,
      },
      create: {
        userId,
        provider: 'GOHIGHLEVEL',
        oauthAccessToken: encryptedToken,
        accountId: locationId,
        status: 'CONNECTED',
      },
    });
  }

  async connectWithApiKey(userId: string, apiKey: string, locationId: string): Promise<void> {
    // Validate API key by calling GHL API
    try {
      await this.httpClient.get<GHLLocationSearchResponse>(
        `${this.ghlApiBase}/locations/search`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const encryptedKey = encryptionService.encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId, provider: 'GOHIGHLEVEL' } },
        update: {
          encryptedApiKey: encryptedKey,
          accountId: locationId,
          status: 'CONNECTED',
          lastSyncError: null,
        },
        create: {
          userId,
          provider: 'GOHIGHLEVEL',
          encryptedApiKey: encryptedKey,
          accountId: locationId,
          status: 'CONNECTED',
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid API key';
      throw new Error(`GoHighLevel validation failed: ${message}`);
    }
  }

  async getConnectionStatus(userId: string) {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'GOHIGHLEVEL' } },
      select: {
        status: true,
        accountId: true,
        lastSyncAt: true,
        lastSyncError: true,
      },
    });

    return (
      integration || {
        status: 'DISCONNECTED',
        accountId: null,
        lastSyncAt: null,
        lastSyncError: null,
      }
    );
  }

  async disconnect(userId: string): Promise<void> {
    await prisma.integration.updateMany({
      where: { userId, provider: 'GOHIGHLEVEL' },
      data: {
        status: 'DISCONNECTED',
        encryptedApiKey: null,
        oauthAccessToken: null,
        oauthRefreshToken: null,
        accountId: null,
        lastSyncError: null,
      },
    });
  }

  async getApiKey(userId: string): Promise<string | null> {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'GOHIGHLEVEL' } },
      select: { encryptedApiKey: true, oauthAccessToken: true },
    });

    if (!integration) {
      return null;
    }

    if (integration.encryptedApiKey) {
      return encryptionService.decrypt(integration.encryptedApiKey);
    }

    if (integration.oauthAccessToken) {
      return encryptionService.decrypt(integration.oauthAccessToken);
    }

    return null;
  }

  private async exchangeCodeForToken(
    code: string,
    locationId: string
  ): Promise<{ access_token: string }> {
    try {
      const response = await this.httpClient.post<{ access_token: string }>(
        this.ghlTokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: config.integrations.gohighlevel.clientId,
          client_secret: config.integrations.gohighlevel.clientSecret,
          redirect_uri: `${config.frontendUrl}/gohighlevel/callback`,
        })
      );

      return response.data;
    } catch (err) {
      throw new Error('Failed to exchange OAuth code');
    }
  }

  private encodeState(data: OAuthState): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private decodeState(encoded: string): OAuthState | null {
    try {
      const data = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
      return data;
    } catch {
      return null;
    }
  }
}

export const ghlService = new GHLService();
