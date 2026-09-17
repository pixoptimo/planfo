import path from 'node:path';
import { readJson, writeJsonAtomic, deleteFileSafe, listJsonFiles, safeResolvePath } from '@cms/utils';
import { SessionSchema, type Session } from '@cms/schemas';
import { config } from '../config/env.js';

export class SessionStore {
  private static getFilePath(sessionId: string): string {
    return safeResolvePath(config.SESSION_PATH, `${sessionId}.json`);
  }

  static async create(session: Session): Promise<void> {
    const filePath = this.getFilePath(session.id);
    await writeJsonAtomic(filePath, session, SessionSchema);
  }

  static async get(sessionId: string): Promise<Session | null> {
    try {
      const filePath = this.getFilePath(sessionId);
      const session = await readJson<Session>(filePath, SessionSchema);

      // Check if expired
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        await this.delete(sessionId);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  static async delete(sessionId: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(sessionId);
      return await deleteFileSafe(filePath);
    } catch {
      return false;
    }
  }

  static async cleanExpired(): Promise<void> {
    const files = await listJsonFiles(config.SESSION_PATH);
    const now = Date.now();

    for (const file of files) {
      try {
        const session = await readJson<Session>(file, SessionSchema);
        if (new Date(session.expiresAt).getTime() < now) {
          await deleteFileSafe(file);
        }
      } catch {
        await deleteFileSafe(file);
      }
    }
  }
}
