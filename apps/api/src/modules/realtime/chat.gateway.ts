import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { SocketEvents } from '@aadda/shared';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Active online users mapping: userId -> Set of socketIds
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization || client.handshake.auth?.token;
      if (!authHeader) {
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/, '');
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'aadda-ultra-secure-access-jwt-secret-key-32chars',
      });

      client.data.user = payload;
      const userId = payload.sub;

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // Auto-join user to their personal room for direct notifications
      client.join(`user:${userId}`);

      // Auto-join user's conversation rooms
      const userConversations = await this.prisma.conversationMember.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      userConversations.forEach((c) => {
        client.join(`conv:${c.conversationId}`);
      });

      // Broadcast user presence
      this.server.emit(SocketEvents.PRESENCE_ONLINE, { userId });
      client.emit(SocketEvents.AUTHENTICATED, { userId, username: payload.username });
    } catch {
      client.emit(SocketEvents.UNAUTHORIZED, { message: 'Authentication required' });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    if (userId && this.onlineUsers.has(userId)) {
      const sockets = this.onlineUsers.get(userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
        this.server.emit(SocketEvents.PRESENCE_OFFLINE, { userId });
      }
    }
  }

  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    try {
      const member = await this.prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: data.conversationId,
            userId,
          },
        },
      });

      if (member) {
        client.join(`conv:${data.conversationId}`);
        client.emit(SocketEvents.ROOM_JOINED, { conversationId: data.conversationId });
      }
    } catch {
      // In-memory / preview fallback
      client.join(`conv:${data.conversationId}`);
      client.emit(SocketEvents.ROOM_JOINED, { conversationId: data.conversationId });
    }
  }

  @SubscribeMessage(SocketEvents.LEAVE_ROOM)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conv:${data.conversationId}`);
    client.emit(SocketEvents.ROOM_LEFT, { conversationId: data.conversationId });
  }

  @SubscribeMessage(SocketEvents.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      clientMessageId?: string;
      conversationId: string;
      content: string;
      mediaUrl?: string;
      mediaType?: any;
      replyToId?: string;
      idempotencyKey?: string;
    },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const message = await this.messagesService.sendMessage(userId, {
      conversationId: data.conversationId,
      content: data.content,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      replyToId: data.replyToId,
      idempotencyKey: data.idempotencyKey,
    });

    // Broadcast new message to conversation room
    this.server.to(`conv:${data.conversationId}`).emit(SocketEvents.NEW_MESSAGE, message);

    // Send delivery acknowledgement back to sender
    client.emit(SocketEvents.MESSAGE_ACK, {
      clientMessageId: data.clientMessageId,
      messageId: message.id,
      conversationId: message.conversationId,
      timestamp: new Date(message.createdAt).toISOString(),
    });
  }

  @SubscribeMessage(SocketEvents.TYPING_START)
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    client.to(`conv:${data.conversationId}`).emit(SocketEvents.USER_TYPING, {
      conversationId: data.conversationId,
      userId: user.sub,
      username: user.username,
      isTyping: true,
    });
  }

  @SubscribeMessage(SocketEvents.TYPING_STOP)
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    client.to(`conv:${data.conversationId}`).emit(SocketEvents.USER_TYPING, {
      conversationId: data.conversationId,
      userId: user.sub,
      username: user.username,
      isTyping: false,
    });
  }

  @SubscribeMessage(SocketEvents.MESSAGE_READ)
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    await this.messagesService.markAsRead(data.conversationId, userId, data.messageId);

    // Broadcast read receipt to room
    client.to(`conv:${data.conversationId}`).emit(SocketEvents.READ_RECEIPT, {
      conversationId: data.conversationId,
      userId,
      messageId: data.messageId,
      readAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage(SocketEvents.ADD_REACTION)
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string; emoji: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const result = await this.messagesService.toggleReaction(data.messageId, userId, data.emoji);

    this.server.to(`conv:${data.conversationId}`).emit(SocketEvents.REACTION_UPDATED, {
      ...result,
      conversationId: data.conversationId,
      userId,
    });
  }
}

