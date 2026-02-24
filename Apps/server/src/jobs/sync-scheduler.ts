import * as cron from 'node-cron';
import { prisma } from '../prisma';
import { stripeSyncService } from '../modules/stripe/stripe-sync.service';
import { ghlSyncService } from '../modules/gohighlevel/ghl-sync.service';

export class SyncScheduler {
  private syncTask: cron.ScheduledTask | null = null;

  start(): void {
    // Daily sync at 2 AM UTC (cron: 0 2 * * *)
    this.syncTask = cron.schedule('0 2 * * *', async () => {
      console.log('Starting daily sync (Stripe & GoHighLevel)...');
      await this.runStripeSyncs();
      await this.runGHLSyncs();
      console.log('Daily sync completed');
    });

    console.log('Sync scheduler started (daily at 2 AM UTC)');
  }

  stop(): void {
    if (this.syncTask) {
      this.syncTask.stop();
      console.log('Sync scheduler stopped');
    }
  }

  private async runStripeSyncs(): Promise<void> {
    try {
      // Find all users with connected Stripe integrations
      const integrations = await prisma.integration.findMany({
        where: {
          provider: 'STRIPE',
          status: 'CONNECTED',
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      console.log(`Found ${integrations.length} users with Stripe connected`);

      for (const { userId } of integrations) {
        try {
          const result = await stripeSyncService.syncUser(userId, 7);
          if (result.error) {
            console.error(`Stripe sync error for user ${userId}: ${result.error}`);
          } else {
            console.log(
              `Stripe sync for user ${userId}: ${result.customersProcessed} customers, ${result.chargesProcessed} charges, ${result.invoicesProcessed} invoices, ${result.subscriptionsProcessed} subscriptions`
            );
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Stripe sync failed for user ${userId}: ${errorMsg}`);
        }
      }

      console.log('Daily Stripe sync completed');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error running Stripe syncs: ${errorMsg}`);
    }
  }

  private async runGHLSyncs(): Promise<void> {
    try {
      // Find all users with connected GoHighLevel integrations
      const integrations = await prisma.integration.findMany({
        where: {
          provider: 'GOHIGHLEVEL',
          status: 'CONNECTED',
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      console.log(`Found ${integrations.length} users with GoHighLevel connected`);

      for (const { userId } of integrations) {
        try {
          const result = await ghlSyncService.syncUser(userId, 7);
          if (result.error) {
            console.error(`GoHighLevel sync error for user ${userId}: ${result.error}`);
          } else {
            console.log(
              `GoHighLevel sync for user ${userId}: ${result.contactsProcessed} contacts, ${result.opportunitiesProcessed} opportunities, ${result.appointmentsProcessed} appointments`
            );
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error(`GoHighLevel sync failed for user ${userId}: ${errorMsg}`);
        }
      }

      console.log('Daily GoHighLevel sync completed');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error running GoHighLevel syncs: ${errorMsg}`);
    }
  }
}

export const syncScheduler = new SyncScheduler();
