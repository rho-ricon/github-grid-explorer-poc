import { useEffect, useState } from 'react';
import { cacheKey, readCache } from '../../utils/cache';
import { CACHE_TTL, CI_CACHE_TTL, fetchCachedJson, githubPath } from './api';
import type { Repo, RepoCi, WorkflowRun } from './types';

const loadingCi: RepoCi = { state: 'loading', label: 'Loading CI…' };
const ciCache = new Map<number, RepoCi>();
const ciPending = new Map<number, Promise<RepoCi>>();

export function useGitHubList<T>(url: string, errorMessage: string) {
  const initialCache = readCache<T[]>(cacheKey(url));
  const [items, setItems] = useState<T[]>(() => initialCache?.data || []);
  const [loading, setLoading] = useState(() => !initialCache);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const cached = readCache<T[]>(cacheKey(url));
        if (cached && active) setItems(cached.data);

        const data = await fetchCachedJson<T[]>(url, errorMessage, CACHE_TTL);
        if (active) setItems(data);
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
  }, [url, errorMessage]);

  return { items, loading, error };
}

export function useRepoCiStatuses(repos: Repo[]) {
  const [statuses, setStatuses] = useState<Record<number, RepoCi>>({});

  useEffect(() => {
    let active = true;

    if (repos.length === 0) {
      setStatuses({});
      return;
    }

    setStatuses(
      Object.fromEntries(
        repos.map((repo) => [repo.id, ciCache.get(repo.id) || readRepoCiCache(repo) || loadingCi]),
      ),
    );

    async function load() {
      for (const repo of repos) {
        if (ciCache.has(repo.id)) continue;

        const ci = await getRepoCi(repo);
        if (!active) return;

        setStatuses((current) => ({ ...current, [repo.id]: ci }));
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [repos]);

  return statuses;
}

function getRepoCi(repo: Repo) {
  const cached = ciCache.get(repo.id) || readRepoCiCache(repo);
  if (cached) return Promise.resolve(cached);

  const pending = ciPending.get(repo.id);
  if (pending) return pending;

  const request = fetchCachedJson<{ workflow_runs?: WorkflowRun[] }>(
    githubPath(`/repos/${repo.full_name}/actions/runs?per_page=1`),
    'CI unavailable',
    CI_CACHE_TTL,
  )
    .then((data): RepoCi => workflowRunToCi(data.workflow_runs?.[0]))
    .catch((): RepoCi => ({ state: 'unknown', label: 'CI unavailable' }))
    .then((ci) => {
      ciCache.set(repo.id, ci);
      ciPending.delete(repo.id);
      return ci;
    });

  ciPending.set(repo.id, request);
  return request;
}

function readRepoCiCache(repo: Repo) {
  const cached = readCache<{ workflow_runs?: WorkflowRun[] }>(
    cacheKey(githubPath(`/repos/${repo.full_name}/actions/runs?per_page=1`)),
  );

  if (!cached || cached.expiresAt <= Date.now()) return null;
  return workflowRunToCi(cached.data.workflow_runs?.[0]);
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
