import { describe, expect, it } from 'vitest';
import { githubAvatarUrl } from './avatars';

describe('githubAvatarUrl', () => {
  it('sets the requested GitHub avatar size', () => {
    expect(githubAvatarUrl('https://avatars.githubusercontent.com/u/123?v=4', 56)).toBe(
      'https://avatars.githubusercontent.com/u/123?v=4&s=56',
    );
  });

  it('leaves malformed URLs untouched', () => {
    expect(githubAvatarUrl('not a url', 56)).toBe('not a url');
  });
});
