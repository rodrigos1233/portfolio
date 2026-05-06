# Privacy Analytics

This portfolio uses first-party, anonymous interaction analytics to answer a narrow question:

What do visitors tend to click on together?

## What Is Tracked

The client emits a small allowlist of interaction events:

- `project_open`
- `back_to_list`
- `external_link_click`
- `gallery_expand`
- `gallery_image_open`

The browser keeps only one in-memory previous event. When a valid second event occurs, the site sends a derived pair to `POST /api/track`.

Example:

- `project_open` -> `external_link_click`
- `project_open` -> `gallery_image_open`
- `gallery_expand` -> `gallery_image_open`

## What Is Not Tracked

- no cookies
- no `localStorage`
- no `sessionStorage`
- no persistent visitor identifier
- no cross-site tracking
- no ad-tech reuse
- no raw per-visitor event history

## Event Shape

The Worker accepts validated event pairs based on the shared analytics contract in `src/lib/analytics.ts`.

Current event variants:

- `project_open` with `projectId`
- `back_to_list` with `projectId`
- `external_link_click` with `projectId` and `linkType`
- `gallery_expand` with `projectId`
- `gallery_image_open` with `projectId` and `imagePositionBucket`

`gallery_image_open` uses bucketed positions only:

- `1`
- `2-4`
- `5+`

## Storage

The Worker writes aggregate counts into D1 table `analytics_click_pairs`.

Stored dimensions:

- `day`
- `project_id`
- `from_event`
- `to_event`
- `link_type`
- `image_position_bucket`
- `count`

For non-link events, `link_type` is stored as an empty-string sentinel so D1 uniqueness and upsert behavior remain correct.
For non-gallery-image events, `image_position_bucket` is stored as an empty-string sentinel for the same reason.

## Worker Behavior

`worker/index.ts`:

- serves static assets for non-API requests
- accepts only `POST /api/track`
- validates payloads against the shared analytics event model
- rejects invalid payloads, cross-project event pairs, and oversized bodies
- increments aggregate counters in D1

## Limitations

- This is runtime-scoped, not true visit analytics.
- Reloads and new tabs break the local event chain.
- It does not calculate unique visitors.
- It is intended for directional product insight, not user-level journey reconstruction.
