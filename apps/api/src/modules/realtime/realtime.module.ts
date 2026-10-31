import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [JwtModule.register({}), MessagesModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class RealtimeModule {}

