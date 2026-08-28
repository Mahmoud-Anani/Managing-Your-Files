import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from './config/prisma';
import { env } from './config/env';

interface AccessTokenPayload {
  userId: string;
  role: AccessTokenPayloadRole;
}

type AccessTokenPayloadRole = 'ADMIN' | 'USER';

function parseCookies(header?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) {
    return result;
  }
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(value);
      } catch {
        result[key] = value;
      }
    }
  }
  return result;
}

function extractToken(socket: Socket): string | null {
  // Prefer an explicit auth token, then fall back to the access_token cookie
  // (JWT is stored in an httpOnly cookie, which the polling handshake forwards).
  const authToken = socket.handshake.auth?.token as unknown;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }
  const cookies = parseCookies(socket.handshake.headers.cookie);
  return cookies.access_token ?? null;
}

function readSocketUser(socket: Socket): User | undefined {
  return (socket.data as unknown as { user?: User }).user;
}

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'production' ? env.CLIENT_ORIGIN : true,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = extractToken(socket);
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    } catch {
      next(new Error('Invalid or expired token'));
      return;
    }

    prisma.user
      .findUnique({ where: { id: payload.userId } })
      .then((user) => {
        if (!user) {
          next(new Error('User account no longer exists'));
          return;
        }
        (socket.data as unknown as { user: User }).user = user;
        next();
      })
      .catch(() => {
        next(new Error('Authentication failed'));
      });
  });

  io.on('connection', (socket) => {
    const user = readSocketUser(socket);
    if (!user) {
      socket.disconnect(true);
      return;
    }

    // Join the user-specific room so they only receive their own notifications.
    void socket.join(`user:${user.id}`);
    if (user.role === 'ADMIN') {
      void socket.join('admins');
    }
  });

  return io;
}

export function getSocketServer(): Server | null {
  return (globalThis as { __socketServer?: Server }).__socketServer ?? null;
}

export function emitToUser(
  io: Server,
  userId: string,
  event: string,
  payload: unknown,
): void {
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToAdmins(
  io: Server,
  event: string,
  payload: unknown,
): void {
  io.to('admins').emit(event, payload);
}
