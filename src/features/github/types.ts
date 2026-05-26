export type Repo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
};

export type Team = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  privacy?: string;
  permission?: string;
  html_url: string;
};

export type Member = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
};

export type RepoCi = {
  state: 'loading' | 'success' | 'failure' | 'running' | 'neutral' | 'none' | 'unknown';
  label: string;
  url?: string;
};

export type RepoWithCi = Repo & { ci: RepoCi };

export type IssueOrPull = {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: 'open' | 'closed';
  html_url: string;
  comments: number;
  updated_at: string;
  user: { login: string } | null;
  labels: { name: string; color: string }[];
  pull_request?: unknown;
};

export type Release = {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string;
  target_commitish: string;
  author: { login: string } | null;
  assets: { id: number; name: string }[];
};

export type Tag = {
  name: string;
  commit: { sha: string; url: string };
  zipball_url: string;
  tarball_url: string;
};

export type WorkflowRun = {
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
};
