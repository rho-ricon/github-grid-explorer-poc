import type { IssueOrPull, Release, Repo, Tag } from './types';

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
