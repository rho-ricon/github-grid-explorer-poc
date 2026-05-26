export type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

export type CacheStore = 'local' | 'session';

export function cacheKey(url: string) {
  return `github:${url}`;
}

export function readCache<T>(key: string, store: CacheStore = 'local'): CacheEntry<T> | null {
  try {
    const storage = getStorage(store);
    const value = storage?.getItem(key);
    return value ? (JSON.parse(value) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: CacheEntry<T>, store: CacheStore = 'local') {
  try {
    getStorage(store)?.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/private browsing errors.
  }
}

export function removeCacheByPrefix(prefix: string, store: CacheStore) {
  try {
    const storage = getStorage(store);
    if (!storage) return;

    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage access errors.
  }
}

function getStorage(store: CacheStore) {
  return store === 'session' ? sessionStorage : localStorage;
}
