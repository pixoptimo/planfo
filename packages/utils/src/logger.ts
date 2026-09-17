export type LogLevel = 'info' | 'warn' | 'error' | 'audit';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'secret',
  'cookie',
  'authorization',
  'sessionid',
  'jwt'
]);

function scrubSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => scrubSensitive(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubSensitive(value, depth + 1);
      }
    }
    return scrubbed;
  }

  return obj;
}

export class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.service,
      level,
      message,
      ...(meta ? { meta: scrubSensitive(meta) } : {})
    };

    const formatted = JSON.stringify(entry);
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  audit(action: string, meta?: Record<string, unknown>): void {
    this.log('audit', `Audit: ${action}`, meta);
  }
}

export const logger = new Logger('cms');
