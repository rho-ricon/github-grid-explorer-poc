import { execFileSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function githubProxy(): Plugin {
  let token: string | null | undefined;

  function getToken() {
    if (token !== undefined) return token;

    try {
      token = execFileSync('gh', ['auth', 'token'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      token = null;
    }

    return token;
  }

  return {
    name: 'local-github-proxy',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/github/')) {
          next();
          return;
        }

        try {
          const remoteAddress = request.socket.remoteAddress;
          const isLocalRequest =
            remoteAddress === '127.0.0.1' ||
            remoteAddress === '::1' ||
            remoteAddress === '::ffff:127.0.0.1';

          if (!isLocalRequest) {
            response.statusCode = 403;
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({ message: 'GitHub proxy is local-only' }));
            return;
          }

          const githubUrl = `https://api.github.com${request.url.slice('/github'.length)}`;
          const headers: Record<string, string> = {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'base-ui-poc',
          };
          const githubToken = getToken();

          if (githubToken) {
            headers.Authorization = `Bearer ${githubToken}`;
          }

          const githubResponse = await fetch(githubUrl, { headers });
          const body = await githubResponse.text();

          response.statusCode = githubResponse.status;
          response.setHeader(
            'content-type',
            githubResponse.headers.get('content-type') || 'application/json',
          );

          for (const header of [
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
            'x-ratelimit-reset',
            'x-oauth-scopes',
          ]) {
            const value = githubResponse.headers.get(header);
            if (value) response.setHeader(header, value);
          }

          response.end(body);
        } catch (error) {
          response.statusCode = 500;
          response.setHeader('content-type', 'application/json');
          response.end(
            JSON.stringify({
              message: error instanceof Error ? error.message : 'GitHub proxy failed',
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/github-grid-explorer-poc/' : '/',
  plugins: [react(), githubProxy()],
});
