import path from 'node:path';
import { readJson, writeJsonAtomic } from '@cms/utils';
import { SiteSettingsSchema, type SiteSettings } from '@cms/schemas';
import { config } from '../config/env.js';

import fs from 'node:fs';

export class SettingsStore {
  private static getFilePath(): string {
    const directSettings = path.join(config.SETTINGS_PATH, 'settings.json');
    if (fs.existsSync(directSettings)) {
      return directSettings;
    }
    const storageSettings = path.join(config.STORAGE_PATH, 'settings.json');
    if (fs.existsSync(storageSettings)) {
      return storageSettings;
    }
    const siteJson = path.join(config.SETTINGS_PATH, 'site.json');
    if (fs.existsSync(siteJson)) {
      return siteJson;
    }
    if (config.STORAGE_PATH.endsWith('planfo') || config.STORAGE_PATH.endsWith('.planfo')) {
      return directSettings;
    }
    return siteJson;
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
