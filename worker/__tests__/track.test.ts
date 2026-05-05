import worker from '../index';

type D1RunResult = {
  success: boolean;
  meta?: Record<string, unknown>;
};

type PreparedStatementCall = {
  sql: string;
  bindings: unknown[];
};

function createAssetsFetcher() {
  return {
    fetch: vi.fn((request: Request) =>
      Promise.resolve(
        new Response(`asset:${new URL(request.url).pathname}`, {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
      ),
    ),
  };
}

function createDb() {
  const calls: PreparedStatementCall[] = [];

  return {
    calls,
    prepare: vi.fn((sql: string) => ({
      bind: (...bindings: unknown[]) => ({
        run: vi.fn(async (): Promise<D1RunResult> => {
          calls.push({ sql, bindings });
          return { success: true };
        }),
      }),
    })),
  };
}

function createEnv() {
  return {
    ASSETS: createAssetsFetcher(),
    DB: createDb(),
  };
}

describe('worker analytics ingestion', () => {
  it('serves static assets for non-API requests', async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request('https://example.com/projects'),
      env,
      {} as ExecutionContext,
    );

    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
    expect(env.DB.prepare).not.toHaveBeenCalled();
    await expect(response.text()).resolves.toBe('asset:/projects');
  });

  it('rejects non-POST methods for the ingestion endpoint', async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request('https://example.com/api/track', { method: 'GET' }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(405);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('rejects invalid event payloads', async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { type: 'project_open', projectId: 'project-alpha' },
          to: {
            type: 'external_link_click',
            projectId: 'project-alpha',
            linkType: '',
          },
        }),
      }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(400);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('rejects invalid event names', async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { type: 'project_open', projectId: 'project-alpha' },
          to: {
            type: 'not_a_real_event',
            projectId: 'project-alpha',
          },
        }),
      }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(400);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('rejects mismatched project scopes', async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { type: 'project_open', projectId: 'project-alpha' },
          to: {
            type: 'external_link_click',
            projectId: 'project-beta',
            linkType: 'repo',
          },
        }),
      }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'invalid_project_scope',
    });
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('rejects oversized payloads before parsing JSON', async () => {
    const env = createEnv();
    const oversizedBody = 'x'.repeat(10_000);

    const response = await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': String(oversizedBody.length),
        },
        body: oversizedBody,
      }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: 'payload_too_large',
    });
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('rejects oversized payloads by actual body size when content-length is absent', async () => {
    const env = createEnv();
    const oversizedBody = 'é'.repeat(3000);

    const response = await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: oversizedBody,
      }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: 'payload_too_large',
    });
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('accepts valid payloads', async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { type: 'project_open', projectId: 'project-alpha' },
          to: {
            type: 'external_link_click',
            projectId: 'project-alpha',
            linkType: 'repo',
          },
        }),
      }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(202);
    expect(env.DB.prepare).toHaveBeenCalledTimes(1);
    expect(env.DB.calls[0]?.bindings).toEqual([
      expect.any(String),
      'project-alpha',
      'project_open',
      'external_link_click',
      'repo',
    ]);
  });

  it('accepts valid payloads with trimmed event fields', async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { type: '  project_open  ', projectId: '  project-alpha  ' },
          to: {
            type: '  external_link_click  ',
            projectId: '  project-alpha  ',
            linkType: '  repo  ',
          },
        }),
      }),
      env,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(202);
    expect(env.DB.calls[0]?.bindings).toEqual([
      expect.any(String),
      'project-alpha',
      'project_open',
      'external_link_click',
      'repo',
    ]);
  });

  it('increments an aggregate counter row', async () => {
    const env = createEnv();

    await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { type: 'project_open', projectId: 'project-alpha' },
          to: {
            type: 'external_link_click',
            projectId: 'project-alpha',
            linkType: 'live',
          },
        }),
      }),
      env,
      {} as ExecutionContext,
    );

    expect(env.DB.calls).toHaveLength(1);
    expect(env.DB.calls[0]?.sql).toContain('INSERT INTO analytics_click_pairs');
    expect(env.DB.calls[0]?.sql).toContain('ON CONFLICT');
    expect(env.DB.calls[0]?.sql).toContain('count = count + 1');
    expect(env.DB.calls[0]?.bindings).toEqual([
      expect.any(String),
      'project-alpha',
      'project_open',
      'external_link_click',
      'live',
    ]);
  });

  it('uses an empty link_type sentinel for non-link events', async () => {
    const env = createEnv();

    await worker.fetch(
      new Request('https://example.com/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { type: 'project_open', projectId: 'project-alpha' },
          to: {
            type: 'gallery_expand',
            projectId: 'project-alpha',
          },
        }),
      }),
      env,
      {} as ExecutionContext,
    );

    expect(env.DB.calls[0]?.bindings).toEqual([
      expect.any(String),
      'project-alpha',
      'project_open',
      'gallery_expand',
      '',
    ]);
  });
});
