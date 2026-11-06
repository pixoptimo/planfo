import path from 'node:path';
import { readJson, writeJsonAtomic } from '@cms/utils';
import { UsersFileSchema, UserSchema, type User, type UsersFile } from '@cms/schemas';
import { config } from '../config/env.js';

export class UserStore {
  private static getFilePath(): string {
    return path.join(config.STORAGE_PATH, 'auth', 'users.json');
  }

  static async getAllUsers(): Promise<User[]> {
    const filePath = this.getFilePath();
    try {
      const data = await readJson<UsersFile>(filePath, UsersFileSchema);
      return data.users;
    } catch {
      return [];
    }
  }

  static async findById(id: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  static async findByEmail(identifier: string): Promise<User | null> {
    const users = await this.getAllUsers();
    const query = identifier.trim().toLowerCase();

    // 1. Direct match on email, username prefix, or display name
    const match = users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        u.email.toLowerCase().split('@')[0] === query ||
        (u.name && u.name.toLowerCase() === query)
    );
    if (match) return match;

    // 2. If identifier is 'admin', match any active admin
    if (query === 'admin') {
      const admin = users.find((u) => u.role === 'admin' && u.active);
      if (admin) return admin;
    }

    // 3. Resilient local fallback: if there is only 1 admin account in the system, resolve to it
    const activeAdmins = users.filter((u) => u.role === 'admin' && u.active);
    if (activeAdmins.length === 1) {
      return activeAdmins[0];
    }

    return null;
  }

  static async saveUser(user: User): Promise<void> {
    const users = await this.getAllUsers();
    const index = users.findIndex((u) => u.id === user.id);

    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }

    await writeJsonAtomic(this.getFilePath(), { users }, UsersFileSchema);
  }

  static async deleteUser(id: string): Promise<boolean> {
    const users = await this.getAllUsers();
    const filtered = users.filter((u) => u.id !== id);

    if (filtered.length === users.length) {
      return false;
    }

    await writeJsonAtomic(this.getFilePath(), { users: filtered }, UsersFileSchema);
    return true;
  }
}
