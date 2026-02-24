import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  serverPort: parseInt(process.env.SERVER_PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
  integrations: {
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      clientId: process.env.STRIPE_CLIENT_ID || '',
      clientSecret: process.env.STRIPE_CLIENT_SECRET || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    gohighlevel: {
      clientId: process.env.GHL_CLIENT_ID || '',
      clientSecret: process.env.GHL_CLIENT_SECRET || '',
      webhookSecret: process.env.GHL_WEBHOOK_SECRET || '',
    },
  },
};
