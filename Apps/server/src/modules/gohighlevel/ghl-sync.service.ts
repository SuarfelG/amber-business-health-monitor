import { createHttpClient } from '../../utils/http-client';
import { prisma } from '../../prisma';
import { ghlService } from './ghl.service';
import { ghlAggregatesService } from './ghl-aggregates.service';

interface SyncResult {
  contactsProcessed: number;
  opportunitiesProcessed: number;
  appointmentsProcessed: number;
  error?: string;
}

interface GHLContact {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  dateAdded?: number;
}

interface GHLOpportunity {
  id: string;
  name: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status: string;
  monetaryValue?: number;
  dateAdded?: number;
  closedAt?: number;
  contactId?: string;
}

interface GHLAppointment {
  id: string;
  title?: string;
  startTime: number;
  endTime?: number;
  status: string;
  dateAdded?: number;
  contactId?: string;
}

interface GHLListResponse<T> {
  contacts?: T[];
  opportunities?: T[];
  appointments?: T[];
  meta: {
    total: number;
  };
}

export class GHLSyncService {
  private ghlApiBase = 'https://rest.gohighlevel.com/v1';

  async syncUser(userId: string, backfillDays: number = 7): Promise<SyncResult> {
    const result: SyncResult = {
      contactsProcessed: 0,
      opportunitiesProcessed: 0,
      appointmentsProcessed: 0,
    };

    try {
      const apiKey = await ghlService.getApiKey(userId);
      if (!apiKey) {
        throw new Error('GoHighLevel not connected');
      }

      const integration = await prisma.integration.findUnique({
        where: { userId_provider: { userId, provider: 'GOHIGHLEVEL' } },
        select: { accountId: true },
      });

      if (!integration?.accountId) {
        throw new Error('Location ID not found');
      }

      const httpClient = createHttpClient(this.ghlApiBase, {
        baseDelayMs: 1000,
        maxRetries: 3,
        timeout: 30000,
      });

      const createdAfter = new Date();
      createdAfter.setDate(createdAfter.getDate() - backfillDays);

      const authHeaders = {
        Authorization: `Bearer ${apiKey}`,
      };

      result.contactsProcessed = await this.syncContacts(
        userId,
        httpClient,
        createdAfter,
        authHeaders
      );

      result.opportunitiesProcessed = await this.syncOpportunities(
        userId,
        httpClient,
        createdAfter,
        authHeaders
      );

      result.appointmentsProcessed = await this.syncAppointments(
        userId,
        httpClient,
        createdAfter,
        authHeaders
      );

      // Update last sync time
      await prisma.integration.updateMany({
        where: { userId, provider: 'GOHIGHLEVEL' },
        data: { lastSyncAt: new Date(), lastSyncError: null },
      });

      // Trigger async metrics calculation
      ghlAggregatesService.calculateMetricsForUser(userId, 'week').catch((err) => {
        console.error(`Failed to calculate weekly CRM metrics for user ${userId}:`, err);
      });

      ghlAggregatesService.calculateMetricsForUser(userId, 'month').catch((err) => {
        console.error(`Failed to calculate monthly CRM metrics for user ${userId}:`, err);
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      result.error = errorMsg;

      // Record error
      await prisma.integration.updateMany({
        where: { userId, provider: 'GOHIGHLEVEL' },
        data: {
          status: 'ERROR',
          lastSyncError: errorMsg,
        },
      });

      return result;
    }
  }

  async backfillUser(userId: string): Promise<SyncResult> {
    return this.syncUser(userId, 90);
  }

  private async syncContacts(
    userId: string,
    httpClient: ReturnType<typeof createHttpClient>,
    createdAfter: Date,
    headers: Record<string, string>
  ): Promise<number> {
    let processed = 0;
    let skip = 0;
    const limit = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await httpClient.get<GHLListResponse<GHLContact>>(
        `/contacts/search?limit=${limit}&skip=${skip}&dateAddedMin=${Math.floor(
          createdAfter.getTime() / 1000
        )}`,
        { headers }
      );

      const contacts = response.data.contacts || [];

      for (const contact of contacts) {
        await prisma.gHLContact.upsert({
          where: { userId_externalId: { userId, externalId: contact.id } },
          update: {
            email: contact.email || null,
            phone: contact.phone || null,
            firstName: contact.firstName || null,
            lastName: contact.lastName || null,
            source: contact.source || null,
          },
          create: {
            userId,
            externalId: contact.id,
            email: contact.email || null,
            phone: contact.phone || null,
            firstName: contact.firstName || null,
            lastName: contact.lastName || null,
            source: contact.source || null,
            ghlCreatedAt: contact.dateAdded
              ? new Date(contact.dateAdded * 1000)
              : new Date(),
          },
        });
        processed++;
      }

      if (contacts.length < limit) {
        break;
      }

      skip += limit;
    }

    return processed;
  }

  private async syncOpportunities(
    userId: string,
    httpClient: ReturnType<typeof createHttpClient>,
    createdAfter: Date,
    headers: Record<string, string>
  ): Promise<number> {
    let processed = 0;
    let skip = 0;
    const limit = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await httpClient.get<GHLListResponse<GHLOpportunity>>(
        `/opportunities/search?limit=${limit}&skip=${skip}&dateAddedMin=${Math.floor(
          createdAfter.getTime() / 1000
        )}`,
        { headers }
      );

      const opportunities = response.data.opportunities || [];

      for (const opp of opportunities) {
        // Find associated contact if exists
        let contactId: string | null = null;
        if (opp.contactId) {
          const contact = await prisma.gHLContact.findUnique({
            where: { userId_externalId: { userId, externalId: opp.contactId } },
            select: { id: true },
          });
          contactId = contact?.id || null;
        }

        await prisma.gHLOpportunity.upsert({
          where: { userId_externalId: { userId, externalId: opp.id } },
          update: {
            name: opp.name,
            status: opp.status,
            monetaryValue: opp.monetaryValue || null,
            closedAt: opp.closedAt ? new Date(opp.closedAt * 1000) : null,
          },
          create: {
            userId,
            externalId: opp.id,
            contactId,
            name: opp.name,
            pipelineId: opp.pipelineId || null,
            pipelineStageId: opp.pipelineStageId || null,
            status: opp.status,
            monetaryValue: opp.monetaryValue || null,
            ghlCreatedAt: opp.dateAdded
              ? new Date(opp.dateAdded * 1000)
              : new Date(),
            closedAt: opp.closedAt ? new Date(opp.closedAt * 1000) : null,
          },
        });
        processed++;
      }

      if (opportunities.length < limit) {
        break;
      }

      skip += limit;
    }

    return processed;
  }

