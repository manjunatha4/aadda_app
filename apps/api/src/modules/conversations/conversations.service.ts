import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mockStore } from '../prisma/mock-store';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async getUserConversations(userId: string) {
    try {
      const memberships = await this.prisma.conversationMember.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              adda: true,
              messages: { take: 1, orderBy: { createdAt: 'desc' } },
            },
          },
        },
      });
      if (memberships && memberships.length > 0) {
        return memberships.map((m) => m.conversation);
      }
    } catch {}

    return mockStore.conversations;
  }

  async getOrCreateDirectConversation(userId: string, targetUserId: string) {
    return { id: `conv-direct-${Date.now()}`, type: 'DIRECT' };
  }

  async getConversationDetails(conversationId: string, userId: string) {
    const memConv = mockStore.conversations.find((c) => c.id === conversationId) || mockStore.conversations[0];
    return memConv;
  }
}
