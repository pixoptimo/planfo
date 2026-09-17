import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { fileLock } from './lock.js';
import { safeResolvePath } from './pathSecurity.js';

/**
 * Ensures that a directory exists, creating all parent directories if needed.
 */
export async function ensureDir(dirPath: string): Promise<string> {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Check if a file or directory exists.
 */
export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely writes data to a file atomically by first writing to a temporary file
 * and then renaming it to the destination file. Uses locking to prevent race conditions.
 */
export async function writeFileAtomic(
  filePath: string,
  data: string | Buffer,
  options: { encoding?: BufferEncoding; mode?: number } = {}
): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tempFilePath = path.join(
    dir,
    `.${path.basename(filePath)}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  await fileLock.withLock(filePath, async () => {
    try {
      if (typeof data === 'string') {
        await fs.writeFile(tempFilePath, data, {
          encoding: options.encoding ?? 'utf-8',
          mode: options.mode
        });
      } else {
        await fs.writeFile(tempFilePath, data, { mode: options.mode });
      }

      // Atomic rename
      await fs.rename(tempFilePath, filePath);
    } catch (err) {
      // Clean up temp file if rename or write failed
      try {
        if (await pathExists(tempFilePath)) {
          await fs.unlink(tempFilePath);
        }
      } catch {
        // Ignore cleanup error
      }
      throw err;
    }
  });
}

/**
 * Atomically writes JSON data to a file.
 */
export async function writeJsonAtomic<T>(
  filePath: string,
  data: T,
  schema?: z.ZodTypeAny
): Promise<void> {
  if (schema) {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      throw new Error(`Data validation failed before write: ${parseResult.error.message}`);
    }
  }

  const jsonString = JSON.stringify(data, null, 2);
  await writeFileAtomic(filePath, jsonString, { encoding: 'utf-8' });
}

/**
 * Safely reads and parses a JSON file with optional Zod schema validation.
 */
export async function readJson<T>(
  filePath: string,
  schema?: z.ZodTypeAny
): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(content);

  if (schema) {
    const parseResult = schema.safeParse(parsed);
    if (!parseResult.success) {
      throw new Error(`Data validation failed for "${filePath}": ${parseResult.error.message}`);
    }
    return parseResult.data as T;
  }

  return parsed as T;
}

/**
 * Safely deletes a file if it exists.
 */
export async function deleteFileSafe(filePath: string): Promise<boolean> {
  return await fileLock.withLock(filePath, async () => {
    try {
      if (await pathExists(filePath)) {
        await fs.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });
}

/**
 * Lists all JSON files in a directory safely.
 */
export async function listJsonFiles(dirPath: string): Promise<string[]> {
  if (!(await pathExists(dirPath))) {
    return [];
  }
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json') && !e.name.startsWith('.'))
    .map((e) => path.join(dirPath, e.name));
}

/**
 * Recursively copies a directory from src to dest.
 */
export async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Performs an atomic directory swap.
 * Given a staging directory and a live target directory:
 * 1. Backs up live directory to .backup (if live exists)
 * 2. Renames staging directory to live directory
 * 3. Removes backup directory
 * If anything fails, restores the live directory from backup.
 */
export async function atomicDirectorySwap(
  stagingDir: string,
  liveTargetDir: string
): Promise<void> {
  const parentDir = path.dirname(liveTargetDir);
  await ensureDir(parentDir);

  const backupDir = path.join(
    parentDir,
    `.${path.basename(liveTargetDir)}.backup-${Date.now()}`
  );

  const liveExists = await pathExists(liveTargetDir);

  try {
    if (liveExists) {
      await fs.rename(liveTargetDir, backupDir);
    }

    await fs.rename(stagingDir, liveTargetDir);

    if (liveExists && (await pathExists(backupDir))) {
      await fs.rm(backupDir, { recursive: true, force: true });
    }
  } catch (swapError) {
    // Attempt rollback
    if (liveExists && (await pathExists(backupDir)) && !(await pathExists(liveTargetDir))) {
      try {
        await fs.rename(backupDir, liveTargetDir);
      } catch {
        // Rollback failed
      }
    }
    throw swapError;
  }
}
