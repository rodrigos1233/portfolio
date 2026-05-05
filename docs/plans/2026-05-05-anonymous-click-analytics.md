# Anonymous Click Analytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add privacy-first, first-party click-pair analytics to the portfolio without cookies, browser storage, or persistent identifiers.

**Architecture:** The React app will emit a small allowlist of meaningful interaction events into a local analytics helper that keeps only one in-memory previous event. When a valid pair is formed, the helper sends a minimal payload to a Cloudflare Worker endpoint, which validates the payload and increments aggregate counters in D1. No raw per-visitor event log is stored.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Cloudflare Workers, D1

---

### Task 1: Add analytics helper tests

**Files:**
- Create: `src/__tests__/analytics.test.ts`
- Reference: `src/test/setup.ts`

**Step 1: Write the failing test**

Add tests that define the expected client-side analytics behavior:

- a first event does not send a network payload
- a second valid event sends one derived pair
- invalid event sequences are ignored
- no browser storage APIs are used

Include mocked `navigator.sendBeacon` and `fetch`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/analytics.test.ts`

Expected: FAIL because `src/lib/analytics.ts` does not exist yet.

**Step 3: Write minimal implementation**

Create `src/lib/analytics.ts` with:

- a typed event model
- module-local in-memory state
- a function to record an event
- transport using `sendBeacon` with `fetch` fallback
- guards that avoid storage APIs

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/analytics.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/__tests__/analytics.test.ts src/lib/analytics.ts
git commit -m "feat: add client analytics helper"
```

### Task 2: Instrument project card opens

**Files:**
- Modify: `src/components/ProjectCard.tsx`
- Test: `src/__tests__/components.test.tsx`
- Reference: `src/lib/analytics.ts`

**Step 1: Write the failing test**

Extend the existing `ProjectCard` test suite to assert that clicking the card:

- still calls `onSelect(project.id)`
- also records a `project_open` event

Mock the analytics helper rather than exercising network transport here.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/components.test.tsx`

Expected: FAIL because `ProjectCard` is not yet wired to analytics.

**Step 3: Write minimal implementation**

Import the analytics helper in `src/components/ProjectCard.tsx` and record:

- `project_open` with `project.id`

Ensure the existing selection behavior remains unchanged.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/components.test.tsx`

Expected: PASS for the new assertion and no regressions in existing card tests.

**Step 5: Commit**

```bash
git add src/components/ProjectCard.tsx src/__tests__/components.test.tsx
git commit -m "feat: track project open clicks"
```

### Task 3: Instrument detail header actions

**Files:**
- Modify: `src/components/ProjectDetailHeader.tsx`
- Test: `src/__tests__/components.test.tsx`
- Reference: `src/lib/analytics.ts`

**Step 1: Write the failing test**

Add tests that assert:

- clicking "All projects" records `back_to_list`
- clicking each external link records `external_link_click` with the expected `link_type`

Mock the analytics helper in the test file.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/components.test.tsx`

Expected: FAIL because the header is not instrumented yet.

**Step 3: Write minimal implementation**

Update `src/components/ProjectDetailHeader.tsx` to call the analytics helper from:

- the back button handler
- each rendered external link

Preserve current navigation and link behavior.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/components.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ProjectDetailHeader.tsx src/__tests__/components.test.tsx
git commit -m "feat: track detail header interactions"
```

### Task 4: Instrument gallery actions

**Files:**
- Modify: `src/components/ProjectGallery.tsx`
- Test: `src/__tests__/components.test.tsx`
- Reference: `src/lib/analytics.ts`

**Step 1: Write the failing test**

Add tests that assert:

- clicking the overflow button records `gallery_expand`
- clicking an image records `gallery_image_open`
- the image event uses a bucketed index rather than raw image names

Mock the analytics helper in the test file.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/components.test.tsx`

Expected: FAIL because the gallery is not instrumented yet.

**Step 3: Write minimal implementation**

Update `src/components/ProjectGallery.tsx` to:

- call analytics on expand/collapse only for the expand action
- call analytics when an image button opens the modal
- bucket image positions into `1`, `2-4`, `5+`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/components.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ProjectGallery.tsx src/__tests__/components.test.tsx
git commit -m "feat: track gallery interactions"
```

