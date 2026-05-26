import { Popover } from '@base-ui/react/popover';
import { GitHubAvatar } from './avatars';
import {
  formatDate,
  isBotMember,
  isOldRelease,
  isStale,
  isVersionTag,
  teamPermission,
  workflowRunStateLabel,
} from './status';
import type { IssueOrPull, Member, Release, Repo, RepoCi, Tag, Team, WorkflowRun } from './types';

export function RepoPreview({ repo }: { repo: Repo & { ci?: RepoCi } }) {
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

export function WorkflowRunPreview({ run }: { run: WorkflowRun }) {
  return (
    <div className="preview">
      <Popover.Title>{run.display_title || run.name}</Popover.Title>
      <Popover.Description>{run.name}</Popover.Description>
      <div className="meta">
        <span>{workflowRunStateLabel(run)}</span>
        <span>#{run.run_number}</span>
        <span>{run.event}</span>
        {run.head_branch && <span>{run.head_branch}</span>}
        {run.actor?.login && <span>{run.actor.login}</span>}
        <span>Started {formatDate(run.run_started_at || run.created_at)}</span>
      </div>
    </div>
  );
}

export function TeamPreview({ team }: { team: Team }) {
  return (
    <div className="preview">
      <Popover.Title>{team.name}</Popover.Title>
      <Popover.Description>{team.description || 'No description.'}</Popover.Description>
      <div className="meta">
        <span>{team.slug}</span>
        {team.privacy && <span>{team.privacy}</span>}
        <span>{teamPermission(team)} permission</span>
        {typeof team.members_count === 'number' && <span>{team.members_count} members</span>}
        {typeof team.repos_count === 'number' && <span>{team.repos_count} repos</span>}
        {team.parent && <span>child of {team.parent.name}</span>}
      </div>
    </div>
  );
}

export function MemberPreview({ member }: { member: Member }) {
  return (
    <div className="preview">
      <div className="previewHeader">
        <GitHubAvatar
          className="previewAvatar"
          src={member.avatar_url}
          label={member.login}
          size={96}
        />
        <div>
          <Popover.Title>{member.login}</Popover.Title>
          <Popover.Description>{member.type}</Popover.Description>
        </div>
      </div>
      <div className="meta">
        <span>{isBotMember(member) ? 'bot' : 'user'}</span>
        {member.site_admin && <span>site admin</span>}
        <span>click opens GitHub</span>
      </div>
    </div>
  );
}

export function ReleasePreview({ release }: { release: Release }) {
  return (
    <div className="preview">
      <Popover.Title>{release.name || release.tag_name}</Popover.Title>
      <Popover.Description>{release.tag_name}</Popover.Description>
      <div className="meta">
        <span>{release.draft ? 'draft' : release.prerelease ? 'prerelease' : 'stable'}</span>
        <span>{release.target_commitish}</span>
        <span>{release.author?.login || 'unknown'}</span>
        <span>{release.assets.length} assets</span>
        <span>
          Published {release.published_at ? formatDate(release.published_at) : 'unpublished'}
        </span>
        {isOldRelease(release) && <span>old</span>}
      </div>
    </div>
  );
}

export function TagPreview({ repo, tag }: { repo: Repo; tag: Tag }) {
  return (
    <div className="preview">
      <Popover.Title>{tag.name}</Popover.Title>
      <Popover.Description>{repo.name} tag</Popover.Description>
      <div className="meta">
        <span>{isVersionTag(tag.name) ? 'version' : 'tag'}</span>
        <span>{tag.commit.sha.slice(0, 7)}</span>
        <span>click opens GitHub</span>
      </div>
    </div>
  );
}

export function IssuePreview({ item }: { item: IssueOrPull }) {
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
