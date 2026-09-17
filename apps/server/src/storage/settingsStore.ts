import path from 'node:path';
import { readJson, writeJsonAtomic } from '@cms/utils';
import { SiteSettingsSchema, type SiteSettings } from '@cms/schemas';
import { config } from '../config/env.js';

export class SettingsStore {
  private static getFilePath(): string {
    return path.join(config.SETTINGS_PATH, 'site.json');
  }

  static async get(): Promise<SiteSettings> {
    try {
      return await readJson<SiteSettings>(this.getFilePath(), SiteSettingsSchema);
    } catch {
      return SiteSettingsSchema.parse({});
    }
  }

  static async update(partial: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.get();
    const updated: SiteSettings = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString()
    };

    await writeJsonAtomic(this.getFilePath(), updated, SiteSettingsSchema);
    return updated;
  }
}
