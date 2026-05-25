# GitHub Grid Explorer PoC

A Bun + Vite + React + Base UI experiment for visualizing a GitHub org as square grids.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:5173/.

## What it does

- Org view with separate grids for repos, teams, and members
- Repo squares show latest GitHub Actions status
- Hover/focus squares to see Base UI Popover previews
- Click repo squares to drill into full-screen Base UI Drawer views
- Repo view splits issues and pull requests into separate grids
- Issue/PR squares encode open/closed, stale, and busy states
- GitHub API responses are cached in browser localStorage

## GitHub API

During local development, Vite proxies `/github/*` requests to `https://api.github.com/*`.
If `gh auth token` is available, the proxy uses it server-side so the token is not exposed to browser code.
