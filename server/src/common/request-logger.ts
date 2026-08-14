import type { NextFunction, Request, Response } from 'express';

const REDACTED = '[REDACTED]';
const MAX_DETAIL_LENGTH = 1000;
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'cookie',
  'code',
  'otp',
  'secret',
  'passwordhash',
]);

type LogLevel = 'LOG' | 'WARN' | 'ERROR';

const COLORS: Record<string, string> = {
  LOG: '\x1b[32m',
  WARN: '\x1b[33m',
  ERROR: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

const useColor = process.stdout.isTTY === true;

function color(code: string, text: string): string {
  return useColor ? `${COLORS[code] ?? ''}${text}${COLORS.reset}` : text;
}

function timestamp(): string {
  const now = new Date();
  const date = [now.getMonth() + 1, now.getDate(), now.getFullYear()]
    .map((part) => String(part).padStart(2, '0'))
    .join('/');
  const time = now.toLocaleTimeString('en-US', { hour12: true });
  return `${date}, ${time}`;
}

function nestLog(level: LogLevel, context: string, message: string): void {
  const prefix = color('gray', `[Server] ${process.pid}  - ${timestamp()}    `);
  const levelTag = color(level, `[${level}]`);
  const contextTag = color('magenta', `[${context}]`);
  process.stdout.write(`${prefix}${levelTag} ${contextTag} ${message}\n`);
}

function redact(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEYS.has(key.toLowerCase())) {
    return REDACTED;
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

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = process.hrtime.bigint();
  const query = detail('query', req.query);
  const headers = detail('headers', req.headers);

  nestLog(
    'LOG',
    'HTTP',
    `${color('cyan', `${req.method} ${req.path}`)}${query}${headers}`,
  );

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const duration =
      durationMs < 1000
        ? `${durationMs.toFixed(0)}ms`
        : `${(durationMs / 1000).toFixed(2)}s`;
    const level: LogLevel =
      res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'LOG';
    const body = detail('body', req.body);
    const user = req.user ? `  user=${req.user.id}` : '';

    nestLog(
      level,
      'HTTP',
      `${color(
        'cyan',
        `${req.method} ${req.originalUrl}`,
      )} -> ${color(level, String(res.statusCode))} ${duration}${body}${user}`,
    );
  });

  next();
}