### Task 5: Add Worker ingestion endpoint tests

**Files:**
- Create: `worker/__tests__/track.test.ts`
- Reference: `wrangler.jsonc`

**Step 1: Write the failing test**

Add Worker-side tests that define the ingestion contract:

- rejects non-POST methods
- rejects invalid event names
- accepts valid payloads
- increments an aggregate counter row

Use a lightweight Worker test harness appropriate for the project setup.

**Step 2: Run test to verify it fails**

Run: `npm test -- worker/__tests__/track.test.ts`

Expected: FAIL because there is no Worker entrypoint yet.

**Step 3: Write minimal implementation**

Create the Worker entrypoint, for example `worker/index.ts`, with:

- asset-serving behavior for non-API requests
- `POST /api/track` handling
- payload validation
- D1 upsert logic

**Step 4: Run test to verify it passes**

Run: `npm test -- worker/__tests__/track.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add worker/__tests__/track.test.ts worker/index.ts
git commit -m "feat: add analytics ingestion endpoint"
```

### Task 6: Bind D1 and declare schema

**Files:**
- Modify: `wrangler.jsonc`
- Create: `migrations/0001_anonymous_click_pairs.sql`
- Optional: `worker/types.d.ts` if generated types are introduced

**Step 1: Write the failing test**

Add either:

- a Worker test that expects the D1 binding to exist, or
- a configuration check in the test harness that fails without the binding/schema

**Step 2: Run test to verify it fails**

Run: `npm test -- worker/__tests__/track.test.ts`

Expected: FAIL because the D1 binding or table is not configured yet.

**Step 3: Write minimal implementation**

Update `wrangler.jsonc` to add:

- Worker entrypoint config
- D1 binding config

Create the SQL migration with:

- table definition
- unique key on `day, project_id, from_event, to_event, link_type`

**Step 4: Run test to verify it passes**

Run: `npm test -- worker/__tests__/track.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add wrangler.jsonc migrations/0001_anonymous_click_pairs.sql
git commit -m "feat: configure analytics D1 storage"
```

### Task 7: Add privacy note and developer documentation

**Files:**
- Modify: `README.md`
- Optional Create: `docs/privacy-analytics.md`

**Step 1: Write the failing test**

Add a documentation checklist in the plan execution notes or a README assertion test only if the repo already uses documentation tests. Do not invent a docs test framework unnecessarily.

**Step 2: Run test to verify it fails**

Run: `npm test`

Expected: No dedicated docs test. Skip creating one if it adds no value.

**Step 3: Write minimal implementation**

Document:

- what is tracked
- what is not tracked
- where the Worker endpoint lives
- the privacy posture and limitations

**Step 4: Run verification**

Run: `npm test`

Expected: PASS, confirming docs updates did not affect the build/test suite.

**Step 5: Commit**

```bash
git add README.md docs/privacy-analytics.md
git commit -m "docs: document anonymous click analytics"
```

### Task 8: Run end-to-end verification

**Files:**
- Verify: `src/components/ProjectCard.tsx`
- Verify: `src/components/ProjectDetailHeader.tsx`
- Verify: `src/components/ProjectGallery.tsx`
- Verify: `src/lib/analytics.ts`
- Verify: `worker/index.ts`
- Verify: `wrangler.jsonc`

**Step 1: Run targeted tests**

Run:

```bash
npm test -- src/__tests__/analytics.test.ts
npm test -- src/__tests__/components.test.tsx
npm test -- worker/__tests__/track.test.ts
```

Expected: PASS

**Step 2: Run the full suite**

Run: `npm test`

Expected: PASS

**Step 3: Smoke-check build expectations**

Run: `npm run build`

Expected: production build completes successfully after analytics changes.

**Step 4: Manual verification**

Check locally that:

- project navigation still works
- external links still open normally
- gallery modal behavior is unchanged
- failed analytics requests do not break the UI

**Step 5: Commit**

```bash
git add -A
git commit -m "test: verify anonymous click analytics implementation"
```
