import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AddasModule } from './modules/addas/addas.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ChaosEngineModule } from './modules/chaos-engine/chaos-engine.module';
import { VibeCheckModule } from './modules/vibe-check/vibe-check.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AddasModule,
    InvitationsModule,
    ConversationsModule,
    MessagesModule,
    ChaosEngineModule,
    VibeCheckModule,
    NotificationsModule,
    UploadsModule,
    ModerationModule,
    RealtimeModule,
  ],
})
export class AppModule {}

