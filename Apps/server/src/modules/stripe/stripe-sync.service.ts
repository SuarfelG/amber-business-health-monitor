import Stripe from 'stripe';
import { prisma } from '../../prisma';
import { stripeService } from './stripe.service';
import { stripeAggregatesService } from './stripe-aggregates.service';
import { auditService } from '../../utils/audit.service';

interface SyncResult {
  customersProcessed: number;
  chargesProcessed: number;
  invoicesProcessed: number;
  subscriptionsProcessed: number;
  error?: string;
}

export class StripeSyncService {
  async syncUser(userId: string, backfillDays?: number): Promise<SyncResult> {
    const result: SyncResult = {
      customersProcessed: 0,
      chargesProcessed: 0,
      invoicesProcessed: 0,
      subscriptionsProcessed: 0,
    };

    try {
      const apiKey = await stripeService.getApiKey(userId);
      if (!apiKey) {
        throw new Error('Stripe not connected');
      }

      // Determine days to backfill: 90 days on first sync, 7 days on subsequent
      let daysToBackfill = backfillDays ?? 7;
      if (backfillDays === undefined) {
        const integration = await prisma.integration.findUnique({
          where: { userId_provider: { userId, provider: 'STRIPE' } },
          select: { lastSyncAt: true },
        });
        daysToBackfill = integration?.lastSyncAt ? 7 : 90;
      }

      const stripe = new Stripe(apiKey);
      const createdAfter = new Date();
      createdAfter.setDate(createdAfter.getDate() - daysToBackfill);

      result.customersProcessed = await this.syncCustomers(userId, stripe, createdAfter);
      result.chargesProcessed = await this.syncCharges(userId, stripe, createdAfter);
      result.invoicesProcessed = await this.syncInvoices(userId, stripe, createdAfter);
      result.subscriptionsProcessed = await this.syncSubscriptions(userId, stripe, createdAfter);

      // Update last sync time
      await prisma.integration.updateMany({
        where: { userId, provider: 'STRIPE' },
        data: { lastSyncAt: new Date(), lastSyncError: null },
      });

      await auditService.logSyncCompleted(userId, 'STRIPE');

      // Trigger async metrics calculation
      stripeAggregatesService.calculateMetricsForUser(userId, 'week').catch((err) => {
        console.error(`Failed to calculate weekly metrics for user ${userId}:`, err);
      });

      stripeAggregatesService.calculateMetricsForUser(userId, 'month').catch((err) => {
        console.error(`Failed to calculate monthly metrics for user ${userId}:`, err);
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      result.error = errorMsg;

      // Record error
      await prisma.integration.updateMany({
        where: { userId, provider: 'STRIPE' },
        data: {
          status: 'ERROR',
          lastSyncError: errorMsg,
        },
      });

      await auditService.logSyncFailed(userId, 'STRIPE', errorMsg);

      return result;
    }
  }

  async backfillUser(userId: string): Promise<SyncResult> {
    return this.syncUser(userId, 90);
  }

  private async syncCustomers(
    userId: string,
    stripe: Stripe,
    createdAfter: Date
  ): Promise<number> {
    let processed = 0;
    let startingAfter: string | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const customers = await stripe.customers.list({
        limit: 100,
        created: {
          gte: Math.floor(createdAfter.getTime() / 1000),
        },
        starting_after: startingAfter,
      });

      for (const customer of customers.data) {
        await prisma.stripeCustomer.upsert({
          where: { userId_externalId: { userId, externalId: customer.id } },
          update: {
            email: customer.email || null,
            name: customer.name || null,
          },
          create: {
            userId,
            externalId: customer.id,
            email: customer.email || null,
            name: customer.name || null,
            stripeCreatedAt: new Date(customer.created * 1000),
          },
        });
        processed++;
      }

      if (!customers.has_more) {
        break;
      }

      startingAfter = customers.data[customers.data.length - 1].id;
    }

    return processed;
  }

  private async syncCharges(
    userId: string,
    stripe: Stripe,
    createdAfter: Date
  ): Promise<number> {
    let processed = 0;
    let startingAfter: string | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const charges = await stripe.charges.list({
        limit: 100,
        created: {
          gte: Math.floor(createdAfter.getTime() / 1000),
        },
        starting_after: startingAfter,
      });

      for (const charge of charges.data) {
        // Find associated customer
        let customerId: string | null = null;
        if (charge.customer) {
          const customer = await prisma.stripeCustomer.findUnique({
            where: { userId_externalId: { userId, externalId: charge.customer as string } },
            select: { id: true },
          });
          customerId = customer?.id || null;
        }

        await prisma.stripeCharge.upsert({
          where: { userId_externalId: { userId, externalId: charge.id } },
          update: {
            status: charge.status,
            refunded: charge.refunded,
            refundAmount: charge.amount_refunded || 0,
          },
          create: {
            userId,
            externalId: charge.id,
            customerId,
            amount: charge.amount,
            currency: charge.currency,
            status: charge.status,
            refunded: charge.refunded,
            refundAmount: charge.amount_refunded || 0,
            stripeCreatedAt: new Date(charge.created * 1000),
          },
        });
        processed++;
      }

      if (!charges.has_more) {
        break;
      }

      startingAfter = charges.data[charges.data.length - 1].id;
    }

    return processed;
  }

