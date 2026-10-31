import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { mockStore } from '../prisma/mock-store';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'aadda-ultra-secure-access-jwt-secret-key-32chars',
    });
  }

  async validate(payload: { sub: string; username: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          language: true,
          avatarUrl: true,
          district: true,
          bio: true,
          isVerified: true,
        },
      });

      if (user) return user;
    } catch {
      // proceed to mock
    }

    const memUser = mockStore.users.find((u) => u.id === payload.sub || u.username === payload.username);
    if (memUser) {
      return {
        id: memUser.id,
        email: memUser.email,
        username: memUser.username,
        displayName: memUser.displayName,
        language: memUser.language,
        avatarUrl: memUser.avatarUrl,
        district: memUser.district,
        bio: memUser.bio,
        isVerified: memUser.isVerified,
      };
    }

    return {
      id: payload.sub,
      username: payload.username,
      displayName: payload.username,
      language: 'kn',
      district: 'Bengaluru',
      isVerified: true,
    };
  }
}
