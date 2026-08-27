import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'production' ? env.CLIENT_ORIGIN : true,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-user-room', (userId?: string) => {
      if (!userId) {
        return;
      }
      socket.join(`user:${userId}`);
    });

    socket.on('join-admin-room', () => {
      socket.join('admins');
    });
  });

  return io;
}

export function emitToUser(
  io: Server,
  userId: string,
  event: string,
  payload: unknown,
) {
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToAdmins(io: Server, event: string, payload: unknown) {
  io.to('admins').emit(event, payload);
}
