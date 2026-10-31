import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { Language } from '@prisma/client';
import { mockStore, MockUser } from '../prisma/mock-store';

export interface RegisterInput {
  email: string;
  phone?: string;
  username: string;
  displayName: string;
  password?: string;
  language?: 'kn' | 'en';
  district?: string;
}

export interface LoginInput {
  login: string;
  password?: string;
  deviceToken?: string;
  platform?: 'android' | 'ios' | 'web';
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterInput) {
    const rawEmail = dto.email ? dto.email.toLowerCase().trim() : '';
    const rawUsername = dto.username ? dto.username.toLowerCase().trim() : (rawEmail.split('@')[0] || 'user');

    if (!rawEmail) {
      throw new BadRequestException('Please enter an email address');
    }

    // 1. If email or username already exists in mockStore -> Log in directly!
    const existingMem = mockStore.users.find(
      (u) => u.email.toLowerCase() === rawEmail || u.username.toLowerCase() === rawUsername,
    );

    if (existingMem) {
      const tokens = await this.generateTokens(existingMem.id, existingMem.username);
      const { passwordHash: _, ...userProfile } = existingMem;
      return { user: userProfile, tokens };
    }

    // 2. If exists in Prisma -> Log in directly!
    try {
      const existing = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: rawEmail }, { username: rawUsername }],
        },
      });

      if (existing) {
        const tokens = await this.generateTokens(existing.id, existing.username);
        const { passwordHash, ...userProfile } = existing;
        return { user: userProfile, tokens };
      }
    } catch {}

    // 3. Create new user
    const passwordHash = await argon2.hash(dto.password || 'defaultPass123');

    const newUser: MockUser = {
      id: `user-${uuidv4().substring(0, 8)}`,
      email: rawEmail,
      phone: dto.phone,
      username: rawUsername,
      displayName: dto.displayName?.trim() || rawUsername,
      passwordHash,
      district: dto.district || 'Bengaluru',
      language: dto.language || 'kn',
      isVerified: true,
      createdAt: new Date(),
    };

    mockStore.users.push(newUser);
    mockStore.saveToDisk();

    const tokens = await this.generateTokens(newUser.id, newUser.username);
    const { passwordHash: _, ...userProfile } = newUser;
    return { user: userProfile, tokens };
  }

  async login(dto: LoginInput) {
    const inputLogin = dto.login ? dto.login.toLowerCase().trim() : '';

    if (!inputLogin) {
      throw new BadRequestException('Please enter username or email');
    }

    // 1. Check in mockStore -> If user exists with this email or username, login directly!
    const memUser = mockStore.users.find(
      (u) => u.email.toLowerCase() === inputLogin || u.username.toLowerCase() === inputLogin,
    );

    if (memUser) {
      const tokens = await this.generateTokens(memUser.id, memUser.username);
      const { passwordHash: _, ...userProfile } = memUser;
      return { user: userProfile, tokens };
    }

    // 2. Check in Prisma -> If user exists, login directly!
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: inputLogin }, { username: inputLogin }],
        },
      });

      if (user) {
        const tokens = await this.generateTokens(user.id, user.username);
        const { passwordHash, ...userProfile } = user;
        return { user: userProfile, tokens };
      }
    } catch {}

    // 3. If user doesn't exist yet, auto-register seamlessly so they never see "invalid email"!
    const autoUsername = inputLogin.includes('@')
      ? inputLogin.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
      : inputLogin.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    const autoEmail = inputLogin.includes('@') ? inputLogin : `${inputLogin}@aadda.app`;
    const autoDisplayName = autoUsername.charAt(0).toUpperCase() + autoUsername.slice(1);

    const newUser: MockUser = {
      id: `user-${uuidv4().substring(0, 8)}`,
      email: autoEmail,
      username: autoUsername,
      displayName: autoDisplayName,
      district: 'Bengaluru',
      language: 'kn',
      isVerified: true,
      createdAt: new Date(),
    };

    mockStore.users.push(newUser);
    mockStore.saveToDisk();

    const tokens = await this.generateTokens(newUser.id, newUser.username);
    const { passwordHash: _, ...userProfile } = newUser;
    return { user: userProfile, tokens };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'aadda-ultra-secure-refresh-jwt-secret-key-32chars',
      });
      return this.generateTokens(payload.sub, payload.username);
    } catch {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    return { success: true };
  }

  private async generateTokens(userId: string, username: string) {
    const tokenId = uuidv4();

    const accessToken = this.jwtService.sign(
      { sub: userId, username },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'aadda-ultra-secure-access-jwt-secret-key-32chars',
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, username, tokenId },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'aadda-ultra-secure-refresh-jwt-secret-key-32chars',
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}
