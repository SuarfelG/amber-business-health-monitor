import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config';

const prisma = new PrismaClient();

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  businessName: string;
  timezone: string;
  currency: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<TokenPair> {
    const { email, password, name, businessName, timezone, currency } = input;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        businessName,
        timezone,
        currency,
      },
    });

    return this.generateTokens(user.id);
  }

  async login(input: LoginInput): Promise<TokenPair> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return this.generateTokens(user.id);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
        userId: string;
      };

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Refresh token expired');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      return this.generateTokens(user.id);
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        timezone: true,
        currency: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private async generateTokens(userId: string): Promise<TokenPair> {
    const accessToken = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
    });

    const refreshToken = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiry,
    });

    const decodedRefresh = jwt.decode(refreshToken) as {
      exp: number;
    };
    const expiresAt = new Date(decodedRefresh.exp * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
