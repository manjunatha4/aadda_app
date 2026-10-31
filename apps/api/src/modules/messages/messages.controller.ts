import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { MessagesService, SendMessageInput } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversation/:conversationId')
  async getMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('beforeId') beforeId?: string,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
      beforeId,
    );
  }

  @Post()
  async sendMessage(@Req() req: any, @Body() body: SendMessageInput) {
    return this.messagesService.sendMessage(req.user.id, body);
  }

  @Post('read')
  async markRead(
    @Req() req: any,
    @Body('conversationId') conversationId: string,
    @Body('messageId') messageId: string,
  ) {
    return this.messagesService.markAsRead(conversationId, req.user.id, messageId);
  }

  @Post(':id/reaction')
  async toggleReaction(
    @Req() req: any,
    @Param('id') messageId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.messagesService.toggleReaction(messageId, req.user.id, emoji);
  }

  @Patch(':id')
  async editMessage(
    @Req() req: any,
    @Param('id') messageId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.editMessage(messageId, req.user.id, content);
  }

  @Delete(':id')
  async deleteMessage(@Req() req: any, @Param('id') messageId: string) {
    return this.messagesService.deleteMessage(messageId, req.user.id);
  }
}

