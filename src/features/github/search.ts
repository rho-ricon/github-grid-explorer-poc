import type { IssueOrPull, Member, Release, Repo, RepoWithCi, Tag, Team } from './types';

export function filterItems<T>(items: T[], query: string, getText: (item: T) => string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return items;

  return items.filter((item) => {
    const text = normalize(getText(item));
    return terms.every((term) => text.includes(term));
  });
}

export function repoSearchText(repo: RepoWithCi | Repo) {
  return [
    repo.name,
    repo.full_name,
    repo.description,
    repo.language,
    'ci' in repo ? repo.ci.label : undefined,
  ].join(' ');
}

export function teamSearchText(team: Team) {
  return [team.name, team.slug, team.description, team.privacy, team.permission].join(' ');
}

export function memberSearchText(member: Member) {
  return [member.login, member.type].join(' ');
}

export function issueSearchText(item: IssueOrPull) {
  return [
    item.number,
    `#${item.number}`,
    item.title,
    item.body,
    item.state,
    item.user?.login,
    item.pull_request ? 'pr pull request' : 'issue',
    ...item.labels.map((label) => label.name),
  ].join(' ');
}

export function releaseSearchText(release: Release) {
  return [
    release.name,
    release.tag_name,
    release.draft ? 'draft' : release.prerelease ? 'prerelease pre' : 'stable',
    release.target_commitish,
    release.author?.login,
  ].join(' ');
}

export function tagSearchText(tag: Tag) {
  return [tag.name, tag.commit.sha].join(' ');
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase();
}
