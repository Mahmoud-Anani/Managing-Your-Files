import type { User } from '@prisma/client';

export interface SafeUserDto {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeUserDto(user: User): SafeUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
