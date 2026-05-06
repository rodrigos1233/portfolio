# PR 5 Blocking Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the analytics contract, worker validation, and D1 schema with the blocking review feedback on PR `#5`.

**Architecture:** Keep analytics strictly project-scoped, tighten accepted link metadata to a fixed allowlist, and persist gallery image bucket metadata in the D1 aggregate key so client and storage semantics match.

**Tech Stack:** TypeScript, React, Vitest, Cloudflare Workers, D1

---

### Task 1: Make the blocking failures explicit in tests

**Files:**
- Modify: `src/__tests__/analytics.test.ts`
- Modify: `worker/__tests__/track.test.ts`
- Modify: `worker/__tests__/config.test.ts`

**Step 1: Write the failing test**

- Replace `filter`-based client expectations with supported event-pair behavior.
- Add assertions that unknown external link types are rejected.
- Add assertions that `imagePositionBucket` is persisted in worker bindings and migration schema checks.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/analytics.test.ts worker/__tests__/track.test.ts worker/__tests__/config.test.ts`

Expected: FAIL because the current implementation still accepts `filter`, accepts arbitrary `linkType`, and does not persist `imagePositionBucket`.

### Task 2: Implement the minimal contract and worker changes

**Files:**
- Modify: `src/lib/analytics.ts`
- Modify: `worker/index.ts`
- Modify: `migrations/0001_anonymous_click_pairs.sql`
- Create: `migrations/0002_add_image_position_bucket.sql`
- Modify: `docs/privacy-analytics.md`

**Step 1: Write minimal implementation**

- Remove the `filter` event variant and normalization path.
- Add a `PortfolioLinkType` allowlist and validate it during normalization.
- Add a stored `image_position_bucket` dimension and include it in the worker upsert key and bindings.
- Update privacy docs to match the deployed behavior.

**Step 2: Run targeted tests**

Run: `npm test -- src/__tests__/analytics.test.ts worker/__tests__/track.test.ts worker/__tests__/config.test.ts`

Expected: PASS

### Task 3: Verify the branch

**Files:**
- Verify: `src/lib/analytics.ts`
- Verify: `worker/index.ts`
- Verify: `migrations/0001_anonymous_click_pairs.sql`
- Verify: `migrations/0002_add_image_position_bucket.sql`

**Step 1: Run the full suite**

Run: `npm test`

Expected: PASS
