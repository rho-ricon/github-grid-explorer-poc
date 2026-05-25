import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { Popover } from '@base-ui/react/popover';

const ORG = 'KnickKnackLabs';
const CACHE_TTL = 10 * 60 * 1000;
const CI_CACHE_TTL = 2 * 60 * 1000;
const loadingCi: RepoCi = { state: 'loading', label: 'Loading CI…' };
const ciCache = new Map<number, RepoCi>();
const ciPending = new Map<number, Promise<RepoCi>>();

type Repo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
};

type Team = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  privacy?: string;
  permission?: string;
  html_url: string;
};

type Member = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
};

type RepoCi = {
  state: 'loading' | 'success' | 'failure' | 'running' | 'neutral' | 'none' | 'unknown';
  label: string;
  url?: string;
};

type RepoWithCi = Repo & { ci: RepoCi };

type IssueOrPull = {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  comments: number;
  updated_at: string;
  user: { login: string } | null;
  labels: { name: string; color: string }[];
  pull_request?: unknown;
};

type WorkflowRun = {
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
};

export default function App() {
  const repos = useGitHubList<Repo>(
    githubPath(`/orgs/${ORG}/repos?per_page=100&sort=updated&direction=desc`),
    'Could not load repos.',
  );
  const teams = useGitHubList<Team>(
    githubPath(`/orgs/${ORG}/teams?per_page=100`),
    'Teams require GitHub auth or are not public.',
  );
  const members = useGitHubList<Member>(
    githubPath(`/orgs/${ORG}/members?per_page=100`),
    'Could not load public members.',
  );
  const ciByRepo = useRepoCiStatuses(repos.items);
  const reposWithCi: RepoWithCi[] = repos.items.map((repo) => ({
    ...repo,
    ci: ciByRepo[repo.id] || loadingCi,
  }));
  const [repo, setRepo] = useState<Repo | null>(null);
  const loading = repos.loading || teams.loading || members.loading;

  return (
    <Drawer.Root open={repo !== null} onOpenChange={(open) => !open && setRepo(null)}>
      <Screen
        title={ORG}
        count={
          loading
            ? 'Loading org…'
            : `${repos.items.length} repos / ${teams.items.length} teams / ${members.items.length} members`
        }
      >
        <div className="sections">
          <GridSection title="Repos" empty={repos.error || 'No public repos.'}>
            {repos.loading ? (
              <p>Loading…</p>
            ) : (
              reposWithCi.length > 0 && (
                <>
                  <CiLegend />
                  <Grid
                    items={reposWithCi}
                    label="Repository"
                    getLabel={(r) => r.name}
                    getStatus={(r) => r.ci.state}
                    onPick={(r) => setRepo(r)}
                    renderPreview={(r) => <RepoPreview repo={r} />}
                  />
                </>
              )
            )}
          </GridSection>

          <GridSection title="Teams" empty={teams.error || 'No public teams.'}>
            {teams.loading ? (
              <p>Loading…</p>
            ) : (
              teams.items.length > 0 && (
                <Grid
                  items={teams.items}
                  label="Team"
                  getLabel={(team) => team.name}
                  onPick={(team) => openInGitHub(team.html_url)}
                  renderPreview={(team) => <TeamPreview team={team} />}
                />
              )
            )}
          </GridSection>

          <GridSection title="Members" empty={members.error || 'No public members.'}>
            {members.loading ? (
              <p>Loading…</p>
            ) : (
              members.items.length > 0 && (
                <Grid
                  items={members.items}
                  label="Member"
                  getLabel={(member) => member.login}
                  onPick={(member) => openInGitHub(member.html_url)}
                  renderPreview={(member) => <MemberPreview member={member} />}
                />
              )
            )}
          </GridSection>
        </div>
      </Screen>

      <Drawer.Portal>
        <Drawer.Viewport className="viewport">
          <Drawer.Popup className="drawer">{repo && <RepoScreen repo={repo} />}</Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function RepoScreen({ repo }: { repo: Repo }) {
  const { items, loading, error } = useGitHubList<IssueOrPull>(
    githubPath(`/repos/${repo.full_name}/issues?state=all&per_page=100`),
    'Could not load issues/PRs.',
  );
  const [item, setItem] = useState<IssueOrPull | null>(null);

  useEffect(() => {
    setItem(null);
  }, [repo.id]);

  const issues = items.filter((item) => !item.pull_request);
  const pullRequests = items.filter((item) => item.pull_request);

  return (
    <Drawer.Content className="screen">
      <header className="topbar">
        <Drawer.Close className="back">← Back</Drawer.Close>
        <Drawer.Title>{repo.name}</Drawer.Title>
        <span>{loading ? 'Loading…' : `${issues.length} issues / ${pullRequests.length} PRs`}</span>
      </header>

      <Drawer.Root open={item !== null} onOpenChange={(open) => !open && setItem(null)}>
        <main className="center">
          {error ? (
            <p>{error}</p>
          ) : loading ? (
            <p>Loading…</p>
          ) : (
            <div className="sections">
              <GridSection title="Issues" empty="No public issues.">
                {issues.length > 0 && <IssueLegend kind="issue" />}
                {issues.length > 0 && (
                  <Grid
                    items={issues}
                    label="Issue"
                    getLabel={(i) => `#${i.number} ${i.title}`}
                    getStatus={issueSquareStatus}
                    onPick={setItem}
                    renderPreview={(i) => <IssuePreview item={i} />}
                  />
                )}
              </GridSection>

              <GridSection title="Pull Requests" empty="No public PRs.">
                {pullRequests.length > 0 && <IssueLegend kind="pr" />}
                {pullRequests.length > 0 && (
                  <Grid
                    items={pullRequests}
                    label="Pull request"
                    getLabel={(i) => `#${i.number} ${i.title}`}
                    getStatus={issueSquareStatus}
                    onPick={setItem}
                    renderPreview={(i) => <IssuePreview item={i} />}
                  />
                )}
              </GridSection>
            </div>
          )}
        </main>

        <Drawer.Portal>
          <Drawer.Viewport className="viewport">
            <Drawer.Popup className="drawer">{item && <ItemScreen repo={repo} item={item} />}</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </Drawer.Content>
  );
}

function ItemScreen({ repo, item }: { repo: Repo; item: IssueOrPull }) {
  const kind = item.pull_request ? 'PR' : 'Issue';

  return (
    <Drawer.Content className="screen">
      <header className="topbar">
        <Drawer.Close className="back">← Back</Drawer.Close>
        <Drawer.Title>
          {repo.name} / {kind} #{item.number}
        </Drawer.Title>
        <span>{item.state}</span>
      </header>

      <main className="center detail">
        <h2>{item.title}</h2>
        <p>{item.comments} comments</p>
        <a className="back" href={item.html_url} target="_blank" rel="noreferrer">
          Open on GitHub
        </a>
      </main>
    </Drawer.Content>
  );
}

function Screen({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  return (
    <div className="screen">
      <header className="topbar">
        <h1>{title}</h1>
        {count && <span>{count}</span>}
      </header>
      <main className="center">{children}</main>
    </div>
  );
}

function GridSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="gridSection">
      <h2>{title}</h2>
      {children || <p>{empty}</p>}
    </section>
  );
}

function Grid<T>({
  items,
  label,
  getLabel,
  getStatus,
  onPick,
  renderPreview,
}: {
  items: T[];
  label: string;
  getLabel: (item: T) => string;
  getStatus?: (item: T) => string;
  onPick?: (item: T) => void;
  renderPreview: (item: T) => ReactNode;
}) {
  const popover = useMemo(() => Popover.createHandle<T>(), []);
  const columns = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(items.length || 1))));

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 56px)` }}>
        {items.map((item, index) => {
          const text = getLabel(item);

          return (
            <Popover.Trigger
              key={index}
              className="square"
              data-ci={getStatus?.(item)}
              aria-label={`${label}: ${text}`}
              title={text}
              handle={popover}
              payload={item}
              openOnHover
              delay={120}
              closeDelay={80}
              onClick={(event) => {
                if (!onPick) return;
                event.preventBaseUIHandler();
                popover.close();
                onPick(item);
              }}
            />
          );
        })}
      </div>

      <Popover.Root handle={popover}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner className="popoverPositioner" side="bottom" sideOffset={10}>
              <Popover.Popup className="popover">{payload && renderPreview(payload)}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </>
  );
}

function CiLegend() {
  return (
    <div className="legend" aria-label="CI status legend">
      <span data-ci="success">success</span>
      <span data-ci="failure">failure</span>
      <span data-ci="running">running</span>
      <span data-ci="none">none</span>
    </div>
  );
}

function IssueLegend({ kind }: { kind: 'issue' | 'pr' }) {
  return (
    <div className="legend" aria-label={`${kind} legend`}>
      <span data-ci={`${kind} open`}>open</span>
      <span data-ci={`${kind} closed`}>closed</span>
      <span data-ci="stale">stale</span>
      <span data-ci="busy">busy</span>
    </div>
  );
}

function RepoPreview({ repo }: { repo: Repo & { ci?: RepoCi } }) {
  return (
    <div className="preview">
      <Popover.Title>{repo.name}</Popover.Title>
      <Popover.Description>{repo.description || 'No description.'}</Popover.Description>
      <div className="meta">
        {repo.ci && <span>CI: {repo.ci.label}</span>}
        <span>{repo.language || 'No language'}</span>
        <span>★ {repo.stargazers_count}</span>
        <span>⑂ {repo.forks_count}</span>
        <span>{repo.open_issues_count} open</span>
        <span>Updated {formatDate(repo.updated_at)}</span>
      </div>
    </div>
  );
}

function TeamPreview({ team }: { team: Team }) {
  return (
    <div className="preview">
      <Popover.Title>{team.name}</Popover.Title>
      <Popover.Description>{team.description || 'No description.'}</Popover.Description>
      <div className="meta">
        <span>{team.slug}</span>
        {team.privacy && <span>{team.privacy}</span>}
        {team.permission && <span>{team.permission}</span>}
      </div>
    </div>
  );
}

function MemberPreview({ member }: { member: Member }) {
  return (
    <div className="preview">
      <Popover.Title>{member.login}</Popover.Title>
      <Popover.Description>{member.type}</Popover.Description>
      <div className="meta">
        <span>member</span>
        <span>click opens GitHub</span>
      </div>
    </div>
  );
}

function IssuePreview({ item }: { item: IssueOrPull }) {
  const kind = item.pull_request ? 'PR' : 'Issue';

  return (
    <div className="preview">
      <Popover.Title>
        {kind} #{item.number}
      </Popover.Title>
      <Popover.Description>{item.title}</Popover.Description>
      <div className="meta">
        <span>{item.state}</span>
        <span>{item.user?.login || 'unknown'}</span>
        <span>{item.comments} comments</span>
        <span>Updated {formatDate(item.updated_at)}</span>
        {isStale(item.updated_at) && item.state === 'open' && <span>stale</span>}
      </div>
      {item.labels.length > 0 && (
        <div className="labels">
          {item.labels.slice(0, 3).map((label) => (
            <span key={label.name}>{label.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function issueSquareStatus(item: IssueOrPull) {
  const kind = item.pull_request ? 'pr' : 'issue';
  const parts = [kind, item.state];

  if (item.state === 'open' && isStale(item.updated_at)) {
    parts.push('stale');
  }

  if (item.comments >= 10) {
    parts.push('busy');
  }

  return parts.join(' ');
}

function isStale(value: string) {
  const updated = new Date(value).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Number.isFinite(updated) && Date.now() - updated > thirtyDays;
}

function useRepoCiStatuses(repos: Repo[]) {
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
    .then((data): RepoCi => {
      const run = data.workflow_runs?.[0];

      if (!run) {
        return { state: 'none', label: 'No workflow runs' };
      }

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
    })
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
  const run = cached?.data.workflow_runs?.[0];

  if (!cached || cached.expiresAt <= Date.now()) return null;
  if (!run) return { state: 'none', label: 'No workflow runs' } satisfies RepoCi;
  if (run.status !== 'completed') return { state: 'running', label: `${run.name}: ${run.status}`, url: run.html_url } satisfies RepoCi;
  if (run.conclusion === 'success') return { state: 'success', label: `${run.name}: success`, url: run.html_url } satisfies RepoCi;
  if (run.conclusion === 'failure' || run.conclusion === 'timed_out' || run.conclusion === 'action_required') {
    return { state: 'failure', label: `${run.name}: ${run.conclusion}`, url: run.html_url } satisfies RepoCi;
  }
  if (run.conclusion === 'cancelled' || run.conclusion === 'neutral' || run.conclusion === 'skipped') {
    return { state: 'neutral', label: `${run.name}: ${run.conclusion}`, url: run.html_url } satisfies RepoCi;
  }
  return { state: 'unknown', label: `${run.name}: unknown`, url: run.html_url } satisfies RepoCi;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function githubPath(path: string) {
  return `/github${path}`;
}

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

async function fetchCachedJson<T>(url: string, errorMessage: string, ttl: number): Promise<T> {
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

function cacheKey(url: string) {
  return `github:${url}`;
}

function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: CacheEntry<T>) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/private browsing errors.
  }
}

function useGitHubList<T>(url: string, errorMessage: string) {
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

function openInGitHub(url: string) {
  window.open(url, '_blank', 'noreferrer');
}
