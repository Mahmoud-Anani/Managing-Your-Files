import 'dotenv/config';
import type { Response } from 'express';
import { AuthService } from '../src/modules/auth/auth.service';

async function main(): Promise<void> {
  const service = new AuthService();
  const mockRes = {
    cookie: () => {},
    clearCookie: () => {},
  } as unknown as Response;
  try {
    const result = await service.login(mockRes, {
      email: 'admin@example.com',
      password: 'Admin123',
    });
    console.log('LOGIN OK:', result.user?.email);
  } catch (error) {
    console.error('LOGIN ERROR:', (error as Error).message);
    console.error((error as Error).stack);
  }
}

void main();
