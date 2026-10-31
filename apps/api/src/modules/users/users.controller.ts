import { Controller, Get, Patch, Body, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Language } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getMyProfile(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: any,
    @Body() body: { displayName?: string; bio?: string; district?: string; avatarUrl?: string; language?: Language },
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get('search')
  async search(@Req() req: any, @Query('q') query: string) {
    return this.usersService.searchUsers(query || '', req.user.id);
  }
}

