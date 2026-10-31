import { Controller, Post, Delete, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('block/:userId')
  async blockUser(@Req() req: any, @Param('userId') userId: string) {
    return this.moderationService.blockUser(req.user.id, userId);
  }

  @Delete('block/:userId')
  async unblockUser(@Req() req: any, @Param('userId') userId: string) {
    return this.moderationService.unblockUser(req.user.id, userId);
  }

  @Get('blocks')
  async getBlockedUsers(@Req() req: any) {
    return this.moderationService.getBlockedUsers(req.user.id);
  }

  @Post('report')
  async reportUser(
    @Req() req: any,
    @Body() body: { reportedUserId?: string; reportedMessageId?: string; reason: string },
  ) {
    return this.moderationService.report(req.user.id, body);
  }
}