  private async syncInvoices(
    userId: string,
    stripe: Stripe,
    createdAfter: Date
  ): Promise<number> {
    let processed = 0;
    let startingAfter: string | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const invoices = await stripe.invoices.list({
        limit: 100,
        created: {
          gte: Math.floor(createdAfter.getTime() / 1000),
        },
        starting_after: startingAfter,
      });

      for (const invoice of invoices.data) {
        await prisma.stripeInvoice.upsert({
          where: { userId_externalId: { userId, externalId: invoice.id } },
          update: {
            status: invoice.status || 'unknown',
            amountDue: invoice.amount_due || 0,
            amountPaid: invoice.amount_paid || 0,
          },
          create: {
            userId,
            externalId: invoice.id,
            customerId: (invoice.customer as string) || null,
            amountDue: invoice.amount_due || 0,
            amountPaid: invoice.amount_paid || 0,
            currency: invoice.currency,
            status: invoice.status || 'unknown',
            stripeCreatedAt: new Date(invoice.created * 1000),
          },
        });
        processed++;
      }

      if (!invoices.has_more) {
        break;
      }

      startingAfter = invoices.data[invoices.data.length - 1].id;
    }

    return processed;
  }

  private async syncSubscriptions(
    userId: string,
    stripe: Stripe,
    createdAfter: Date
  ): Promise<number> {
    let processed = 0;
    let startingAfter: string | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
        created: {
          gte: Math.floor(createdAfter.getTime() / 1000),
        },
        starting_after: startingAfter,
      });

      for (const subscription of subscriptions.data) {
        // Ensure customer exists
        const customer = await prisma.stripeCustomer.findUnique({
          where: { userId_externalId: { userId, externalId: subscription.customer as string } },
          select: { id: true },
        });

        if (!customer) {
          // Customer not found, skip subscription
          continue;
        }

        const sub = subscription as unknown as {
          id: string;
          customer: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
          canceled_at: number | null;
          created: number;
        };

        await prisma.stripeSubscription.upsert({
          where: { userId_externalId: { userId, externalId: sub.id } },
          update: {
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
          },
          create: {
            userId,
            externalId: sub.id,
            customerId: customer.id,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
            stripeCreatedAt: new Date(sub.created * 1000),
          },
        });
        processed++;
      }

      if (!subscriptions.has_more) {
        break;
      }

      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    }

    return processed;
  }
}

export const stripeSyncService = new StripeSyncService();
