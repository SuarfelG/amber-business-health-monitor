import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { ghlService } from './ghl.service';
import { ghlSyncService } from './ghl-sync.service';
import { ghlAggregatesService } from './ghl-aggregates.service';

export class GHLController {
  async generateOAuthUrl(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const oauthUrl = ghlService.generateOAuthUrl(req.userId);
      return res.json({ oauthUrl });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate OAuth URL';
      return res.status(400).json({ error: message });
    }
  }

  async handleOAuthCallback(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { code, state, locationId } = req.query;

      if (!code || !state || !locationId) {
        return res.status(400).json({ error: 'Missing code, state, or locationId' });
      }

      await ghlService.handleOAuthCallback(
        req.userId,
        code as string,
        state as string,
        locationId as string
      );

      console.log(`[AUDIT] userId=${req.userId} connected gohighlevel at ${new Date().toISOString()} via oauth`);

      return res.json({ message: 'GoHighLevel connected successfully' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect GoHighLevel';
      return res.status(400).json({ error: message });
    }
  }

  async connectWithApiKey(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { apiKey, locationId } = req.body;

      if (!apiKey || !locationId) {
        return res.status(400).json({ error: 'API key and location ID required' });
      }

      await ghlService.connectWithApiKey(req.userId, apiKey, locationId);

      console.log(`[AUDIT] userId=${req.userId} connected gohighlevel at ${new Date().toISOString()} via apikey`);

      return res.json({ message: 'GoHighLevel connected successfully' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect GoHighLevel';
      return res.status(400).json({ error: message });
    }
  }

  async getStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await ghlService.getConnectionStatus(req.userId);
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

      await ghlService.disconnect(req.userId);

      console.log(`[AUDIT] userId=${req.userId} disconnected gohighlevel at ${new Date().toISOString()}`);

      return res.json({ message: 'GoHighLevel disconnected' });
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
      ghlSyncService.syncUser(req.userId, 7).catch((err) => {
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
      ghlSyncService.backfillUser(req.userId).catch((err) => {
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

      const metrics = await ghlAggregatesService.getMetrics(
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
      ghlAggregatesService.recalculateForUser(req.userId).catch((err) => {
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

export const ghlController = new GHLController();
