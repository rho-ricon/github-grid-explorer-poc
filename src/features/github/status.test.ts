import { describe, expect, it } from 'vitest';
import {
  issueSquareStatus,
  memberSquareStatus,
  releaseSquareStatus,
  teamSquareStatus,
  workflowRunSquareStatus,
} from './status';
import type { IssueOrPull, Member, Release, Team, WorkflowRun } from './types';

describe('GitHub status encoders', () => {
  it('marks stale busy open issues', () => {
    const issue: IssueOrPull = {
      id: 1,
      number: 42,
      title: 'Needs attention',
      state: 'open',
      html_url: 'https://github.com/example/repo/issues/42',
      comments: 12,
      updated_at: '2020-01-01T00:00:00Z',
      user: { login: 'or' },
      labels: [],
    };

    expect(issueSquareStatus(issue)).toBe('issue open stale busy');
  });

  it('marks pull requests separately from issues', () => {
    const pullRequest: IssueOrPull = {
      id: 2,
      number: 5,
      title: 'Add thing',
      state: 'closed',
      html_url: 'https://github.com/example/repo/pull/5',
      comments: 1,
      updated_at: new Date().toISOString(),
      user: { login: 'rho' },
      labels: [],
      pull_request: {},
    };

    expect(issueSquareStatus(pullRequest)).toBe('pr closed');
  });

  it('encodes release state and age', () => {
    const release: Release = {
      id: 3,
      name: 'v1.0.0',
      tag_name: 'v1.0.0',
      html_url: 'https://github.com/example/repo/releases/tag/v1.0.0',
      draft: false,
      prerelease: true,
      published_at: '2020-01-01T00:00:00Z',
      created_at: '2020-01-01T00:00:00Z',
      target_commitish: 'main',
      author: { login: 'rho' },
      assets: [],
    };

    expect(releaseSquareStatus(release)).toBe('release prerelease old');
  });

  it('encodes team permissions and shape markers', () => {
    const team: Team = {
      id: 4,
      name: 'Core',
      slug: 'core',
      description: null,
      privacy: 'secret',
      permission: 'admin',
      members_count: 12,
      repos_count: 3,
      parent: { id: 1, name: 'Engineering', slug: 'engineering' },
      html_url: 'https://github.com/orgs/example/teams/core',
    };

    expect(teamSquareStatus(team)).toBe('team admin secret child large');
  });

  it('distinguishes bot-like members', () => {
    const member: Member = {
      id: 5,
      login: 'release-bot',
      avatar_url: 'https://avatars.githubusercontent.com/u/5',
      html_url: 'https://github.com/release-bot',
      type: 'User',
      site_admin: true,
    };

    expect(memberSquareStatus(member)).toBe('member bot site-admin');
  });

  it('maps workflow run conclusions to square states', () => {
    const run: WorkflowRun = {
      id: 6,
      name: 'CI',
      display_title: 'Run tests',
      status: 'completed',
      conclusion: 'failure',
      html_url: 'https://github.com/example/repo/actions/runs/6',
      event: 'push',
      head_branch: 'main',
      head_sha: 'abc123',
      run_number: 10,
      run_attempt: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:01:00Z',
      run_started_at: '2026-01-01T00:00:05Z',
      actor: { login: 'rho' },
    };

    expect(workflowRunSquareStatus(run)).toBe('failure');
  });
});
