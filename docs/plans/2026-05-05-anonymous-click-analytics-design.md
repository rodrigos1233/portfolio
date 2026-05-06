# Anonymous Click Analytics Design

**Date:** 2026-05-05

## Goal

Introduce first-party interaction logging for the portfolio that helps answer "what do people click on together?" while taking the safer privacy posture:

- no cookies
- no `localStorage`
- no `sessionStorage`
- no persistent identifiers
- no third-party analytics
- no raw per-visitor event history

## Current Project Context

The portfolio is a static React/Vite single-page app deployed on Cloudflare Workers assets via `wrangler.jsonc`.

The main interaction surfaces relevant to analytics are:

- project opens from [`src/components/ProjectCard.tsx`](../../src/components/ProjectCard.tsx)
- back-to-list navigation from [`src/components/ProjectDetailHeader.tsx`](../../src/components/ProjectDetailHeader.tsx)
- external project links from [`src/components/ProjectDetailHeader.tsx`](../../src/components/ProjectDetailHeader.tsx)
- gallery expand and image-open actions from [`src/components/ProjectGallery.tsx`](../../src/components/ProjectGallery.tsx)

## Recommended Approach

Use a first-party Cloudflare Worker endpoint at `POST /api/track` and store only aggregated click-pair counters in D1.

The client should not create or persist any visit identifier. Instead, the browser runtime keeps a single in-memory `lastMeaningfulEvent`. When the next meaningful event occurs during the same runtime, the client sends only the derived pair to the server.

Example:

- user opens a project
- user clicks the repo link
- client sends one aggregate-worthy event pair: `project_open -> external_link_click`

The client never sends:

- a cookie id
- a session id
- an event history
- a full referrer
- a query string
- a free-text payload

## Why This Approach

This is the safer posture because it avoids browser storage and avoids reconstructing a visit across tabs, reloads, or days. The tradeoff is intentional: the analytics become approximate and runtime-scoped rather than true per-visitor journey analytics.

This design is aimed at answering directional product questions such as:

- which projects most often lead to repo clicks
- which projects lead to live/demo clicks
- which gallery interactions tend to happen after project opens
- how often users return to the list after opening a project

## Event Model

### Raw client-side event types

- `project_open`
  - fields: `project_id`
- `external_link_click`
  - fields: `project_id`, `link_type`
  - allowed `link_type`: `live`, `repo`, `docs`, `demo`, `post`, `video`
- `gallery_expand`
  - fields: `project_id`
- `gallery_image_open`
  - fields: `project_id`, `image_index_bucket`
  - bucket values: `1`, `2-4`, `5+`
- `back_to_list`
  - fields: `project_id`

### Derived server payload

The client should send only derived pairs:

- `project_id`
- `from_event`
- `to_event`
- optional `link_type`

`link_type` is needed only when the second event is `external_link_click`.

## Client-Side Behavior

Create a small helper module under `src/lib`, for example `src/lib/analytics.ts`.

Responsibilities:

- expose typed tracking functions used by UI components
- hold one ephemeral in-memory `lastMeaningfulEvent`
- derive valid event pairs
- send a small JSON payload to `POST /api/track`
- drop invalid or incomplete pairs
- reset the in-memory state when appropriate

Rules:

- do not write anything to browser storage
- do not emit on every click in the app
- track only the approved allowlist of meaningful portfolio interactions
- do not block navigation if the network request fails

Transport behavior:

- use `navigator.sendBeacon` when possible
- fall back to `fetch(..., { keepalive: true })`
- silently ignore failures

## Server-Side Behavior

Add a Worker entrypoint so the deployment serves static assets and handles `POST /api/track`.

Endpoint behavior:

- accept only `POST /api/track`
- reject oversized payloads
- validate the payload against an allowlist
- normalize missing optional values to `NULL`
- increment an aggregate counter row in D1
- return a minimal success response

The endpoint should never persist:

- IP addresses by design
- full user agent strings
- referrer URLs
- query strings
- arbitrary JSON blobs

## D1 Storage Model

Store only aggregate counts. A single table is sufficient:

- `day TEXT`
- `project_id TEXT`
- `from_event TEXT`
- `to_event TEXT`
- `link_type TEXT NULL`
- `count INTEGER NOT NULL`

Constraints:

- primary or unique key on `day, project_id, from_event, to_event, link_type`

Update behavior:

- insert the row if missing
- otherwise increment `count`

This supports simple reporting queries without preserving per-visitor histories.

## Query Examples

- top next actions after `project_open`
- top `repo` clicks by `project_id`
- gallery interactions by `project_id`
- `back_to_list` frequency by `project_id`

## Privacy Guardrails

- first-party only
- no cross-site tracking
- no ad-tech reuse
- no persistent identifier
- no device storage used for analytics correlation
- short retention window, recommended `30` days
- privacy notice should describe the analytics in plain language

This design is meant to minimize compliance risk, not eliminate legal analysis. A privacy notice is still appropriate, and the final compliance position should be validated against the jurisdictions the site targets.

## Known Limitations

- not true visit analytics
- no cross-tab correlation
- no correlation after a reload
- no unique visitor counting
- no exact click path reconstruction

These are accepted tradeoffs for the safer privacy posture.

## Components to Instrument

- [`src/components/ProjectCard.tsx`](../../src/components/ProjectCard.tsx)
  - emit `project_open`
- [`src/components/ProjectDetailHeader.tsx`](../../src/components/ProjectDetailHeader.tsx)
  - emit `external_link_click`
  - emit `back_to_list`
- [`src/components/ProjectGallery.tsx`](../../src/components/ProjectGallery.tsx)
  - emit `gallery_expand`
  - emit `gallery_image_open`

## Testing Strategy

Client tests:

- helper derives only allowed pairs
- helper does not persist identifiers
- component interactions call the helper with the right payloads

Server tests:

- invalid payloads are rejected
- valid payloads increment counters
- repeated valid payloads upsert correctly

Integration checks:

- existing component behavior remains unchanged
- route transitions still work
- analytics failures do not block navigation
