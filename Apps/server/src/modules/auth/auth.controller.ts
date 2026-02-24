import { Response } from 'express';
import { AuthRequest } from './auth.middleware';
import { authService } from './auth.service';
import { config } from '../../config';

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const { email, password, name, businessName, timezone, currency } =
        req.body;

      if (!email || !password || !name || !businessName || !timezone || !currency) {
        return res.status(400).json({
          error: 'Email, password, name, business name, timezone, and currency are required',
        });
      }

      const { accessToken, refreshToken } = await authService.register({
        email,
        password,
        name,
        businessName,
        timezone,
        currency,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(201).json({ accessToken });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      return res.status(400).json({ error: message });
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const { accessToken, refreshToken } = await authService.login({
        email,
        password,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ accessToken });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return res.status(401).json({ error: message });
    }
  }

  async refresh(req: AuthRequest, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token not found' });
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await authService.refresh(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ accessToken });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Token refresh failed';
      return res.status(401).json({ error: message });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken');
      return res.json({ message: 'Logged out' });
    } catch (err) {
      res.clearCookie('refreshToken');
      return res.json({ message: 'Logged out' });
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await authService.getUser(req.userId);
      return res.json(user);
    } catch (err) {
      return res.status(404).json({ error: 'User not found' });
    }
  }

  async updateSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, businessName, timezone, currency } = req.body;

      if (!name || !businessName || !timezone || !currency) {
        return res.status(400).json({
          error: 'Name, business name, timezone, and currency are required',
        });
      }

      const user = await authService.updateUser(req.userId, {
        name,
        businessName,
        timezone,
        currency,
      });

      return res.json(user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Update failed';
      return res.status(400).json({ error: message });
    }
  }
}

export const authController = new AuthController();
