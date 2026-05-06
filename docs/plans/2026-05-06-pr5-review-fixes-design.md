# PR 5 Blocking Review Fixes Design

**Date:** 2026-05-06

## Goal

Address the three blocking Copilot review findings on PR `#5` without expanding the analytics scope.

## Decisions

- Remove `filter` from the shared analytics contract because the UI does not emit it and the worker storage model is project-scoped.
- Constrain `external_link_click.linkType` to the UI's fixed allowlist: `live`, `repo`, `docs`, `demo`, `post`, `video`.
- Preserve `gallery_image_open.imagePositionBucket` through worker ingestion by storing it in D1 and including it in the aggregate uniqueness key.

## Impacted Areas

- `src/lib/analytics.ts`
- `src/__tests__/analytics.test.ts`
- `worker/index.ts`
- `worker/__tests__/track.test.ts`
- `worker/__tests__/config.test.ts`
- `migrations/0001_anonymous_click_pairs.sql`
- `migrations/0002_add_image_position_bucket.sql`
- `docs/privacy-analytics.md`

## Validation

- Targeted Vitest runs for analytics and worker tests
- Full `npm test`
