import { Controller, Post, Get, Param, Body, UseGuards, Req, Delete } from '@nestjs/common';
import { AddasService, CreateAddaInput } from './addas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('addas')
@UseGuards(JwtAuthGuard)
export class AddasController {
  constructor(private readonly addasService: AddasService) {}

  @Post()
  async createAdda(@Req() req: any, @Body() body: CreateAddaInput) {
    return this.addasService.createAdda(req.user.id, body);
  }

  @Get()
  async getMyAddas(@Req() req: any) {
    return this.addasService.getUserAddas(req.user.id);
  }

  @Get(':id')
  async getAdda(@Req() req: any, @Param('id') id: string) {
    return this.addasService.getAddaDetails(id, req.user.id);
  }

  @Delete(':id/leave')
  async leaveAdda(@Req() req: any, @Param('id') id: string) {
    return this.addasService.leaveAdda(id, req.user.id);
  }
}

