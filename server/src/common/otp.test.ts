import { describe, expect, it } from 'vitest';
import {
  generateOtpCode,
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
} from './otp';

describe('otp', () => {
  it('generates a 6-digit code', () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('pads codes shorter than 6 digits', () => {
    // Force low values by calling many times; all must be 6 digits.
    for (let i = 0; i < 1000; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it('produces varying codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateOtpCode()));
    expect(codes.size).toBeGreaterThan(1);
  });

  it('exposes expected TTL constants', () => {
    expect(OTP_TTL_MS).toBe(10 * 60 * 1000);
    expect(RESEND_COOLDOWN_MS).toBe(60 * 1000);
  });
});
