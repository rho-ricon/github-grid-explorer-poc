import {
  readCache,
  removeCacheByPrefix,
  writeCache,
  type CacheStore,
} from '../../utils/cache';

export const ORG = 'KnickKnackLabs';
export const CACHE_TTL = 10 * 60 * 1000;
export const CI_CACHE_TTL = CACHE_TTL;

type GitHubAuth = {
  token: string;
  rememberToken: boolean;
};

export function githubPath(path: string) {
  return import.meta.env.DEV ? `/github${path}` : `https://api.github.com${path}`;
}

export function readCachedJson<T>(url: string, auth: GitHubAuth): T | null {
  const cached = readCache<T>(githubCacheKey(url, isAuthenticatedRequest(url, auth)), cacheStore(url, auth));
  return cached && cached.expiresAt > Date.now() ? cached.data : null;
}

export async function fetchCachedJson<T>(
  url: string,
  errorMessage: string,
  ttl: number,
  auth: GitHubAuth,
): Promise<T> {
  const authenticated = isAuthenticatedRequest(url, auth);
  const key = githubCacheKey(url, authenticated);
  const store = cacheStore(url, auth);
  const cached = readCache<T>(key, store);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let response: Response;

  try {
    response = await fetch(requestUrl(url, auth), {
      headers: requestHeaders(auth),
    });
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }

  if (!response.ok) {
    if (cached) return cached.data;

    throw new Error(
      response.status === 401 || response.status === 403
        ? errorMessage
        : `GitHub returned ${response.status}`,
    );
  }

  const data = (await response.json()) as T;
  writeCache(key, { expiresAt: Date.now() + ttl, data }, store);
  return data;
}

export function clearAuthenticatedGitHubCache() {
  removeCacheByPrefix('github:auth:', 'local');
  removeCacheByPrefix('github:auth:', 'session');
}

export function openInGitHub(url: string) {
  window.open(url, '_blank', 'noreferrer');
}

function isAuthenticatedRequest(url: string, auth: GitHubAuth) {
  return Boolean(auth.token) || (import.meta.env.DEV && url.startsWith('/github/'));
}

function cacheStore(url: string, auth: GitHubAuth): CacheStore {
  if (!isAuthenticatedRequest(url, auth)) return 'local';
  return auth.rememberToken || (import.meta.env.DEV && url.startsWith('/github/')) ? 'local' : 'session';
}

function githubCacheKey(url: string, authenticated: boolean) {
  return `github:${authenticated ? 'auth' : 'public'}:${canonicalPath(url)}`;
}

function canonicalPath(url: string) {
  if (url.startsWith('/github/')) return url.slice('/github'.length);
  if (url.startsWith('https://api.github.com/')) {
    return url.slice('https://api.github.com'.length);
  }
  return url;
}

function requestUrl(url: string, auth: GitHubAuth) {
  if (auth.token && url.startsWith('/github/')) {
    return `https://api.github.com${url.slice('/github'.length)}`;
  }
  return url;
}

function requestHeaders(auth: GitHubAuth) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };

  if (auth.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  return headers;
}
