import { Module } from '@nestjs/common';
import { AddasService } from './addas.service';
import { AddasController } from './addas.controller';

@Module({
  controllers: [AddasController],
  providers: [AddasService],
  exports: [AddasService],
})
export class AddasModule {}

