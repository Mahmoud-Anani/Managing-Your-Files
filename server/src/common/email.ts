import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env';

function createTransporter(): Transporter | null {
  if (!env.GMAIL_USER || !env.GMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_PASS,
    },
  });
}

const transporter: Transporter | null = createTransporter();

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const subject = 'Verify your Managing Your Files account';
  const text =
    `Hello,\n\n` +
    `Your verification code is ${code}.\n` +
    `It expires in 10 minutes. If you did not register, you can ignore this email.\n`;
  const html =
    `<p>Your verification code is</p>` +
    `<h2 style="letter-spacing:0.4em;font-family:monospace">${code}</h2>` +
    `<p>It expires in 10 minutes.</p>`;

  if (!transporter) {
    // SMTP is not configured (development): surface the code so flows can be
    // tested without a real email provider.
    console.warn(`[DEV EMAIL] Verification code for ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  code: string,
): Promise<void> {
  const subject = 'Reset your Managing Your Files password';
  const text =
    `Hello,\n\n` +
    `Your password reset code is ${code}.\n` +
    `It expires in 10 minutes. If you did not request a password reset, you can ignore this email.\n`;
  const html =
    `<p>Your password reset code is</p>` +
    `<h2 style="letter-spacing:0.4em;font-family:monospace">${code}</h2>` +
    `<p>It expires in 10 minutes.</p>` +
    `<p>If you did not request a password reset, you can ignore this email.</p>`;

  if (!transporter) {
    console.warn(`[DEV EMAIL] Password reset code for ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
