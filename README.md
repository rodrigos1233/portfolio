# Portfolio

A data-driven portfolio site that pulls project presentations from GitHub repos and renders them as a static site. Each project is documented via a `PORTFOLIO_PRESENTATION.md` file in its own repository, using YAML front matter for metadata and markdown for the narrative body.

## How it works

1. A prebuild script (`scripts/collect-portfolio.mjs`) fetches `PORTFOLIO_PRESENTATION.md` from each repo listed in `portfolio.config.json` via the GitHub API
2. Front matter is validated against `schema/portfolio-project.schema.json`
3. The collected data is written to `src/_portfolio/projects.json`
4. Vite builds the React app, which renders the project list and detail views
5. The static output is deployed to Cloudflare Workers via Wrangler

Architecture diagrams in markdown use [Mermaid](https://mermaid.js.org/syntax/architecture) `architecture-beta` syntax and are rendered as interactive SVGs with lazy loading.

## Getting started

### Prerequisites

- Node.js 22+
- A GitHub personal access token (for live data fetching)

### Local development

```sh
npm install
npm run dev
```

This uses mock data from `src/_portfolio/projects.sample.json` so no token is needed for local development.

### Build with live data

```sh
GITHUB_TOKEN=ghp_... npm run build
```

The prebuild step fetches presentations from the repos in `portfolio.config.json` and validates them before the Vite build runs.

## Adding a project

1. Add the repo to `portfolio.config.json`:

```json
{ "owner": "rodrigos1233", "repo": "my-project", "path": "PORTFOLIO_PRESENTATION.md" }
```

2. Create `PORTFOLIO_PRESENTATION.md` in the target repo following the template in `docs/PORTFOLIO_TEMPLATE.md`. See `docs/tags.md` for the controlled tag vocabulary.

3. Push both changes. The portfolio will rebuild on the next deploy.

### Automated rebuilds

Each project repo can include `.github/workflows/trigger-portfolio-template.yml` to trigger a Cloudflare Pages deploy hook when `PORTFOLIO_PRESENTATION.md` is updated. Set `PORTFOLIO_DEPLOY_HOOK_URL` as a repository secret.

## Project structure

```
scripts/
  collect-portfolio.mjs    # Fetches and validates project data from GitHub
schema/
  portfolio-project.schema.json  # JSON Schema for front matter validation
docs/
  PORTFOLIO_TEMPLATE.md    # Template and guidelines for presentation files
  tags.md                  # Controlled tag vocabulary
src/
  _portfolio/
    projects.json          # Generated at build time (gitignored)
    projects.sample.json   # Mock data for local development
  components/
    ProjectList.tsx         # Project grid with tag filtering
    ProjectCard.tsx         # Card preview for each project
    ProjectDetail.tsx       # Full project view with markdown rendering
    FilterBar.tsx           # Tag filter controls
    MermaidDiagram.tsx      # Lazy-loaded Mermaid diagram renderer
  App.tsx                   # History API-based navigation
portfolio.config.json       # List of repos to fetch from
wrangler.jsonc              # Cloudflare Workers deployment config
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server with mock data |
| `npm run build` | Fetch live data + build for production |
| `npm run collect` | Fetch live data only (requires `GITHUB_TOKEN`) |
| `npm run collect:mock` | Copy sample data to projects.json |
| `npm run preview` | Preview the production build locally |

## Deployment

The site deploys to Cloudflare Workers as static assets. `wrangler.jsonc` configures the `dist/` directory as the asset source with SPA fallback routing for client-side navigation.

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS v4 with `@tailwindcss/typography`
- Mermaid for architecture diagrams
- react-markdown with remark-gfm and rehype-highlight
- Cloudflare Workers for hosting
