import { Drawer } from '@base-ui/react/drawer';
import { Menu } from '@base-ui/react/menu';
import { type DragEvent, type ReactNode, useMemo, useState } from 'react';
import { GridSection } from '../../components/GridSection';
import { Screen } from '../../components/Screen';
import { SquareGrid } from '../../components/SquareGrid';
import { githubPath, ORG, openInGitHub } from './api';
import { githubAvatarUrl } from './avatars';
import { MemberContextMenu, RepoContextMenu, TeamContextMenu } from './contextMenus';
import { useGitHubList, useRepoCiStatuses } from './hooks';
import { CiLegend, MemberLegend, TeamLegend } from './legends';
import { Pouch, type PouchItem } from './Pouch';
import { MemberPreview, RepoPreview, TeamPreview } from './previews';
import { RepoCompareScreen } from './RepoCompareScreen';
import { RepoScreen } from './RepoScreen';
import { filterItems, memberSearchText, repoSearchText, teamSearchText } from './search';
import { memberSquareStatus, teamSquareStatus } from './status';
import { TeamScreen } from './TeamScreen';
import { TokenSettings } from './TokenSettings';
import type { IssueOrPull, Member, Repo, RepoWithCi, Team } from './types';

type CarriedItem =
  | (PouchItem & { kind: 'member'; member: Member })
  | (PouchItem & { kind: 'repo'; repo: RepoWithCi })
  | (PouchItem & { kind: 'team'; team: Team });

type DraggedSquare = CarriedItem;

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

type MemberIssueDropMenuState = {
  type: 'member-issue';
  member: Member;
  repo: Repo;
  item: IssueOrPull;
  x: number;
  y: number;
};

type DropMenuState = MemberRepoDropMenuState | RepoRepoDropMenuState | MemberIssueDropMenuState;

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
  const [pouchedItems, setPouchedItems] = useState<CarriedItem[]>([]);
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

  const draggedMember = dragged?.kind === 'member' ? dragged.member : null;
  const canDropOnRepo = dragged?.kind === 'member' || dragged?.kind === 'repo';

  function addToPouch(item: CarriedItem) {
    setPouchedItems((current) =>
      current.some((currentItem) => currentItem.key === item.key) ? current : [...current, item],
    );
  }

  function handlePouchDrop(event: DragEvent<HTMLElement>) {
    if (!dragged) return;

    event.preventDefault();
    addToPouch(dragged);
    setDragged(null);
  }

  function handleDropOnRepo(repo: RepoWithCi, event: DragEvent<HTMLElement>) {
    if (!dragged) return;

    if (dragged.kind === 'member') {
      setDropMenu({
        type: 'member-repo',
        member: dragged.member,
        repo,
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (dragged.kind === 'repo' && dragged.repo.id !== repo.id) {
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
                    onDragStart={(repo) => setDragged(repoToPouchItem(repo))}
                    onDragEnd={() => setDragged(null)}
                    onDrop={canDropOnRepo ? handleDropOnRepo : undefined}
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
                    onDragStart={(team) => setDragged(teamToPouchItem(team))}
                    onDragEnd={() => setDragged(null)}
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
                    onDragStart={(member) => setDragged(memberToPouchItem(member))}
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

      <Pouch
        items={pouchedItems}
        canDrop={Boolean(dragged)}
        onDrop={handlePouchDrop}
        onDragItem={(item) => setDragged(item)}
        onDragEnd={() => setDragged(null)}
        onRemove={(item) =>
          setPouchedItems((current) =>
            current.filter((currentItem) => currentItem.key !== item.key),
          )
        }
        onClear={() => setPouchedItems([])}
      />

      <RelationshipDropMenu
        drop={dropMenu}
        onClose={() => setDropMenu(null)}
        onShowWork={(repo, member) => {
          setSelection({ type: 'repo', repo, initialQuery: member.login });
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
              <RepoScreen
                repo={selection.repo}
                initialQuery={selection.initialQuery}
                draggedMember={draggedMember}
                onMemberIssueDrop={(member, item, event) => {
                  setDropMenu({
                    type: 'member-issue',
                    member,
                    repo: selection.repo,
                    item,
                    x: event.clientX,
                    y: event.clientY,
                  });
                  setDragged(null);
                }}
              />
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
  onShowWork: (repo: Repo, member: Member) => void;
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
                <DropMenuItem onClick={() => onShowWork(drop.repo, drop.member)}>
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

            {drop?.type === 'member-issue' && (
              <>
                <div className="dropMenuLabel">
                  {drop.member.login} → #{drop.item.number}
                </div>
                <DropMenuItem onClick={() => onShowWork(drop.repo, drop.member)}>
                  Show this member’s repo work
                </DropMenuItem>
                <Menu.Separator className="contextMenuSeparator" />
                <DropMenuItem
                  onClick={() => {
                    openInGitHub(drop.item.html_url);
                    onClose();
                  }}
                >
                  Open issue/PR on GitHub
                </DropMenuItem>
                <DropMenuItem
                  onClick={() => {
                    openInGitHub(drop.member.html_url);
                    onClose();
                  }}
                >
                  Open member on GitHub
                </DropMenuItem>
              </>
            )}

            {drop?.type === 'repo-repo' && (
              <>
                <div className="dropMenuLabel">
                  {drop.source.name} ↔ {drop.target.name}
                </div>
                <DropMenuItem onClick={() => onCompareRepos(drop)}>
                  Compare repo summary
                </DropMenuItem>
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

function memberToPouchItem(member: Member): CarriedItem {
  return {
    key: `member:${member.id}`,
    kind: 'member',
    label: member.login,
    description: member.type,
    image: githubAvatarUrl(member.avatar_url, 56),
    status: memberSquareStatus(member),
    member,
  };
}

function repoToPouchItem(repo: RepoWithCi): CarriedItem {
  return {
    key: `repo:${repo.id}`,
    kind: 'repo',
    label: repo.name,
    description: repo.ci.label,
    status: repo.ci.state,
    repo,
  };
}

function teamToPouchItem(team: Team): CarriedItem {
  return {
    key: `team:${team.id}`,
    kind: 'team',
    label: team.name,
    description: team.permission || team.privacy || 'team',
    status: teamSquareStatus(team),
    team,
  };
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
