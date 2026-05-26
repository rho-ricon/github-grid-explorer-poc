# GitHub Grid Explorer PoC

A Bun + Vite + React + Base UI experiment for exploring a GitHub org as small stateful square grids.

Live app: https://rho-ricon.github.io/github-grid-explorer-poc/

## Run locally

```bash
bun install
bun run dev
```

Open http://localhost:5173/.

## What it does

- Shows a GitHub org as separate grids for repos, teams, and members.
- Uses square color/state to make dense data scannable.
- Hover/focus a square to see a Base UI `Popover` preview.
- Click a square to drill into full-screen Base UI `Drawer` views.
- Right-click a square for Base UI `ContextMenu` actions.
- Drag a member onto a repo for non-mutating relationship actions.
- Drag a repo onto another repo for a side-by-side operational comparison.
- Carry repos, teams, and members in a floating pouch across drawer views.
- Search filters all grids on the current screen.
- Caches GitHub API responses in browser storage.

## Views

### Org view

- **Repos** — latest GitHub Actions state colors each repo square.
- **Teams** — permission-colored squares, with secret/large/empty/nested markers. Click to view team members. Requires a token with org/member read access.
- **Members** — avatar squares with bot/site-admin markers for public org members, or token-visible members.

### Repo view

- **Workflow Runs** — latest GitHub Actions runs by status/conclusion.
- **Issues** — open/closed, stale, and busy states.
- **Pull Requests** — open/closed, stale, and busy states.
- **Releases** — GitHub Releases, including stable/prerelease/draft/old states.
- **Tags** — git tags, with version tags highlighted.

### Team view

- **Members** — team members as a searchable grid.

## Token support

The app works without a token, but unauthenticated GitHub API requests are heavily rate-limited and cannot read private/org-restricted data.

Use the **Token** button in the app to paste a fine-grained GitHub token. The token is:

- stored in memory by default,
- optionally remembered in this browser's `localStorage`,
- cleared with the **Clear** button.

The token popover includes a link to GitHub's fine-grained token form prefilled for a short-lived read-only token for `KnickKnackLabs`.

## GitHub API behavior

### Local development

In dev, requests go through Vite's local `/github/*` proxy when no browser token is set. The proxy uses `gh auth token` server-side if available, so the token is not exposed to browser code.

The proxy is local-only and rejects non-local requests.

### GitHub Pages / production

On GitHub Pages, the app calls `https://api.github.com` directly. If a user provides a token, it is sent from that user's browser to GitHub.

No token is committed, built into the app, or available to GitHub Pages.

## Quality checks

```bash
bun run lint
bun run test
bun run build
```

Run all three with:

```bash
bun run check
```

Use `bun run format` to apply Biome formatting/import organization.

## Build

```bash
bun run build
```

For GitHub Pages, the deploy workflow builds with:

```bash
GITHUB_PAGES=true bun run build
```

## Project shape

- `src/components/` — generic screen/grid primitives.
- `src/features/github/` — GitHub data, auth, search, previews, legends, context menus, and drawer screens.
- `src/styles.scss` and `src/styles/` — Sass entrypoint and partials for layout, grids, overlays, and shared tokens.
- `src/utils/` — small cache/clipboard helpers.
- `.github/workflows/deploy.yml` — GitHub Pages deployment.

## Possible next experiments

- Use Base UI `Meter` for CI success rate, milestone progress, or activity/freshness.
- Expand non-mutating drag/drop gestures, such as pinning arbitrary squares or comparing richer repo detail data.
