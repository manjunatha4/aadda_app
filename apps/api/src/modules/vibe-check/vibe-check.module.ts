import { Module } from '@nestjs/common';
import { VibeCheckService } from './vibe-check.service';
import { VibeCheckController } from './vibe-check.controller';

@Module({
  controllers: [VibeCheckController],
  providers: [VibeCheckService],
  exports: [VibeCheckService],
})
export class VibeCheckModule {}

