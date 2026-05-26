import { isBotMember, teamPermission } from './status';
import type { IssueOrPull, Member, Release, Repo, RepoWithCi, Tag, Team, WorkflowRun } from './types';

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
  return [
    team.name,
    team.slug,
    team.description,
    team.privacy,
    teamPermission(team),
    team.members_count,
    team.repos_count,
    team.parent?.name,
    team.parent?.slug,
  ].join(' ');
}

export function memberSearchText(member: Member) {
  return [
    member.login,
    member.type,
    isBotMember(member) ? 'bot' : 'user',
    member.site_admin ? 'site admin' : undefined,
  ].join(' ');
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

export function workflowRunSearchText(run: WorkflowRun) {
  return [
    run.name,
    run.display_title,
    run.status,
    run.conclusion,
    run.event,
    run.head_branch,
    run.head_sha,
    run.run_number,
    run.actor?.login,
  ].join(' ');
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase();
}
