import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mockStore } from '../prisma/mock-store';
import { v4 as uuidv4 } from 'uuid';

export interface SetVibeInput {
  addaId?: string;
  mood: any;
  customNote?: string;
  durationHours?: number;
}

@Injectable()
export class VibeCheckService {
  constructor(private prisma: PrismaService) {}

  async setVibe(userId: string, input: SetVibeInput) {
    const user = mockStore.users.find((u) => u.id === userId) || {
      id: userId,
      displayName: 'You',
      username: 'you',
    };

    const newVibe = {
      id: `vibe-${uuidv4().substring(0, 8)}`,
      userId,
      user: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
      },
      addaId: input.addaId || 'adda-demo-1',
      mood: input.mood,
      customNote: input.customNote,
      expiresAt: new Date(Date.now() + (input.durationHours || 4) * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    mockStore.vibes.unshift(newVibe);
    return newVibe;
  }

  async getAddaVibes(addaId: string) {
    return mockStore.vibes.filter((v) => !v.addaId || v.addaId === addaId);
  }

  async getMyCircleVibes(userId: string) {
    return mockStore.vibes;
  }
}
