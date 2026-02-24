import { Router } from 'express';
import { stripeController } from './stripe.controller';
import { stripeWebhooksController } from './stripe-webhooks.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// Webhook endpoint (no auth required, signature verified)
router.post('/webhooks', (req, res) =>
  stripeWebhooksController.handleWebhook(req, res)
);

router.get('/oauth/url', authMiddleware, (req, res) =>
  stripeController.generateOAuthUrl(req, res)
);

router.post('/oauth/callback', authMiddleware, (req, res) =>
  stripeController.handleOAuthCallback(req, res)
);

router.post('/connect', authMiddleware, (req, res) =>
  stripeController.connectWithApiKey(req, res)
);

router.get('/status', authMiddleware, (req, res) =>
  stripeController.getStatus(req, res)
);

router.delete('/disconnect', authMiddleware, (req, res) =>
  stripeController.disconnect(req, res)
);

router.post('/sync', authMiddleware, (req, res) =>
  stripeController.sync(req, res)
);

router.post('/backfill', authMiddleware, (req, res) =>
  stripeController.backfill(req, res)
);

router.get('/metrics', authMiddleware, (req, res) =>
  stripeController.getMetrics(req, res)
);

router.post('/metrics/recalculate', authMiddleware, (req, res) =>
  stripeController.recalculateMetrics(req, res)
);

export default router;
