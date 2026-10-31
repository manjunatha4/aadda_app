import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  async connectToRedis(): Promise<void> {
    if (process.env.USE_REDIS === 'true') {
      try {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        const pubClient = new Redis({ host, port });
        const subClient = pubClient.duplicate();

        pubClient.on('error', (err) => console.warn('⚠️ Redis error:', err.message));
        subClient.on('error', (err) => console.warn('⚠️ Redis subClient error:', err.message));

        this.adapterConstructor = createAdapter(pubClient, subClient);
        console.log('✅ Connected to Redis Socket.IO adapter');
      } catch (e: any) {
        console.warn('⚠️ Falling back to default in-memory Socket.IO adapter');
      }
    } else {
      console.log('ℹ️ Using high-performance in-memory Socket.IO adapter');
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
