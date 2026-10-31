import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getMyConversations(@Req() req: any) {
    return this.conversationsService.getUserConversations(req.user.id);
  }

  @Post('direct')
  async getOrCreateDirect(@Req() req: any, @Body('targetUserId') targetUserId: string) {
    return this.conversationsService.getOrCreateDirectConversation(req.user.id, targetUserId);
  }

  @Get(':id')
  async getConversationDetails(@Req() req: any, @Param('id') id: string) {
    return this.conversationsService.getConversationDetails(id, req.user.id);
  }
}

