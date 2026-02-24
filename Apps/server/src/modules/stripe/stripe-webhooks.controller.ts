import { Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../../config';
import { prisma } from '../../prisma';
import { stripeSyncService } from './stripe-sync.service';

export class StripeWebhooksController {
  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = config.integrations.stripe.webhookSecret;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    try {
      // Verify and construct event using Stripe.webhooks utility
      const event = Stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      ) as Stripe.Event;

      // Check idempotency
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: {
          provider_externalId: {
            provider: 'STRIPE',
            externalId: event.id,
          },
        },
      });

      if (existingEvent) {
        // Already processed, return success
        return res.json({ received: true });
      }

      // Find user by account ID
      const eventData = event.data.object as any;
      let userId: string | null = null;

      // Extract account ID from event
      if (eventData.customer) {
        // Charge, Invoice, or Subscription event
        const charge = await prisma.stripeCharge.findFirst({
          where: { externalId: eventData.id || '' },
          select: { userId: true },
        });
        userId = charge?.userId || null;
      }

      const payloadData = JSON.parse(JSON.stringify(event.data));

      if (!userId) {
        // Store unprocessed event for later
        await prisma.webhookEvent.create({
          data: {
            userId: 'unknown',
            provider: 'STRIPE',
            externalId: event.id,
            eventType: event.type,
            payload: payloadData,
            processed: false,
          },
        });
        return res.json({ received: true });
      }

      // Process event based on type
      await this.processEvent(userId, event);

      // Mark event as processed
      await prisma.webhookEvent.upsert({
        where: {
          provider_externalId: {
            provider: 'STRIPE',
            externalId: event.id,
          },
        },
        update: {
          processed: true,
          processedAt: new Date(),
        },
        create: {
          userId,
          provider: 'STRIPE',
          externalId: event.id,
          eventType: event.type,
          payload: payloadData,
          processed: true,
          processedAt: new Date(),
        },
      });

      return res.json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook error';
      console.error('Stripe webhook error:', message);
      return res.status(400).json({ error: message });
    }
  }

  private async processEvent(userId: string, event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'charge.succeeded':
      case 'charge.refunded':
      case 'customer.created':
      case 'invoice.paid':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Trigger incremental sync
        stripeSyncService.syncUser(userId, 7).catch((err) => {
          console.error(`Webhook sync failed for user ${userId}:`, err);
        });
        break;

      default:
        // Ignore other events
        break;
    }
  }
}

export const stripeWebhooksController = new StripeWebhooksController();
