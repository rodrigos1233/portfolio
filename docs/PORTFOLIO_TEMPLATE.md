# Portfolio Presentation Template

Create a file called `PORTFOLIO_PRESENTATION.md` in the root of your project repo. The file uses YAML front matter for structured metadata and markdown for the narrative body.

## Template

```markdown
---
id: my-project-name
title: My Project Name
tagline: One-line description of what this project does
status: live          # live | wip | experimental | archived
visibility: public    # public | private
tags:
  - web
  - api
stack:
  - TypeScript
  - React

# Optional fields
role: solo            # solo | team | client
featured: false
timeframe:
  start: "2024-01"
  end: null           # null or "YYYY-MM"
origin: personal      # personal | professional

links:
  live: https://example.com
  repo: https://github.com/user/repo
  docs: null
  demo: null
  post: null
  video: null

metrics:
  users: null
  requests_per_day: null
  latency_ms_p95: null
  uptime: null
  notes: null

media:
  cover_image: null
  gallery: []

# For professional work — disclose ownership clearly
attribution:
  ownership: "Company Name — shared with permission"
  context: "Brief context of the work environment"
  my_role: "Your specific contribution"
  team_size: 4
  permissions:
    code_public: false
    screenshots_public: true
    discussion_level: architecture
---

## Context / Problem

What problem does this solve? Why does it exist?

## Solution

How does it work? What are the key features?

## Architecture

Include a diagram or code block showing the system design.

```
Component A → Component B → Component C
```

## Current State

What's the current status? What's next?
```

## Required Fields

| Field        | Type       | Description                          |
| ------------ | ---------- | ------------------------------------ |
| `id`         | string     | Kebab-case unique identifier         |
| `title`      | string     | Display name                         |
| `tagline`    | string     | One-line summary                     |
| `status`     | enum       | `live`, `wip`, `experimental`, `archived` |
| `visibility` | enum       | `public`, `private`                  |
| `tags`       | string[]   | From controlled vocabulary           |
| `stack`      | string[]   | Technologies used                    |

## Validation

Front matter is validated against `schema/portfolio-project.schema.json` at build time. The build will fail if required fields are missing or values don't match the expected format.

## Triggering Updates

When you push changes to `PORTFOLIO_PRESENTATION.md` on the `main` branch, a GitHub Action can trigger a Cloudflare Pages deploy hook to rebuild the portfolio. See `.github/workflows/trigger-portfolio-template.yml` for the reference workflow.
