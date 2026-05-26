import { describe, expect, it } from 'vitest';
import { filterItems, issueSearchText, memberSearchText, teamSearchText } from './search';
import type { IssueOrPull, Member, Team } from './types';

describe('filterItems', () => {
  it('matches all normalized search terms', () => {
    const items = ['alpha repo', 'beta issue', 'alpha issue'];

    expect(filterItems(items, 'ALPHA issue', (item) => item)).toEqual(['alpha issue']);
  });

  it('returns all items for empty queries', () => {
    const items = ['alpha', 'beta'];

    expect(filterItems(items, '   ', (item) => item)).toBe(items);
  });
});

describe('GitHub search text', () => {
  it('includes issue number, author, labels, and kind', () => {
    const item: IssueOrPull = {
      id: 1,
      number: 42,
      title: 'Fix pouch drag',
      body: 'Dragging should cross views',
      state: 'open',
      html_url: 'https://github.com/example/repo/issues/42',
      comments: 0,
      updated_at: '2026-01-01T00:00:00Z',
      user: { login: 'rho' },
      labels: [{ name: 'ui', color: 'ffffff' }],
    };

    expect(issueSearchText(item)).toContain('#42');
    expect(issueSearchText(item)).toContain('rho');
    expect(issueSearchText(item)).toContain('ui');
    expect(issueSearchText(item)).toContain('issue');
  });

  it('includes team metadata', () => {
    const team: Team = {
      id: 2,
      name: 'Core',
      slug: 'core',
      description: 'Core maintainers',
      privacy: 'secret',
      permission: 'maintain',
      members_count: 4,
      repos_count: 7,
      parent: { id: 1, name: 'Engineering', slug: 'engineering' },
      html_url: 'https://github.com/orgs/example/teams/core',
    };

    expect(teamSearchText(team)).toContain('maintain');
    expect(teamSearchText(team)).toContain('Engineering');
  });

  it('adds semantic member words', () => {
    const member: Member = {
      id: 3,
      login: 'release-bot',
      avatar_url: 'https://avatars.githubusercontent.com/u/3',
      html_url: 'https://github.com/release-bot',
      type: 'User',
    };

    expect(memberSearchText(member)).toContain('bot');
  });
});
