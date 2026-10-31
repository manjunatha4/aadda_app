import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddaRole, ConversationType } from '@prisma/client';
import { mockStore } from '../prisma/mock-store';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface CreateAddaInput {
  name: string;
  description?: string;
  avatarUrl?: string;
}

@Injectable()
export class AddasService {
  constructor(private prisma: PrismaService) {}

  async createAdda(creatorId: string, input: CreateAddaInput) {
    if (!input.name || !input.name.trim()) {
      throw new BadRequestException('Adda name is required');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const adda = await tx.adda.create({
          data: {
            name: input.name.trim(),
            description: input.description?.trim(),
            avatarUrl: input.avatarUrl,
            creatorId,
          },
        });

        await tx.addaMember.create({
          data: {
            addaId: adda.id,
            userId: creatorId,
            role: AddaRole.OWNER,
          },
        });

        const conversation = await tx.conversation.create({
          data: {
            type: ConversationType.ADDA,
            addaId: adda.id,
          },
        });

        await tx.conversationMember.create({
          data: {
            conversationId: conversation.id,
            userId: creatorId,
          },
        });

        return { ...adda, conversationId: conversation.id };
      });
    } catch {
      // Disk-backed persistent store fallback
      const creator = mockStore.users.find((u) => u.id === creatorId) || {
        id: creatorId,
        displayName: 'Creator',
        username: 'creator',
      };

      const addaId = `adda-${uuidv4().substring(0, 8)}`;
      const conversationId = `conv-${uuidv4().substring(0, 8)}`;
      const inviteCode = 'ADDA-' + crypto.randomBytes(3).toString('hex').toUpperCase();

      const newAdda = {
        id: addaId,
        name: input.name.trim(),
        description: input.description?.trim() || '',
        creatorId,
        conversationId,
        inviteCode,
        myRole: 'OWNER',
        memberCount: 1,
        members: [
          {
            id: `mem-${uuidv4().substring(0, 8)}`,
            role: 'OWNER',
            user: {
              id: creator.id,
              displayName: creator.displayName,
              username: creator.username,
            },
          },
        ],
        createdAt: new Date(),
      };

      mockStore.addas.unshift(newAdda);

      mockStore.conversations.unshift({
        id: conversationId,
        type: 'ADDA',
        addaId,
        addaName: newAdda.name,
        lastMessage: null,
        members: [
          {
            userId: creator.id,
            user: { id: creator.id, displayName: creator.displayName, username: creator.username },
          },
        ],
        updatedAt: new Date(),
      });

      mockStore.invitations.unshift({
        id: `inv-${uuidv4().substring(0, 8)}`,
        addaId,
        code: inviteCode,
        maxUses: 50,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
      });

      mockStore.saveToDisk();
      return newAdda;
    }
  }

  async getUserAddas(userId: string) {
    try {
      const memberships = await this.prisma.addaMember.findMany({
        where: { userId },
        include: {
          adda: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      displayName: true,
                      username: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              conversation: {
                select: { id: true },
              },
              _count: {
                select: { members: true },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      if (memberships && memberships.length > 0) {
        return memberships.map((m) => ({
          ...m.adda,
          myRole: m.role,
          joinedAt: m.joinedAt,
          memberCount: m.adda._count.members,
          conversationId: m.adda.conversation?.id,
        }));
      }
    } catch {
      // fallback
    }

    // Filter addas where this user is a member
    return mockStore.addas.filter(
      (a) => a.creatorId === userId || a.members?.some((m: any) => m.user?.id === userId),
    );
  }

  async getAddaDetails(addaId: string, userId: string) {
    try {
      const adda = await this.prisma.adda.findUnique({
        where: { id: addaId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  username: true,
                  avatarUrl: true,
                  bio: true,
                  district: true,
                },
              },
            },
          },
          conversation: { select: { id: true } },
          activities: { where: { status: 'ACTIVE' }, take: 3 },
          vibeStatuses: { where: { expiresAt: { gt: new Date() } } },
        },
      });
      if (adda) return adda;
    } catch {}

    const memAdda = mockStore.addas.find((a) => a.id === addaId);
    if (!memAdda) {
      throw new NotFoundException('Adda not found');
    }
    return memAdda;
  }

  async leaveAdda(addaId: string, userId: string) {
    const idx = mockStore.addas.findIndex((a) => a.id === addaId);
    if (idx >= 0) {
      mockStore.addas.splice(idx, 1);
      mockStore.saveToDisk();
    }
    return { success: true };
  }
}
