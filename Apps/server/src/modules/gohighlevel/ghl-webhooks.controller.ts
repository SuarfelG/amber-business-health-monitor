import { Request, Response } from 'express';
import { createHmac } from 'crypto';
import { config } from '../../config';
import { prisma } from '../../prisma';
import { ghlSyncService } from './ghl-sync.service';

interface GHLWebhookEvent {
  id?: string;
  type: string;
  data: Record<string, unknown>;
  locationId?: string;
}

export class GHLWebhooksController {
  async handleWebhook(req: Request, res: Response) {
    const signature = req.headers['x-ghl-signature'] as string;
    const webhookSecret = config.integrations.gohighlevel.webhookSecret;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    try {
      // Verify HMAC signature
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Check idempotency
      const eventId = event.id || `${event.type}-${Date.now()}`;
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: {
          provider_externalId: {
            provider: 'GOHIGHLEVEL',
            externalId: eventId,
          },
        },
      });

      if (existingEvent) {
        // Already processed
        return res.json({ received: true });
      }

      // Find user by locationId
      const locationId = event.locationId;
      if (!locationId) {
        return res.status(400).json({ error: 'Missing locationId' });
      }

      const integration = await prisma.integration.findFirst({
        where: {
          provider: 'GOHIGHLEVEL',
          accountId: locationId,
        },
        select: { userId: true },
      });

      if (!integration) {
        // Store unprocessed event
        await prisma.webhookEvent.create({
          data: {
            userId: 'unknown',
            provider: 'GOHIGHLEVEL',
            externalId: eventId,
            eventType: event.type,
            payload: event,
            processed: false,
          },
        });
        return res.json({ received: true });
      }

      const userId = integration.userId;

      // Process event based on type
      await this.processEvent(userId, event);

      // Mark event as processed
      await prisma.webhookEvent.upsert({
        where: {
          provider_externalId: {
            provider: 'GOHIGHLEVEL',
            externalId: eventId,
          },
        },
        update: {
          processed: true,
          processedAt: new Date(),
        },
        create: {
          userId,
          provider: 'GOHIGHLEVEL',
          externalId: eventId,
          eventType: event.type,
          payload: event,
          processed: true,
          processedAt: new Date(),
        },
      });

      return res.json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook error';
      console.error('GoHighLevel webhook error:', message);
      return res.status(400).json({ error: message });
    }
  }

  private async processEvent(userId: string, event: GHLWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'contact.create':
      case 'contact.update':
      case 'opportunity.create':
      case 'opportunity.update':
      case 'appointment.create':
      case 'appointment.update':
        // Trigger incremental sync
        ghlSyncService.syncUser(userId, 7).catch((err) => {
          console.error(`Webhook sync failed for user ${userId}:`, err);
        });
        break;

      default:
        // Ignore other events
        break;
    }
  }
}

export const ghlWebhooksController = new GHLWebhooksController();
