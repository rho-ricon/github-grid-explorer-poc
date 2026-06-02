import { Drawer } from '@base-ui/react/drawer';
import { type DragEvent, useEffect, useMemo, useState } from 'react';
import { GridSection } from '../../components/GridSection';
import { Screen } from '../../components/Screen';
import { SquareGrid } from '../../components/SquareGrid';
import { githubPath, openInGitHub } from './api';
import {
  IssueContextMenu,
  ReleaseContextMenu,
  TagContextMenu,
  WorkflowRunContextMenu,
} from './contextMenus';
import { useGitHubData, useGitHubList } from './hooks';
import { ItemScreen } from './ItemScreen';
import { IssueLegend, ReleaseLegend, TagLegend, WorkflowRunLegend } from './legends';
import { IssuePreview, ReleasePreview, TagPreview, WorkflowRunPreview } from './previews';
import {
  filterItems,
  issueSearchText,
  releaseSearchText,
  tagSearchText,
  workflowRunSearchText,
} from './search';
import {
  issueSquareStatus,
  releaseSquareStatus,
  tagSquareStatus,
  tagUrl,
  workflowRunSquareStatus,
} from './status';
import { TokenSettings } from './TokenSettings';
import type { IssueOrPull, Member, Release, Repo, Tag, WorkflowRunsResponse } from './types';

export function RepoScreen({
  repo,
  initialQuery = '',
  draggedMember,
  onMemberIssueDrop,
}: {
  repo: Repo;
  initialQuery?: string;
  draggedMember?: Member | null;
  onMemberIssueDrop?: (member: Member, item: IssueOrPull, event: DragEvent<HTMLElement>) => void;
}) {
  const workflowRunData = useGitHubData<WorkflowRunsResponse>(
    githubPath(`/repos/${repo.full_name}/actions/runs?per_page=100`),
    'Could not load workflow runs.',
  );
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
    setQuery(initialQuery);
  }, [repo.id, initialQuery]);

  const workflowRuns = useMemo(
    () => filterItems(workflowRunData.data?.workflow_runs || [], query, workflowRunSearchText),
    [workflowRunData.data, query],
  );
  const issues = useMemo(
    () =>
      filterItems(
        issueData.items.filter((item) => !item.pull_request),
        query,
        issueSearchText,
      ),
    [issueData.items, query],
  );
  const pullRequests = useMemo(
    () =>
      filterItems(
        issueData.items.filter((item) => item.pull_request),
        query,
        issueSearchText,
      ),
    [issueData.items, query],
  );
  const releases = useMemo(
    () => filterItems(releaseData.items, query, releaseSearchText),
    [releaseData.items, query],
  );
  const tags = useMemo(
    () => filterItems(tagData.items, query, tagSearchText),
    [tagData.items, query],
  );
  const loading =
    workflowRunData.loading || issueData.loading || releaseData.loading || tagData.loading;

  return (
    <Drawer.Content className="screen">
      <Screen
        title={repo.name}
        leading={<Drawer.Close className="back">← Back</Drawer.Close>}
        search={query}
        onSearchChange={setQuery}
        actions={<TokenSettings />}
        count={
          loading
            ? 'Loading…'
            : `${workflowRuns.length} runs / ${issues.length} issues / ${pullRequests.length} PRs / ${releases.length} releases / ${tags.length} tags`
        }
      >
        <Drawer.Root open={item !== null} onOpenChange={(open) => !open && setItem(null)}>
          <div className="sections">
            <GridSection
              title="Workflow Runs"
              empty={workflowRunData.error || 'No matching workflow runs.'}
              squareCount={workflowRuns.length}
            >
              {workflowRunData.loading ? (
                <p>Loading…</p>
              ) : (
                workflowRuns.length > 0 && (
                  <>
                    <WorkflowRunLegend />
                    <SquareGrid
                      items={workflowRuns}
                      label="Workflow run"
                      getLabel={(run) =>
                        `${run.name}: ${run.display_title || `#${run.run_number}`}`
                      }
                      getStatus={workflowRunSquareStatus}
                      onPick={(run) => openInGitHub(run.html_url)}
                      opensExternal
                      renderPreview={(run) => <WorkflowRunPreview run={run} />}
                      renderContextMenu={(run) => <WorkflowRunContextMenu run={run} />}
                    />
                  </>
                )
              )}
            </GridSection>

            <GridSection
              title="Issues"
              empty={issueData.error || 'No matching issues.'}
              squareCount={issues.length}
            >
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
                      onDrop={
                        draggedMember
                          ? (issue, event) => onMemberIssueDrop?.(draggedMember, issue, event)
                          : undefined
                      }
                      renderPreview={(i) => <IssuePreview item={i} />}
                      renderContextMenu={(i) => <IssueContextMenu item={i} />}
                    />
                  </>
                )
              )}
            </GridSection>

            <GridSection
              title="Pull Requests"
              empty={issueData.error || 'No matching PRs.'}
              squareCount={pullRequests.length}
            >
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
                      onDrop={
                        draggedMember
                          ? (pullRequest, event) =>
                              onMemberIssueDrop?.(draggedMember, pullRequest, event)
                          : undefined
                      }
                      renderPreview={(i) => <IssuePreview item={i} />}
                      renderContextMenu={(i) => <IssueContextMenu item={i} />}
                    />
                  </>
                )
              )}
            </GridSection>

            <GridSection
              title="Releases"
              empty={releaseData.error || 'No matching releases.'}
              squareCount={releases.length}
            >
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
                      opensExternal
                      renderPreview={(release) => <ReleasePreview release={release} />}
                      renderContextMenu={(release) => <ReleaseContextMenu release={release} />}
                    />
                  </>
                )
              )}
            </GridSection>

            <GridSection
              title="Tags"
              empty={tagData.error || 'No matching tags.'}
              squareCount={tags.length}
            >
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
                      opensExternal
                      renderPreview={(tag) => <TagPreview repo={repo} tag={tag} />}
                      renderContextMenu={(tag) => <TagContextMenu repo={repo} tag={tag} />}
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
