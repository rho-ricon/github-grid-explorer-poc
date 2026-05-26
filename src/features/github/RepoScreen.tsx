import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { GridSection } from '../../components/GridSection';
import { Screen } from '../../components/Screen';
import { SquareGrid } from '../../components/SquareGrid';
import { githubPath, openInGitHub } from './api';
import { useGitHubList } from './hooks';
import { IssueLegend, ReleaseLegend, TagLegend } from './legends';
import { IssuePreview, ReleasePreview, TagPreview } from './previews';
import {
  filterItems,
  issueSearchText,
  releaseSearchText,
  tagSearchText,
} from './search';
import { issueSquareStatus, releaseSquareStatus, tagSquareStatus, tagUrl } from './status';
import type { IssueOrPull, Release, Repo, Tag } from './types';
import { ItemScreen } from './ItemScreen';

export function RepoScreen({ repo }: { repo: Repo }) {
  const issueData = useGitHubList<IssueOrPull>(
    githubPath(`/repos/${repo.full_name}/issues?state=all&per_page=100`),
    'Could not load issues/PRs.',
  );
  const releaseData = useGitHubList<Release>(
    githubPath(`/repos/${repo.full_name}/releases?per_page=100`),
    'Could not load releases.',
  );
  const tagData = useGitHubList<Tag>(
    githubPath(`/repos/${repo.full_name}/tags?per_page=100`),
    'Could not load tags.',
  );
  const [item, setItem] = useState<IssueOrPull | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setItem(null);
    setQuery('');
  }, [repo.id]);

  const issues = useMemo(
    () => filterItems(issueData.items.filter((item) => !item.pull_request), query, issueSearchText),
    [issueData.items, query],
  );
  const pullRequests = useMemo(
    () => filterItems(issueData.items.filter((item) => item.pull_request), query, issueSearchText),
    [issueData.items, query],
  );
  const releases = useMemo(
    () => filterItems(releaseData.items, query, releaseSearchText),
    [releaseData.items, query],
  );
  const tags = useMemo(() => filterItems(tagData.items, query, tagSearchText), [tagData.items, query]);
  const loading = issueData.loading || releaseData.loading || tagData.loading;

  return (
    <Drawer.Content className="screen">
      <Screen
        title={repo.name}
        leading={<Drawer.Close className="back">← Back</Drawer.Close>}
        search={query}
        onSearchChange={setQuery}
        count={
          loading
            ? 'Loading…'
            : `${issues.length} issues / ${pullRequests.length} PRs / ${releases.length} releases / ${tags.length} tags`
        }
      >
        <Drawer.Root open={item !== null} onOpenChange={(open) => !open && setItem(null)}>
          <div className="sections">
            <GridSection title="Issues" empty={issueData.error || 'No matching issues.'}>
              {issueData.loading ? (
                <p>Loading…</p>
              ) : (
                issues.length > 0 && (
                  <>
                    <IssueLegend kind="issue" />
                    <SquareGrid
                      items={issues}
                      label="Issue"
                      getLabel={(i) => `#${i.number} ${i.title}`}
                      getStatus={issueSquareStatus}
                      onPick={setItem}
                      renderPreview={(i) => <IssuePreview item={i} />}
                    />
                  </>
                )
              )}
            </GridSection>

            <GridSection title="Pull Requests" empty={issueData.error || 'No matching PRs.'}>
              {issueData.loading ? (
                <p>Loading…</p>
              ) : (
                pullRequests.length > 0 && (
                  <>
                    <IssueLegend kind="pr" />
                    <SquareGrid
                      items={pullRequests}
                      label="Pull request"
                      getLabel={(i) => `#${i.number} ${i.title}`}
                      getStatus={issueSquareStatus}
                      onPick={setItem}
                      renderPreview={(i) => <IssuePreview item={i} />}
                    />
                  </>
                )
              )}
            </GridSection>

            <GridSection title="Releases" empty={releaseData.error || 'No matching releases.'}>
              {releaseData.loading ? (
                <p>Loading…</p>
              ) : (
                releases.length > 0 && (
                  <>
                    <ReleaseLegend />
                    <SquareGrid
                      items={releases}
                      label="Release"
                      getLabel={(release) => release.name || release.tag_name}
                      getStatus={releaseSquareStatus}
                      onPick={(release) => openInGitHub(release.html_url)}
                      renderPreview={(release) => <ReleasePreview release={release} />}
                    />
                  </>
                )
              )}
            </GridSection>

            <GridSection title="Tags" empty={tagData.error || 'No matching tags.'}>
              {tagData.loading ? (
                <p>Loading…</p>
              ) : (
                tags.length > 0 && (
                  <>
                    <TagLegend />
                    <SquareGrid
                      items={tags}
                      label="Tag"
                      getLabel={(tag) => tag.name}
                      getStatus={tagSquareStatus}
                      onPick={(tag) => openInGitHub(tagUrl(repo, tag))}
                      renderPreview={(tag) => <TagPreview repo={repo} tag={tag} />}
                    />
                  </>
                )
              )}
            </GridSection>
          </div>

          <Drawer.Portal>
            <Drawer.Viewport className="viewport">
              <Drawer.Popup className="drawer">
                {item && <ItemScreen repo={repo} item={item} />}
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </Screen>
    </Drawer.Content>
  );
}
