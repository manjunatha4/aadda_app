import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mockStore } from '../prisma/mock-store';
import { v4 as uuidv4 } from 'uuid';

export interface CreateChallengeInput {
  addaId: string;
  promptText: string;
  promptTextKn?: string;
  category: any;
  durationMinutes?: number;
}

export interface SubmitEntryInput {
  activityId: string;
  content?: string;
  mediaUrl?: string;
}

@Injectable()
export class ChaosEngineService {
  constructor(private prisma: PrismaService) {}

  private presetPrompts = [
    {
      promptText: 'Describe your best friend in the group in one word or slang!',
      promptTextKn: 'ಗ್ರೂಪ್‌ನಲ್ಲಿರುವ ನಿಮ್ಮ ಬೆಸ್ಟ್ ಫ್ರೆಂಡ್‌ನ ಒಂದೇ ಒಂದು ಪದ ಅಥವಾ ಸ್ಲ್ಯಾಂಗ್‌ನಲ್ಲಿ ವರ್ಣಿಸಿ!',
      category: 'ONE_WORD',
    },
    {
      promptText: 'Who is most likely to get arrested for something stupid?',
      promptTextKn: 'ಯಾವುದೋ ಸಣ್ಣ ಸಿಲ್ಲಿ ಕಾರಣಕ್ಕೆ ಜೈಲಿಗೆ ಹೋಗೋ ಚಾನ್ಸ್ ಯಾರಿಗಿದೆ?',
      category: 'MOST_LIKELY',
    },
    {
      promptText: 'Send a dramatic 5-second voice note of a famous Kannada movie dialogue!',
      promptTextKn: 'ಪ್ರಸಿದ್ಧ ಕನ್ನಡ ಚಿತ್ರದ ಡೈಲಾಗ್ ಅನ್ನು 5 ಸೆಕೆಂಡುಗಳ ಡ್ರಾಮಾ ವಾಯ್ಸ್ ನೋಟ್‌ನಲ್ಲಿ ಕಳುಹಿಸಿ!',
      category: 'VOICE_NOTE',
    },
    {
      promptText: 'Roast the person above you using only 3 emojis!',
      promptTextKn: 'ನಿಮ್ಮ ಮೇಲಿರುವ ವ್ಯಕ್ತಿಗೆ ಕೇವಲ 3 ಇಮೋಜಿ ಬಳಸಿ ರೋಸ್ಟ್ ಮಾಡಿ!',
      category: 'EMOJI_ROAST',
    },
  ];

  async getRandomPreset() {
    const randomIndex = Math.floor(Math.random() * this.presetPrompts.length);
    return this.presetPrompts[randomIndex];
  }

  async createChallenge(creatorId: string, input: CreateChallengeInput) {
    const user = mockStore.users.find((u) => u.id === creatorId) || {
      id: creatorId,
      displayName: 'Leader',
      username: 'leader',
    };

    const newActivity = {
      id: `chaos-${uuidv4().substring(0, 8)}`,
      addaId: input.addaId,
      creatorId,
      creator: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
      },
      promptText: input.promptText,
      promptTextKn: input.promptTextKn,
      category: input.category,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + (input.durationMinutes || 60) * 60000).toISOString(),
      entries: [],
    };

    mockStore.challenges.unshift(newActivity);
    return newActivity;
  }

  async getAddaChallenges(addaId: string, userId: string) {
    return mockStore.challenges;
  }

  async submitEntry(userId: string, input: SubmitEntryInput) {
    const user = mockStore.users.find((u) => u.id === userId) || {
      displayName: 'Member',
      username: 'member',
    };

    const challenge = mockStore.challenges.find((c) => c.id === input.activityId) || mockStore.challenges[0];
    if (challenge) {
      const entry = {
        id: `entry-${uuidv4().substring(0, 8)}`,
        activityId: challenge.id,
        userId,
        user: { displayName: user.displayName, username: user.username },
        content: input.content,
        mediaUrl: input.mediaUrl,
        voteCount: 1,
      };
      if (!challenge.entries) challenge.entries = [];
      challenge.entries.push(entry);
      return entry;
    }
    return { success: true };
  }

  async voteEntry(userId: string, entryId: string) {
    for (const c of mockStore.challenges) {
      if (c.entries) {
        const entry = c.entries.find((e: any) => e.id === entryId);
        if (entry) {
          entry.voteCount = (entry.voteCount || 0) + 1;
          return entry;
        }
      }
    }
    return { success: true };
  }
}
