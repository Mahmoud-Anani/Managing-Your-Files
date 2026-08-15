import 'dotenv/config';
import { AuthService } from '../src/modules/auth/auth.service';

async function main(): Promise<void> {
  const service = new AuthService();
  try {
    const result = await service.login({
      email: 'admin@example.com',
      password: 'Admin123',
    });
    console.log('LOGIN OK:', result.token ? 'token present' : 'no token', result.user?.email);
  } catch (error) {
    console.error('LOGIN ERROR:', (error as Error).message);
    console.error((error as Error).stack);
  }
}

void main();
