import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { Menu } from '@base-ui/react/menu';
import { GridSection } from '../../components/GridSection';
import { Screen } from '../../components/Screen';
import { SquareGrid } from '../../components/SquareGrid';
import { githubPath, openInGitHub, ORG } from './api';
import { githubAvatarUrl } from './avatars';
import { MemberContextMenu, RepoContextMenu, TeamContextMenu } from './contextMenus';
import { useGitHubList, useRepoCiStatuses } from './hooks';
import { CiLegend, MemberLegend, TeamLegend } from './legends';
import { MemberPreview, RepoPreview, TeamPreview } from './previews';
import { filterItems, memberSearchText, repoSearchText, teamSearchText } from './search';
import { memberSquareStatus, teamSquareStatus } from './status';
import type { Member, Repo, RepoWithCi, Team } from './types';
import { RepoCompareScreen } from './RepoCompareScreen';
import { RepoScreen } from './RepoScreen';
import { TeamScreen } from './TeamScreen';
import { TokenSettings } from './TokenSettings';

type DraggedSquare =
  | { type: 'member'; member: Member }
  | { type: 'repo'; repo: RepoWithCi };

type MemberRepoDropMenuState = {
  type: 'member-repo';
  member: Member;
  repo: RepoWithCi;
  x: number;
  y: number;
};

type RepoRepoDropMenuState = {
  type: 'repo-repo';
  source: RepoWithCi;
  target: RepoWithCi;
  x: number;
  y: number;
};

type DropMenuState = MemberRepoDropMenuState | RepoRepoDropMenuState;

