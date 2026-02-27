import Stripe from 'stripe';
import { config } from '../../config';
import { encryptionService } from '../../utils/encryption.service';
import { prisma } from '../../prisma';
import { createHttpClient } from '../../utils/http-client';
import { auditService } from '../../utils/audit.service';

interface OAuthState {
  userId: string;
  timestamp: number;
}

export class StripeService {
  private stripeBaseUrl = 'https://connect.stripe.com/oauth';
  private stripeTokenUrl = 'https://api.stripe.com/v1/oauth/token';
  private httpClient = createHttpClient();

  generateOAuthUrl(userId: string): string {
    if (!config.integrations.stripe.clientId || config.integrations.stripe.clientId === 'ca_test_missing') {
      throw new Error('Stripe Client ID not configured properly. Please set a valid STRIPE_CLIENT_ID environment variable from https://dashboard.stripe.com/settings/apikeys');
    }

    const state = this.encodeState({ userId, timestamp: Date.now() });

    const params = new URLSearchParams({
      client_id: config.integrations.stripe.clientId,
      response_type: 'code',
      scope: 'read_write',
      state,
      redirect_uri: `${config.frontendUrl}/stripe/callback`,
    });

    return `${this.stripeBaseUrl}/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(
    userId: string,
    code: string,
    state: string
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
    const tokenData = await this.exchangeCodeForToken(code);

    // Validate and store
    const accountId = tokenData.stripe_user_id;
    const encryptedToken = encryptionService.encrypt(tokenData.access_token);

    await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: 'STRIPE' } },
      update: {
        oauthAccessToken: encryptedToken,
        accountId,
        status: 'CONNECTED',
        lastSyncError: null,
      },
      create: {
        userId,
        provider: 'STRIPE',
        oauthAccessToken: encryptedToken,
        accountId,
        status: 'CONNECTED',
      },
    });

    await auditService.logConnection(userId, 'STRIPE', accountId);
  }

  async connectWithApiKey(userId: string, apiKey: string): Promise<void> {
    // Validate API key by calling Stripe API
    try {
      const stripe = new Stripe(apiKey);
      const account = await stripe.accounts.retrieve();

      const encryptedKey = encryptionService.encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId, provider: 'STRIPE' } },
        update: {
          encryptedApiKey: encryptedKey,
          accountId: account.id,
          status: 'CONNECTED',
          lastSyncError: null,
        },
        create: {
          userId,
          provider: 'STRIPE',
          encryptedApiKey: encryptedKey,
          accountId: account.id,
          status: 'CONNECTED',
        },
      });

      await auditService.logConnection(userId, 'STRIPE', account.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid API key';
      throw new Error(`Stripe validation failed: ${message}`);
    }
  }

  async getConnectionStatus(userId: string) {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'STRIPE' } },
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
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'STRIPE' } },
      select: { accountId: true },
    });

    await prisma.integration.updateMany({
      where: { userId, provider: 'STRIPE' },
      data: {
        status: 'DISCONNECTED',
        encryptedApiKey: null,
        oauthAccessToken: null,
        oauthRefreshToken: null,
        accountId: null,
        lastSyncError: null,
      },
    });

    await auditService.logDisconnection(userId, 'STRIPE', integration?.accountId || undefined);
  }

  async getApiKey(userId: string): Promise<string | null> {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'STRIPE' } },
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

  private async exchangeCodeForToken(code: string) {
    try {
      const response = await this.httpClient.post<{
        access_token: string;
        stripe_user_id: string;
      }>(this.stripeTokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.integrations.stripe.clientId,
        client_secret: config.integrations.stripe.clientSecret,
      }));

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

export const stripeService = new StripeService();
