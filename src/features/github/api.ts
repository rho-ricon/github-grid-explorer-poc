import { cacheKey, readCache, writeCache } from '../../utils/cache';

export const ORG = 'KnickKnackLabs';
export const CACHE_TTL = 10 * 60 * 1000;
export const CI_CACHE_TTL = 2 * 60 * 1000;

export function githubPath(path: string) {
  return `/github${path}`;
}

export async function fetchCachedJson<T>(url: string, errorMessage: string, ttl: number): Promise<T> {
  const cached = readCache<T>(cacheKey(url));

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const response = await fetch(url);

  if (!response.ok) {
    if (cached) return cached.data;

    throw new Error(
      response.status === 401 || response.status === 403
        ? errorMessage
        : `GitHub returned ${response.status}`,
    );
  }

  const data = (await response.json()) as T;
  writeCache(cacheKey(url), { expiresAt: Date.now() + ttl, data });
  return data;
}

export function openInGitHub(url: string) {
  window.open(url, '_blank', 'noreferrer');
}