  private async syncAppointments(
    userId: string,
    httpClient: ReturnType<typeof createHttpClient>,
    createdAfter: Date,
    headers: Record<string, string>
  ): Promise<number> {
    let processed = 0;
    let skip = 0;
    const limit = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await httpClient.get<GHLListResponse<GHLAppointment>>(
        `/appointments/search?limit=${limit}&skip=${skip}&dateAddedMin=${Math.floor(
          createdAfter.getTime() / 1000
        )}`,
        { headers }
      );

      const appointments = response.data.appointments || [];

      for (const apt of appointments) {
        await prisma.gHLAppointment.upsert({
          where: { userId_externalId: { userId, externalId: apt.id } },
          update: {
            title: apt.title || null,
            startTime: new Date(apt.startTime * 1000),
            endTime: apt.endTime ? new Date(apt.endTime * 1000) : null,
            status: apt.status,
          },
          create: {
            userId,
            externalId: apt.id,
            contactId: apt.contactId || null,
            title: apt.title || null,
            startTime: new Date(apt.startTime * 1000),
            endTime: apt.endTime ? new Date(apt.endTime * 1000) : null,
            status: apt.status,
            ghlCreatedAt: apt.dateAdded
              ? new Date(apt.dateAdded * 1000)
              : new Date(),
          },
        });
        processed++;
      }

      if (appointments.length < limit) {
        break;
      }

      skip += limit;
    }

    return processed;
  }
}

export const ghlSyncService = new GHLSyncService();
