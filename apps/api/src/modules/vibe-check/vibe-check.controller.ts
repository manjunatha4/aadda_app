import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { VibeCheckService, SetVibeInput } from './vibe-check.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vibe')
@UseGuards(JwtAuthGuard)
export class VibeCheckController {
  constructor(private readonly vibeService: VibeCheckService) {}

  @Post()
  async setVibe(@Req() req: any, @Body() body: SetVibeInput) {
    return this.vibeService.setVibe(req.user.id, body);
  }

  @Get('circle')
  async getCircleVibes(@Req() req: any) {
    return this.vibeService.getMyCircleVibes(req.user.id);
  }

  @Get('adda/:addaId')
  async getAddaVibes(@Param('addaId') addaId: string) {
    return this.vibeService.getAddaVibes(addaId);
  }
}

