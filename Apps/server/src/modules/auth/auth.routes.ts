import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from './auth.middleware';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/me', authMiddleware, (req, res) => authController.getMe(req, res));
router.put('/me', authMiddleware, (req, res) => authController.updateSettings(req, res));

export default router;
