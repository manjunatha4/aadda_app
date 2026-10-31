import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { InvitationsService, CreateInviteInput } from './invitations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async createInvitation(@Req() req: any, @Body() body: CreateInviteInput) {
    return this.invitationsService.createInvitation(req.user.id, body);
  }

  @Post('accept')
  async acceptInvitation(@Req() req: any, @Body('code') code: string) {
    return this.invitationsService.acceptInvitation(req.user.id, code);
  }

  @Get('adda/:addaId')
  async getAddaInvitations(@Req() req: any, @Param('addaId') addaId: string) {
    return this.invitationsService.getAddaInvitations(addaId, req.user.id);
  }
}

