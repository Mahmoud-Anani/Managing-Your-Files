import type { NextFunction, Request, Response } from 'express';

const RESET = '\x1b[0m';
const GRAY = '\x1b[90m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const useColor = process.stdout.isTTY === true;

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'cookie',
  'code',
  'otp',
  'secret',
]);
const MAX_DETAIL_LENGTH = 1000;

function color(code: string, text: string): string {
  return useColor ? `${code}${text}${RESET}` : text;
}

function timestamp(): string {
  const now = new Date();
  const date = [now.getMonth() + 1, now.getDate(), now.getFullYear()]
    .map((part) => String(part).padStart(2, '0'))
    .join('/');
  const time = now.toLocaleTimeString('en-US', { hour12: true });
  return `${date}, ${time}`;
}

function nestLog(
  level: 'LOG' | 'WARN' | 'ERROR',
  context: string,
  message: string,
): void {
  const prefix = color(
    GRAY,
    `[Server] ${process.pid}  - ${timestamp()}    `,
  );
  const levelColor =
    level === 'ERROR' ? RED : level === 'WARN' ? YELLOW : GRAY;
  const levelTag = color(levelColor, `[${level}]`);
  const contextTag = color(MAGENTA, `[${context}]`);
  process.stdout.write(`${prefix}${levelTag} ${contextTag} ${message}\n`);
}

function redact(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEYS.has(key.toLowerCase())) {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        redact(v, k),
      ]),
    );
  }
  return value;
}

function stringify(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  let text = '';
  try {
    text = JSON.stringify(value);
  } catch {
    text = '[Unserializable]';
  }
  if (text.length > MAX_DETAIL_LENGTH) {
    text = `${text.slice(0, MAX_DETAIL_LENGTH)}...`;
  }
  return text;
}

function detail(label: string, value: unknown): string {
  const text = stringify(redact(value));
  if (!text || text === '{}' || text === '[]') {
    return '';
  }
  return `  ${label}=${text}`;
}

function statusColor(statusCode: number): string {
  if (statusCode >= 500) {
    return RED;
  }
  if (statusCode >= 400) {
    return YELLOW;
  }
  return GREEN;
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = process.hrtime.bigint();
  const route = `${req.method} ${req.originalUrl}`;

  nestLog('LOG', 'HTTP', color(CYAN, route));

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const duration =
      durationMs < 1000
        ? `${durationMs.toFixed(0)}ms`
        : `${(durationMs / 1000).toFixed(2)}s`;
    const level: 'LOG' | 'WARN' | 'ERROR' =
      res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'LOG';
    const status = color(statusColor(res.statusCode), String(res.statusCode));
    const details =
      detail('query', req.query) +
      detail('body', req.body) +
      (req.user ? `  user=${req.user.id}` : '');

    nestLog(
      level,
      'HTTP',
      `${color(CYAN, route)} -> ${status} ${duration}${details}`,
    );
  });

  next();
}
