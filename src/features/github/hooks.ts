import { useEffect, useMemo, useState } from 'react';
import { CACHE_TTL, CI_CACHE_TTL, fetchCachedJson, githubPath, readCachedJson } from './api';
import { useGitHubAuth } from './auth';
import type { Repo, RepoCi, WorkflowRun } from './types';

const loadingCi: RepoCi = { state: 'loading', label: 'Loading CI…' };
const ciCache = new Map<string, RepoCi>();
const ciPending = new Map<string, Promise<RepoCi>>();

export function useGitHubData<T>(url: string, errorMessage: string, ttl = CACHE_TTL) {
  const auth = useGitHubAuth();
  const initialCache = readCachedJson<T>(url, auth);
  const [data, setData] = useState<T | null>(() => initialCache);
  const [loading, setLoading] = useState(() => !initialCache);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const cached = readCachedJson<T>(url, auth);
        if (active) setData(cached);

        const nextData = await fetchCachedJson<T>(url, errorMessage, ttl, auth);
        if (active) setData(nextData);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : errorMessage);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [url, errorMessage, ttl, auth.token, auth.rememberToken]);

  return { data, loading, error };
}

export function useGitHubList<T>(url: string, errorMessage: string) {
  const { data, loading, error } = useGitHubData<T[]>(url, errorMessage);
  return { items: data || [], loading, error };
}

export function useRepoCiStatuses(repos: Repo[]) {
  const auth = useGitHubAuth();
  const authKey = useMemo(
    () => (auth.token || import.meta.env.DEV ? 'auth' : 'public'),
    [auth.token],
  );
  const [statuses, setStatuses] = useState<Record<number, RepoCi>>({});

  useEffect(() => {
    let active = true;

    if (repos.length === 0) {
      setStatuses({});
      return;
    }

    setStatuses(
      Object.fromEntries(
        repos.map((repo) => [
          repo.id,
          ciCache.get(ciKey(repo, authKey)) || readRepoCiCache(repo, auth) || loadingCi,
        ]),
      ),
    );

    async function load() {
      for (const repo of repos) {
        if (ciCache.has(ciKey(repo, authKey))) continue;

        const ci = await getRepoCi(repo, auth, authKey);
        if (!active) return;

        setStatuses((current) => ({ ...current, [repo.id]: ci }));
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [repos, auth.token, auth.rememberToken, authKey]);

  return statuses;
}

function getRepoCi(repo: Repo, auth: ReturnType<typeof useGitHubAuth>, authKey: string) {
  const key = ciKey(repo, authKey);
  const cached = ciCache.get(key) || readRepoCiCache(repo, auth);
  if (cached) return Promise.resolve(cached);

  const pending = ciPending.get(key);
  if (pending) return pending;

  const request = fetchCachedJson<{ workflow_runs?: WorkflowRun[] }>(
    githubPath(`/repos/${repo.full_name}/actions/runs?per_page=1`),
    'CI unavailable',
    CI_CACHE_TTL,
    auth,
  )
    .then((data): RepoCi => workflowRunToCi(data.workflow_runs?.[0]))
    .catch((): RepoCi => ({ state: 'unknown', label: 'CI unavailable' }))
    .then((ci) => {
      ciCache.set(key, ci);
      ciPending.delete(key);
      return ci;
    });

  ciPending.set(key, request);
  return request;
}

function readRepoCiCache(repo: Repo, auth: ReturnType<typeof useGitHubAuth>) {
  const cached = readCachedJson<{ workflow_runs?: WorkflowRun[] }>(
    githubPath(`/repos/${repo.full_name}/actions/runs?per_page=1`),
    auth,
  );

  if (!cached) return null;
  return workflowRunToCi(cached.workflow_runs?.[0]);
}

function ciKey(repo: Repo, authKey: string) {
  return `${authKey}:${repo.id}`;
}

function workflowRunToCi(run: WorkflowRun | undefined): RepoCi {
  if (!run) return { state: 'none', label: 'No workflow runs' };

  if (run.status !== 'completed') {
    return { state: 'running', label: `${run.name}: ${run.status}`, url: run.html_url };
  }

  if (run.conclusion === 'success') {
    return { state: 'success', label: `${run.name}: success`, url: run.html_url };
  }

  if (
    run.conclusion === 'failure' ||
    run.conclusion === 'timed_out' ||
    run.conclusion === 'action_required'
  ) {
    return { state: 'failure', label: `${run.name}: ${run.conclusion}`, url: run.html_url };
  }

  if (
    run.conclusion === 'cancelled' ||
    run.conclusion === 'neutral' ||
    run.conclusion === 'skipped'
  ) {
    return { state: 'neutral', label: `${run.name}: ${run.conclusion}`, url: run.html_url };
  }

  return { state: 'unknown', label: `${run.name}: unknown`, url: run.html_url };
}
