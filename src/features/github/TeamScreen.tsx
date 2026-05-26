import { Drawer } from '@base-ui/react/drawer';
import { useMemo, useState } from 'react';
import { GridSection } from '../../components/GridSection';
import { Screen } from '../../components/Screen';
import { SquareGrid } from '../../components/SquareGrid';
import { githubPath, ORG, openInGitHub } from './api';
import { githubAvatarUrl } from './avatars';
import { MemberContextMenu } from './contextMenus';
import { useGitHubList } from './hooks';
import { MemberLegend } from './legends';
import { MemberPreview } from './previews';
import { filterItems, memberSearchText } from './search';
import { memberSquareStatus } from './status';
import { TokenSettings } from './TokenSettings';
import type { Member, Team } from './types';

export function TeamScreen({ team }: { team: Team }) {
  const members = useGitHubList<Member>(
    githubPath(`/orgs/${ORG}/teams/${team.slug}/members?per_page=100`),
    'Could not load team members. This may require a GitHub token with organization member read access.',
  );
  const [query, setQuery] = useState('');
  const filteredMembers = useMemo(
    () => filterItems(members.items, query, memberSearchText),
    [members.items, query],
  );

  return (
    <Drawer.Content className="screen">
      <Screen
        title={team.name}
        leading={<Drawer.Close className="back">← Back</Drawer.Close>}
        search={query}
        onSearchChange={setQuery}
        actions={<TokenSettings />}
        count={members.loading ? 'Loading members…' : `${filteredMembers.length} members`}
      >
        <div className="sections">
          <GridSection title="Members" empty={members.error || 'No matching members.'}>
            {members.loading ? (
              <p>Loading…</p>
            ) : (
              filteredMembers.length > 0 && (
                <>
                  <MemberLegend />
                  <SquareGrid
                    items={filteredMembers}
                    label="Team member"
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
    </Drawer.Content>
  );
}
