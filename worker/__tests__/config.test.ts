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

function readMigration(filename: string) {
  return readFileSync(
    resolve(process.cwd(), `migrations/${filename}`),
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

  it('ships the base analytics click-pair aggregation schema', () => {
    const migration = readMigration('0001_anonymous_click_pairs.sql');

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

  it('ships a follow-up migration for gallery image bucket persistence', () => {
    const migration = readMigration('0002_add_image_position_bucket.sql');

    expect(migration).toContain(
      'ALTER TABLE analytics_click_pairs RENAME TO analytics_click_pairs_old',
    );
    expect(migration).toContain("image_position_bucket TEXT NOT NULL DEFAULT ''");
    expect(migration).toContain(
      'UNIQUE (day, project_id, from_event, to_event, link_type, image_position_bucket)',
    );
    expect(migration).toContain(
      'INSERT INTO analytics_click_pairs (',
    );
  });
});
