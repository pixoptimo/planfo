/**
 * In-process asynchronous lock manager to prevent concurrent write collisions on filesystem files.
 */
class LockManager {
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Acquire a lock for a specific key (e.g. file path).
   * Returns an unlock function that MUST be called in a finally block.
   */
  async acquire(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let releaseLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(key, lockPromise);

    return () => {
      this.locks.delete(key);
      releaseLock();
    };
  }

  /**
   * Execute an async function with an exclusive lock on the given key.
   */
  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const unlock = await this.acquire(key);
    try {
      return await fn();
    } finally {
      unlock();
    }
  }
}

export const fileLock = new LockManager();
