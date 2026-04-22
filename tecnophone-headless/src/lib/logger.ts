/**
 * Structured logger for serverless environments.
 * Outputs JSON lines compatible with Vercel Log Drains, Datadog, Logflare, etc.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('checkout.started', { orderId, total });
 *   logger.error('woocommerce.fetch.failed', { url }, error);
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: Level =
  (process.env.LOG_LEVEL as Level) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: Level): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { value: String(err) };
}

function emit(
  level: Level,
  event: string,
  context?: Record<string, unknown>,
  err?: unknown
): void {
  if (!shouldLog(level)) return;

  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    ...(context || {}),
    ...(err ? { error: serializeError(err) } : {}),
  };

  // Use the matching console method so Vercel groups by severity
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;

  try {
    fn(JSON.stringify(payload));
  } catch {
    fn(`[${level}] ${event}`);
  }
}

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) =>
    emit('debug', event, context),
  info: (event: string, context?: Record<string, unknown>) =>
    emit('info', event, context),
  warn: (event: string, context?: Record<string, unknown>, err?: unknown) =>
    emit('warn', event, context, err),
  error: (event: string, context?: Record<string, unknown>, err?: unknown) =>
    emit('error', event, context, err),
};