export function GitHubExplorer() {
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
    ci: ciByRepo[repo.id] || { state: 'loading', label: 'Loading CI…' },
  }));
  const [selection, setSelection] = useState<
    | { type: 'repo'; repo: Repo; initialQuery?: string }
    | { type: 'team'; team: Team }
    | { type: 'repo-compare'; left: RepoWithCi; right: RepoWithCi }
    | null
  >(null);
  const [dragged, setDragged] = useState<DraggedSquare | null>(null);
  const [dropMenu, setDropMenu] = useState<DropMenuState | null>(null);
  const [query, setQuery] = useState('');
  const loading = repos.loading || teams.loading || members.loading;

  const filteredRepos = useMemo(
    () => filterItems(reposWithCi, query, repoSearchText),
    [reposWithCi, query],
  );
  const filteredTeams = useMemo(
    () => filterItems(teams.items, query, teamSearchText),
    [teams.items, query],
  );
  const filteredMembers = useMemo(
    () => filterItems(members.items, query, memberSearchText),
    [members.items, query],
  );

  function handleDropOnRepo(repo: RepoWithCi, event: DragEvent<HTMLElement>) {
    if (!dragged) return;

    if (dragged.type === 'member') {
      setDropMenu({
        type: 'member-repo',
        member: dragged.member,
        repo,
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (dragged.type === 'repo' && dragged.repo.id !== repo.id) {
      setDropMenu({
        type: 'repo-repo',
        source: dragged.repo,
        target: repo,
        x: event.clientX,
        y: event.clientY,
      });
    }

    setDragged(null);
  }

  return (
    <Drawer.Root open={selection !== null} onOpenChange={(open) => !open && setSelection(null)}>
      <Screen
        title={ORG}
        search={query}
        onSearchChange={setQuery}
        actions={<TokenSettings />}
        count={
          loading
            ? 'Loading org…'
            : `${filteredRepos.length} repos / ${filteredTeams.length} teams / ${filteredMembers.length} members`
        }
      >
        <div className="sections">
          <GridSection title="Repos" empty={repos.error || 'No matching repos.'}>
            {repos.loading ? (
              <p>Loading…</p>
            ) : (
              filteredRepos.length > 0 && (
                <>
                  <CiLegend />
                  <SquareGrid
                    items={filteredRepos}
                    label="Repository"
                    getLabel={(r) => r.name}
                    getStatus={(r) => r.ci.state}
                    onPick={(repo) => setSelection({ type: 'repo', repo })}
                    onDragStart={(repo) => setDragged({ type: 'repo', repo })}
                    onDragEnd={() => setDragged(null)}
                    onDrop={dragged ? handleDropOnRepo : undefined}
                    renderPreview={(r) => <RepoPreview repo={r} />}
                    renderContextMenu={(r) => <RepoContextMenu repo={r} />}
                  />
                </>
              )
            )}
          </GridSection>

          <GridSection title="Teams" empty={teams.error || 'No matching teams.'}>
            {teams.loading ? (
              <p>Loading…</p>
            ) : (
              filteredTeams.length > 0 && (
                <>
                  <TeamLegend />
                  <SquareGrid
                    items={filteredTeams}
                    label="Team"
                    getLabel={(team) => team.name}
                    getStatus={teamSquareStatus}
                    onPick={(team) => setSelection({ type: 'team', team })}
                    renderPreview={(team) => <TeamPreview team={team} />}
                    renderContextMenu={(team) => <TeamContextMenu team={team} />}
                  />
                </>
              )
            )}
          </GridSection>

          <GridSection title="Members" empty={members.error || 'No matching members.'}>
            {members.loading ? (
              <p>Loading…</p>
            ) : (
              filteredMembers.length > 0 && (
                <>
                  <MemberLegend />
                  <SquareGrid
                    items={filteredMembers}
                    label="Member"
                    getLabel={(member) => member.login}
                    getStatus={memberSquareStatus}
                    getImage={(member) => githubAvatarUrl(member.avatar_url, 56)}
                    onPick={(member) => openInGitHub(member.html_url)}
                    onDragStart={(member) => setDragged({ type: 'member', member })}
                    onDragEnd={() => setDragged(null)}
                    renderPreview={(member) => <MemberPreview member={member} />}
                    renderContextMenu={(member) => <MemberContextMenu member={member} />}
                  />
                </>
              )
            )}
          </GridSection>
        </div>
      </Screen>

      <RelationshipDropMenu
        drop={dropMenu}
        onClose={() => setDropMenu(null)}
        onShowWork={(drop) => {
          setSelection({ type: 'repo', repo: drop.repo, initialQuery: drop.member.login });
          setDropMenu(null);
        }}
        onCompareRepos={(drop) => {
          setSelection({ type: 'repo-compare', left: drop.source, right: drop.target });
          setDropMenu(null);
        }}
      />

      <Drawer.Portal>
        <Drawer.Viewport className="viewport">
          <Drawer.Popup className="drawer">
            {selection?.type === 'repo' && (
              <RepoScreen repo={selection.repo} initialQuery={selection.initialQuery} />
            )}
            {selection?.type === 'team' && <TeamScreen team={selection.team} />}
            {selection?.type === 'repo-compare' && (
              <RepoCompareScreen left={selection.left} right={selection.right} />
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function RelationshipDropMenu({
  drop,
  onClose,
  onShowWork,
  onCompareRepos,
}: {
  drop: DropMenuState | null;
  onClose: () => void;
  onShowWork: (drop: MemberRepoDropMenuState) => void;
  onCompareRepos: (drop: RepoRepoDropMenuState) => void;
}) {
  const anchor = useMemo(() => (drop ? pointAnchor(drop.x, drop.y) : null), [drop]);

  return (
    <Menu.Root open={drop !== null} onOpenChange={(open) => !open && onClose()} modal={false}>
      <Menu.Portal>
        <Menu.Positioner
          className="contextMenuPositioner"
          anchor={anchor}
          positionMethod="fixed"
          side="bottom"
          align="start"
          sideOffset={6}
        >
          <Menu.Popup className="contextMenuPopup">
            {drop?.type === 'member-repo' && (
              <>
                <div className="dropMenuLabel">
                  {drop.member.login} → {drop.repo.name}
                </div>
                <DropMenuItem onClick={() => onShowWork(drop)}>
                  Show this member’s repo work
                </DropMenuItem>
                <Menu.Separator className="contextMenuSeparator" />
                <DropMenuItem
                  onClick={() => {
                    openInGitHub(drop.member.html_url);
                    onClose();
                  }}
                >
                  Open member on GitHub
                </DropMenuItem>
                <DropMenuItem
                  onClick={() => {
                    openInGitHub(drop.repo.html_url);
                    onClose();
                  }}
                >
                  Open repo on GitHub
                </DropMenuItem>
              </>
            )}

            {drop?.type === 'repo-repo' && (
              <>
                <div className="dropMenuLabel">
                  {drop.source.name} ↔ {drop.target.name}
                </div>
                <DropMenuItem onClick={() => onCompareRepos(drop)}>Compare repo summary</DropMenuItem>
                <Menu.Separator className="contextMenuSeparator" />
                <DropMenuItem
                  onClick={() => {
                    openInGitHub(drop.source.html_url);
                    onClose();
                  }}
                >
                  Open source repo
                </DropMenuItem>
                <DropMenuItem
                  onClick={() => {
                    openInGitHub(drop.target.html_url);
                    onClose();
                  }}
                >
                  Open target repo
                </DropMenuItem>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function DropMenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Menu.Item className="contextMenuItem" onClick={onClick}>
      {children}
    </Menu.Item>
  );
}

function pointAnchor(x: number, y: number) {
  return {
    getBoundingClientRect() {
      return {
        x,
        y,
        width: 0,
        height: 0,
        top: y,
        right: x,
        bottom: y,
        left: x,
      };
    },
  };
}
