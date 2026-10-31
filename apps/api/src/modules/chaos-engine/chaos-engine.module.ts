import { Module } from '@nestjs/common';
import { ChaosEngineService } from './chaos-engine.service';
import { ChaosEngineController } from './chaos-engine.controller';

@Module({
  controllers: [ChaosEngineController],
  providers: [ChaosEngineService],
  exports: [ChaosEngineService],
})
export class ChaosEngineModule {}

