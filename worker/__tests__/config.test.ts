import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type WranglerConfig = {
  main?: string;
  d1_databases?: Array<{
    binding?: string;
    database_name?: string;
    database_id?: string;
  }>;
};

function readWranglerConfig() {
  const rawConfig = readFileSync(resolve(process.cwd(), 'wrangler.jsonc'), 'utf8');
  return JSON.parse(rawConfig) as WranglerConfig;
}

function readMigration() {
  return readFileSync(
    resolve(process.cwd(), 'migrations/0001_anonymous_click_pairs.sql'),
    'utf8',
  );
}

describe('worker D1 wiring', () => {
  it('declares the worker entrypoint and the production D1 binding', () => {
    const config = readWranglerConfig();

    expect(config.main).toBe('worker/index.ts');
    expect(config.d1_databases).toEqual([
      {
        binding: 'DB',
        database_name: 'portfolio-analytics',
        database_id: '27fe3910-62cc-4348-a41b-bcb2437e8d77',
      },
    ]);
  });

  it('ships the analytics click-pair aggregation schema', () => {
    const migration = readMigration();

    expect(migration).toContain('CREATE TABLE analytics_click_pairs');
    expect(migration).toContain('day TEXT NOT NULL');
    expect(migration).toContain('project_id TEXT NOT NULL');
    expect(migration).toContain('from_event TEXT NOT NULL');
    expect(migration).toContain('to_event TEXT NOT NULL');
    expect(migration).toContain("link_type TEXT NOT NULL DEFAULT ''");
    expect(migration).toContain('count INTEGER NOT NULL DEFAULT 0');
    expect(migration).toContain(
      'UNIQUE (day, project_id, from_event, to_event, link_type)',
    );
  });
});
