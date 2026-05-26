import type { IssueOrPull, Member, Release, Repo, Tag, Team, WorkflowRun } from './types';

export function issueSquareStatus(item: IssueOrPull) {
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

export function releaseSquareStatus(release: Release) {
  const parts = ['release'];

  if (release.draft) parts.push('draft');
  else if (release.prerelease) parts.push('prerelease');
  else parts.push('stable');

  if (isOldRelease(release)) parts.push('old');

  return parts.join(' ');
}

export function tagSquareStatus(tag: Tag) {
  return isVersionTag(tag.name) ? 'tag version' : 'tag other';
}

export function teamSquareStatus(team: Team) {
  const parts = ['team', teamPermission(team)];

  if (team.privacy === 'secret') parts.push('secret');
  else if (team.privacy) parts.push('visible');

  if (team.parent) parts.push('child');
  if (team.members_count === 0) parts.push('empty');
  else if (typeof team.members_count === 'number' && team.members_count >= 10) parts.push('large');

  return parts.join(' ');
}

export function memberSquareStatus(member: Member) {
  const parts = ['member', isBotMember(member) ? 'bot' : 'user'];

  if (member.site_admin) parts.push('site-admin');

  return parts.join(' ');
}

export function isBotMember(member: Pick<Member, 'login' | 'type'>) {
  return member.type === 'Bot' || /(\[bot\]|[-_]bot$)/i.test(member.login);
}

export function teamPermission(team: Team) {
  const permission = team.permission;
  return permission && ['pull', 'triage', 'push', 'maintain', 'admin'].includes(permission)
    ? permission
    : 'unknown';
}

export function workflowRunSquareStatus(run: WorkflowRun) {
  if (run.status !== 'completed') return 'running';

  if (run.conclusion === 'success') return 'success';

  if (
    run.conclusion === 'failure' ||
    run.conclusion === 'timed_out' ||
    run.conclusion === 'action_required'
  ) {
    return 'failure';
  }

  if (
    run.conclusion === 'cancelled' ||
    run.conclusion === 'neutral' ||
    run.conclusion === 'skipped'
  ) {
    return 'neutral';
  }

  return 'unknown';
}

export function workflowRunStateLabel(run: WorkflowRun) {
  return run.status === 'completed' ? run.conclusion || 'completed' : run.status;
}

export function isVersionTag(name: string) {
  return /^v?\d+\.\d+/.test(name);
}

export function tagUrl(repo: Repo, tag: Tag) {
  return `https://github.com/${repo.full_name}/tree/${tag.name}`;
}

export function isOldRelease(release: Release) {
  const date = release.published_at || release.created_at;
  const published = new Date(date).getTime();
  const sixMonths = 180 * 24 * 60 * 60 * 1000;
  return Number.isFinite(published) && Date.now() - published > sixMonths;
}

export function isStale(value: string) {
  const updated = new Date(value).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Number.isFinite(updated) && Date.now() - updated > thirtyDays;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
