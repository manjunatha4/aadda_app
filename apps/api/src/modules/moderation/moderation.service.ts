import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    return this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      update: {},
      create: {
        blockerId,
        blockedId,
      },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });
  }

  async getBlockedUsers(blockerId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async report(reporterId: string, data: { reportedUserId?: string; reportedMessageId?: string; reason: string }) {
    return this.prisma.userReport.create({
      data: {
        reporterId,
        reportedUserId: data.reportedUserId,
        reportedMessageId: data.reportedMessageId,
        reason: data.reason,
        status: ReportStatus.PENDING,
      },
    });
  }
}

