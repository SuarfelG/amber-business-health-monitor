import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { stripeService } from './stripe.service';
import { stripeSyncService } from './stripe-sync.service';
import { stripeAggregatesService } from './stripe-aggregates.service';

export class StripeController {
  async generateOAuthUrl(req: AuthRequest, res: Response) {
    try {
      console.log('[Stripe] generateOAuthUrl called, userId:', req.userId);

      if (!req.userId) {
        console.log('[Stripe] Missing userId, returning 401');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const oauthUrl = stripeService.generateOAuthUrl(req.userId);
      console.log('[Stripe] OAuth URL generated successfully');
      return res.json({ oauthUrl });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate OAuth URL';
      console.error('[Stripe] Error generating OAuth URL:', message);
      return res.status(400).json({ error: message });
    }
  }

  async handleOAuthCallback(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state' });
      }

      await stripeService.handleOAuthCallback(
        req.userId,
        code as string,
        state as string
      );

      return res.json({ message: 'Stripe connected successfully' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect Stripe';
      return res.status(400).json({ error: message });
    }
  }

  async connectWithApiKey(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'API key required' });
      }

      await stripeService.connectWithApiKey(req.userId, apiKey);
      return res.json({ message: 'Stripe connected successfully' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect Stripe';
      return res.status(400).json({ error: message });
    }
  }

  async getStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await stripeService.getConnectionStatus(req.userId);
      return res.json(status);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to get status';
      return res.status(400).json({ error: message });
    }
  }

  async disconnect(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await stripeService.disconnect(req.userId);
      return res.json({ message: 'Stripe disconnected' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to disconnect';
      return res.status(400).json({ error: message });
    }
  }

  async sync(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Run async without waiting
      stripeSyncService.syncUser(req.userId, 7).catch((err) => {
        console.error(`Sync failed for user ${req.userId}:`, err);
      });

      return res.json({ message: 'Sync started' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start sync';
      return res.status(400).json({ error: message });
    }
  }

  async backfill(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Run async without waiting
      stripeSyncService.backfillUser(req.userId).catch((err) => {
        console.error(`Backfill failed for user ${req.userId}:`, err);
      });

      return res.json({ message: 'Backfill started' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start backfill';
      return res.status(400).json({ error: message });
    }
  }

  async getMetrics(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { period = 'week', limit = '12' } = req.query;
      const periodType = period as 'day' | 'week' | 'month';
      const limitNum = Math.min(parseInt(limit as string) || 12, 100);

      if (!['day', 'week', 'month'].includes(periodType)) {
        return res
          .status(400)
          .json({ error: 'Period must be day, week, or month' });
      }

      const metrics = await stripeAggregatesService.getMetrics(
        req.userId,
        periodType,
        limitNum
      );

      return res.json(metrics);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to get metrics';
      return res.status(400).json({ error: message });
    }
  }

  async recalculateMetrics(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Run async without waiting
      stripeAggregatesService.recalculateForUser(req.userId).catch((err) => {
        console.error(`Metrics recalculation failed for user ${req.userId}:`, err);
      });

      return res.json({ message: 'Metrics recalculation started' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start recalculation';
      return res.status(400).json({ error: message });
    }
  }
}

export const stripeController = new StripeController();
