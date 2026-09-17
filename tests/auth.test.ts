import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword } from '../apps/server/src/auth/password.js';
import { UserStore } from '../apps/server/src/storage/userStore.js';
import { SessionStore } from '../apps/server/src/storage/sessionStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import type { User, Session } from '@cms/schemas';

describe('Authentication & Security Layer', () => {
  beforeAll(async () => {
    await initializeStorage();
  });

  it('should hash and verify passwords using Argon2id', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toContain('$argon2id$');
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isWrongValid = await verifyPassword('WrongPassword123!', hash);
    expect(isWrongValid).toBe(false);
  });

  it('should create and retrieve users securely', async () => {
    const email = `testuser_${Date.now()}@example.com`;
    const passwordHash = await hashPassword('TestPassword123!');
    const user: User = {
      id: `usr_${Date.now()}`,
      email,
      passwordHash,
      role: 'editor',
      name: 'Test Editor',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await UserStore.saveUser(user);
    const retrieved = await UserStore.findByEmail(email);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.email).toBe(email);
    expect(retrieved?.role).toBe('editor');
    expect(retrieved?.passwordHash).toBe(passwordHash);
  });

  it('should handle session lifecycle and expirations on filesystem', async () => {
    const sessionId = `sess_test_${Date.now()}`;
    const futureSession: Session = {
      id: sessionId,
      userId: 'usr_test_1',
      email: 'test@example.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString()
    };

    await SessionStore.create(futureSession);
    const valid = await SessionStore.get(sessionId);
    expect(valid).not.toBeNull();
    expect(valid?.email).toBe('test@example.com');

    // Expired session
    const expiredId = `sess_expired_${Date.now()}`;
    const expiredSession: Session = {
      id: expiredId,
      userId: 'usr_test_1',
      email: 'test@example.com',
      role: 'admin',
      createdAt: new Date(Date.now() - 100000).toISOString(),
      expiresAt: new Date(Date.now() - 50000).toISOString() // in the past
    };
    await SessionStore.create(expiredSession);

    const expiredResult = await SessionStore.get(expiredId);
    expect(expiredResult).toBeNull(); // Automatically cleaned and returns null
  });
});
