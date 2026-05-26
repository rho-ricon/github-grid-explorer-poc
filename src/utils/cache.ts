export type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

export function cacheKey(url: string) {
  return `github:${url}`;
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: CacheEntry<T>) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/private browsing errors.
  }
}
