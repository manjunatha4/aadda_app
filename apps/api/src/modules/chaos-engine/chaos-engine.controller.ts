import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ChaosEngineService, CreateChallengeInput, SubmitEntryInput } from './chaos-engine.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chaos')
@UseGuards(JwtAuthGuard)
export class ChaosEngineController {
  constructor(private readonly chaosService: ChaosEngineService) {}

  @Get('presets')
  async getPreset() {
    return this.chaosService.getRandomPreset();
  }

  @Post('challenge')
  async createChallenge(@Req() req: any, @Body() body: CreateChallengeInput) {
    return this.chaosService.createChallenge(req.user.id, body);
  }

  @Get('adda/:addaId')
  async getAddaChallenges(@Req() req: any, @Param('addaId') addaId: string) {
    return this.chaosService.getAddaChallenges(addaId, req.user.id);
  }

  @Post('submit')
  async submitEntry(@Req() req: any, @Body() body: SubmitEntryInput) {
    return this.chaosService.submitEntry(req.user.id, body);
  }

  @Post('vote/:entryId')
  async voteEntry(@Req() req: any, @Param('entryId') entryId: string) {
    return this.chaosService.voteEntry(req.user.id, entryId);
  }
}

