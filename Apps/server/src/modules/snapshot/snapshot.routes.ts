import { Router } from 'express';
import { getSnapshot } from './snapshot.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

/**
 * GET /snapshot?period=week|month
 * Returns health score for the given period
 */
router.get('/', authMiddleware, getSnapshot);

export default router;
