import { Request, Response } from 'express';
import { getHealthScore } from './snapshot.service';
import { AuthRequest } from '../auth/auth.middleware';

export async function getSnapshot(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const periodType = (req.query.period as string) || 'week';

    if (periodType !== 'week' && periodType !== 'month') {
      return res.status(400).json({
        error: 'Invalid period. Use "week" or "month".',
      });
    }

    const result = await getHealthScore(userId, periodType as 'week' | 'month');

    res.json(result);
  } catch (error) {
    console.error('[Snapshot] Error:', error);
    res.status(500).json({
      error: 'Failed to compute health score',
    });
  }
}
