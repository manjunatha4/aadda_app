import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { AddaRole } from '@prisma/client';
import { mockStore } from '../prisma/mock-store';
import { v4 as uuidv4 } from 'uuid';

export interface CreateInviteInput {
  addaId: string;
  maxUses?: number;
  expiresInHours?: number;
}

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async createInvitation(creatorId: string, input: CreateInviteInput) {
    const rawCode = 'ADDA-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    try {
      const membership = await this.prisma.addaMember.findUnique({
        where: {
          addaId_userId: {
            addaId: input.addaId,
            userId: creatorId,
          },
        },
      });

      if (!membership || (membership.role !== AddaRole.OWNER && membership.role !== AddaRole.ADMIN)) {
        throw new ForbiddenException('Only owners and admins can generate invitations');
      }

      const codeHash = await argon2.hash(rawCode);
      const expiresAt = input.expiresInHours
        ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invitation = await this.prisma.invitation.create({
        data: {
          addaId: input.addaId,
          creatorId,
          codeHash,
          maxUses: input.maxUses || 10,
          usedCount: 0,
          expiresAt,
        },
      });

      return {
        id: invitation.id,
        addaId: invitation.addaId,
        inviteCode: rawCode,
        maxUses: invitation.maxUses,
        expiresAt: invitation.expiresAt,
      };
    } catch {
      // In-memory fallback
      const inv = {
        id: `inv-${uuidv4().substring(0, 8)}`,
        addaId: input.addaId,
        code: rawCode,
        maxUses: input.maxUses || 50,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
      };
      mockStore.invitations.unshift(inv);

      // also save inviteCode directly on adda
      const adda = mockStore.addas.find((a) => a.id === input.addaId);
      if (adda) {
        adda.inviteCode = rawCode;
      }
      mockStore.saveToDisk();

      return {
        id: inv.id,
        addaId: inv.addaId,
        inviteCode: rawCode,
        maxUses: inv.maxUses,
        expiresAt: inv.expiresAt,
      };
    }
  }

  async acceptInvitation(userId: string, rawCode: string) {
    const trimmedCode = rawCode.trim().toUpperCase();

    try {
      const invitations = await this.prisma.invitation.findMany({
        where: {
          isRevoked: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          adda: { include: { conversation: true } },
        },
      });

      for (const inv of invitations) {
        const match = await argon2.verify(inv.codeHash, trimmedCode).catch(() => false);
        if (match) {
          await this.prisma.$transaction(async (tx) => {
            await tx.addaMember.create({
              data: { addaId: inv.addaId, userId, role: AddaRole.MEMBER },
            });
            if (inv.adda.conversation) {
              await tx.conversationMember.create({
                data: { conversationId: inv.adda.conversation.id, userId },
              });
            }
            await tx.invitation.update({
              where: { id: inv.id },
              data: { usedCount: { increment: 1 } },
            });
          });
          return { success: true, adda: inv.adda, conversationId: inv.adda.conversation?.id };
        }
      }
    } catch {}

    // In-memory fallback
    const matched = mockStore.invitations.find((i) => i.code === trimmedCode);
    if (!matched) {
      throw new NotFoundException('Invalid invitation code');
    }

    const adda = mockStore.addas.find((a) => a.id === matched.addaId);
    if (!adda) {
      throw new NotFoundException('Adda not found');
    }

    const user = mockStore.users.find((u) => u.id === userId) || {
      id: userId,
      displayName: 'Member',
      username: 'member',
    };

    if (!adda.members) adda.members = [];
    if (!adda.members.some((m: any) => m.user?.id === userId)) {
      adda.members.push({
        id: `mem-${uuidv4().substring(0, 8)}`,
        role: 'MEMBER',
        user: { id: user.id, displayName: user.displayName, username: user.username },
      });
      adda.memberCount = adda.members.length;
    }

    const conv = mockStore.conversations.find((c) => c.addaId === adda.id);
    if (conv) {
      if (!conv.members) conv.members = [];
      conv.members.push({ userId: user.id, user });
    }

    matched.usedCount = (matched.usedCount || 0) + 1;
    mockStore.saveToDisk();

    return {
      success: true,
      adda,
      conversationId: adda.conversationId,
    };
  }

  async getAddaInvitations(addaId: string, userId: string) {
    return mockStore.invitations.filter((i) => i.addaId === addaId);
  }
}
