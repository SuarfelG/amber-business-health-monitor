import { Router } from 'express';
import { ghlController } from './ghl.controller';
import { ghlWebhooksController } from './ghl-webhooks.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// Webhook endpoint (no auth required, signature verified)
router.post('/webhooks', (req, res) =>
  ghlWebhooksController.handleWebhook(req, res)
);

router.get('/oauth/url', authMiddleware, (req, res) =>
  ghlController.generateOAuthUrl(req, res)
);

router.post('/oauth/callback', authMiddleware, (req, res) =>
  ghlController.handleOAuthCallback(req, res)
);

router.post('/connect', authMiddleware, (req, res) =>
  ghlController.connectWithApiKey(req, res)
);

router.get('/status', authMiddleware, (req, res) =>
  ghlController.getStatus(req, res)
);

router.delete('/disconnect', authMiddleware, (req, res) =>
  ghlController.disconnect(req, res)
);

router.post('/sync', authMiddleware, (req, res) =>
  ghlController.sync(req, res)
);

router.post('/backfill', authMiddleware, (req, res) =>
  ghlController.backfill(req, res)
);

router.get('/metrics', authMiddleware, (req, res) =>
  ghlController.getMetrics(req, res)
);

router.post('/metrics/recalculate', authMiddleware, (req, res) =>
  ghlController.recalculateMetrics(req, res)
);

export default router;
