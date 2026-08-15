import { describe, expect, it } from 'vitest';
import { toSafeUserDto } from '../common/user-mapper';
import type { User } from '@prisma/client';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: '$2a$12$hashedpasswordhashvalue',
    avatar: 'https://res.cloudinary.com/example/image/upload/v1/avatar.jpg',
    role: 'USER',
    isVerified: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    ...overrides,
  };
}

describe('toSafeUserDto', () => {
  it('excludes the password hash', () => {
    const result = toSafeUserDto(makeUser());
    expect(result).not.toHaveProperty('password');
  });

  it('maps all safe fields', () => {
    const user = makeUser();
    const result = toSafeUserDto(user);

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it('keeps avatar null when unset', () => {
    const result = toSafeUserDto(makeUser({ avatar: null }));
    expect(result.avatar).toBeNull();
  });

  it('keeps verified flag', () => {
    const result = toSafeUserDto(makeUser({ isVerified: false }));
    expect(result.isVerified).toBe(false);
  });
});
