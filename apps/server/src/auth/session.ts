import crypto from 'node:crypto';
import type { Response, Request } from 'express';
import type { User, Session } from '@cms/schemas';
import { SessionStore } from '../storage/sessionStore.js';
import { config } from '../config/env.js';

export const SESSION_COOKIE_NAME = 'cms_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(user: User, res: Response): Promise<Session> {
  const sessionId = `sess_${crypto.randomBytes(32).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  const session: Session = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  await SessionStore.create(session);

  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/'
  });

  return session;
}

export async function getSessionFromRequest(req: Request): Promise<Session | null> {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId || typeof sessionId !== 'string') {
    return null;
  }

  return await SessionStore.get(sessionId);
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    await SessionStore.delete(sessionId);
  }

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/'
  });
}
