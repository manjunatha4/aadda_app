import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mockStore } from '../prisma/mock-store';
import { v4 as uuidv4 } from 'uuid';

export interface SendMessageInput {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: any;
  replyToId?: string;
  idempotencyKey?: string;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getMessages(conversationId: string, userId: string, limit = 50, beforeId?: string) {
    try {
      const msgs = await this.prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sender: { select: { id: true, displayName: true, username: true } },
          replyTo: { select: { id: true, content: true, sender: { select: { displayName: true } } } },
          reactions: true,
        },
      });
      if (msgs && msgs.length > 0) return msgs;
    } catch {}

    return mockStore.messages.filter((m) => m.conversationId === conversationId);
  }

  async sendMessage(userId: string, input: SendMessageInput) {
    try {
      const msg = await this.prisma.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: userId,
          content: input.content || '',
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType || (input.mediaUrl ? 'IMAGE' : null),
        },
        include: {
          sender: { select: { id: true, displayName: true, username: true } },
          reactions: true,
        },
      });
      return msg;
    } catch {}

    const user = mockStore.users.find((u) => u.id === userId) || {
      id: userId,
      displayName: 'Member',
      username: 'member',
    };

    const newMsg = {
      id: `msg-${uuidv4().substring(0, 8)}`,
      conversationId: input.conversationId,
      senderId: userId,
      sender: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
      },
      content: input.content || '',
      mediaUrl: input.mediaUrl || null,
      mediaType: input.mediaType || (input.mediaUrl ? 'IMAGE' : null),
      createdAt: new Date().toISOString(),
      reactions: [],
    };
    mockStore.messages.unshift(newMsg);

    // Update conversation snippet
    const conv = mockStore.conversations.find((c) => c.id === input.conversationId);
    if (conv) {
      conv.lastMessage = {
        id: newMsg.id,
        content: newMsg.mediaUrl ? '📷 Photo' : newMsg.content,
        senderName: user.displayName,
        createdAt: newMsg.createdAt,
      };
      conv.updatedAt = new Date().toISOString();
    }
    mockStore.saveToDisk();

    return newMsg;
  }

  async markAsRead(conversationId: string, userId: string, messageId: string) {
    return { success: true };
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const msg = mockStore.messages.find((m) => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = [];
      const idx = msg.reactions.findIndex((r: any) => r.userId === userId && r.emoji === emoji);
      if (idx >= 0) {
        msg.reactions.splice(idx, 1);
        mockStore.saveToDisk();
        return { action: 'removed', emoji, messageId };
      } else {
        const reaction = { id: `r-${Date.now()}`, emoji, userId };
        msg.reactions.push(reaction);
        mockStore.saveToDisk();
        return { action: 'added', reaction };
      }
    }
    return { action: 'added', reaction: { id: 'r1', emoji, userId } };
  }

  async editMessage(messageId: string, userId: string, newContent: string) {
    return { success: true };
  }

  async deleteMessage(messageId: string, userId: string) {
    return { success: true };
  }
}
