# Contributing

Thanks for your interest in contributing! This guide covers the development workflow and how to submit changes.

## Development setup

```sh
git clone https://github.com/rodrigos1233/portfolio.git
cd portfolio
npm install
npm run dev
```

Dev mode uses mock data from `src/_portfolio/projects.sample.json` — no GitHub token needed.

## Running tests

```sh
npm test            # single run
npm run test:watch  # watch mode
```

Tests must pass before submitting a PR.

## Project structure

See the [README](README.md#project-structure) for a full map. The key areas for contributors:

- **`src/components/`** — React components (ProjectList, ProjectCard, ProjectDetail, FilterBar, MermaidDiagram)
- **`scripts/collect-portfolio.mjs`** — build-time data collection from GitHub
- **`schema/portfolio-project.schema.json`** — JSON Schema that validates project metadata
- **`docs/`** — template and tag vocabulary docs

## Adding a project

If you're using this as a template for your own portfolio:

1. Add your repo to `portfolio.config.json`
2. Create a `PORTFOLIO_PRESENTATION.md` in your project repo following [`docs/PORTFOLIO_TEMPLATE.md`](docs/PORTFOLIO_TEMPLATE.md)
3. Use tags from the controlled vocabulary in [`docs/tags.md`](docs/tags.md)
4. Run `npm run collect:mock` or `GITHUB_TOKEN=... npm run collect` to verify

## Submitting changes

1. Fork the repo and create a branch from `master`
2. Make your changes
3. Run `npm test` and `npm run build` to verify nothing breaks
4. Submit a pull request with a clear description of what changed and why

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Follow existing code patterns and naming conventions
- Add tests for new functionality
- The schema (`schema/portfolio-project.schema.json`) is a contract — changes to it affect all project repos, so discuss breaking changes in an issue first

## Reporting bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
