import { describe, expect, it } from 'vitest';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  deleteAccountSchema,
} from './auth.dto';

describe('registerSchema', () => {
  it('accepts a valid payload', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'JANE@Example.com',
      password: 'password1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('jane@example.com');
    }
  });

  it('rejects a short name', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'jane@example.com',
      password: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'not-an-email',
      password: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password without a number', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'abc1',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts a valid payload', () => {
    expect(loginSchema.safeParse({ email: 'jane@example.com', password: 'x' }).success).toBe(true);
  });

  it('rejects a missing password', () => {
    expect(loginSchema.safeParse({ email: 'jane@example.com' }).success).toBe(false);
  });
});

describe('verifyEmailSchema', () => {
  it('accepts a 6-digit code', () => {
    expect(
      verifyEmailSchema.safeParse({ email: 'jane@example.com', code: '123456' }).success,
    ).toBe(true);
  });

  it('rejects a non-6-digit code', () => {
    expect(
      verifyEmailSchema.safeParse({ email: 'jane@example.com', code: '12345' }).success,
    ).toBe(false);
  });

  it('rejects a non-numeric code', () => {
    expect(
      verifyEmailSchema.safeParse({ email: 'jane@example.com', code: 'abcdef' }).success,
    ).toBe(false);
  });
});

describe('resendCodeSchema', () => {
  it('accepts an email', () => {
    expect(resendCodeSchema.safeParse({ email: 'jane@example.com' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(resendCodeSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const valid = {
    email: 'jane@example.com',
    code: '123456',
    password: 'newpass1',
    confirmPassword: 'newpass1',
  };

  it('accepts a valid payload', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(
      resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'different1' }).success,
    ).toBe(false);
  });

  it('rejects an invalid code', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, code: 'abc' }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'oldpass1',
    newPassword: 'newpass1',
    confirmPassword: 'newpass1',
  };

  it('accepts a valid payload', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, confirmPassword: 'nope1' }).success,
    ).toBe(false);
  });

  it('rejects a new password without a number', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: 'newpassword', confirmPassword: 'newpassword' }).success,
    ).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts a valid name', () => {
    expect(updateProfileSchema.safeParse({ name: 'Jane Doe' }).success).toBe(true);
  });

  it('rejects a short name', () => {
    expect(updateProfileSchema.safeParse({ name: 'J' }).success).toBe(false);
  });
});

describe('deleteAccountSchema', () => {
  it('accepts a password', () => {
    expect(deleteAccountSchema.safeParse({ password: 'secret' }).success).toBe(true);
  });

  it('rejects a missing password', () => {
    expect(deleteAccountSchema.safeParse({}).success).toBe(false);
  });
});
