import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import authRoutes from './modules/auth/auth.routes';

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(config.serverPort, () => {
  console.log(`Server running on port ${config.serverPort}`);
});
