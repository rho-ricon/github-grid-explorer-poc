import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { clearAuthenticatedGitHubCache } from './api';

const TOKEN_STORAGE_KEY = 'github-grid-explorer:token';

type GitHubAuthContextValue = {
  token: string;
  rememberToken: boolean;
  saveToken: (token: string, remember: boolean) => void;
  clearToken: () => void;
};

const GitHubAuthContext = createContext<GitHubAuthContextValue | null>(null);

export function GitHubAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => readStoredToken());
  const [rememberToken, setRememberToken] = useState(() => Boolean(readStoredToken()));

  const value = useMemo<GitHubAuthContextValue>(
    () => ({
      token,
      rememberToken,
      saveToken(nextToken, remember) {
        const trimmed = nextToken.trim();
        const authScopeChanged = trimmed !== token || remember !== rememberToken;

        setToken(trimmed);
        setRememberToken(remember);

        if (remember && trimmed) {
          localStorage.setItem(TOKEN_STORAGE_KEY, trimmed);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }

        if (authScopeChanged) {
          clearAuthenticatedGitHubCache();
        }
      },
      clearToken() {
        setToken('');
        setRememberToken(false);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        clearAuthenticatedGitHubCache();
      },
    }),
    [token, rememberToken],
  );

  return <GitHubAuthContext.Provider value={value}>{children}</GitHubAuthContext.Provider>;
}

export function useGitHubAuth() {
  const value = useContext(GitHubAuthContext);
  if (!value) {
    throw new Error('useGitHubAuth must be used inside GitHubAuthProvider');
  }
  return value;
}

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}
