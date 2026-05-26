import { useMemo, useState } from 'react';
import { Drawer } from '@base-ui/react/drawer';
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
import { RepoScreen } from './RepoScreen';
import { TeamScreen } from './TeamScreen';
import { TokenSettings } from './TokenSettings';

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
    { type: 'repo'; repo: Repo } | { type: 'team'; team: Team } | null
  >(null);
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
                    renderPreview={(member) => <MemberPreview member={member} />}
                    renderContextMenu={(member) => <MemberContextMenu member={member} />}
                  />
                </>
              )
            )}
          </GridSection>
        </div>
      </Screen>

      <Drawer.Portal>
        <Drawer.Viewport className="viewport">
          <Drawer.Popup className="drawer">
            {selection?.type === 'repo' && <RepoScreen repo={selection.repo} />}
            {selection?.type === 'team' && <TeamScreen team={selection.team} />}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
