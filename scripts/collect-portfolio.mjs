import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'src/_portfolio');
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'projects.json');
const SAMPLE_FILE = resolve(OUTPUT_DIR, 'projects.sample.json');
const SCHEMA_FILE = resolve(ROOT, 'schema/portfolio-project.schema.json');
const CONFIG_FILE = resolve(ROOT, 'portfolio.config.json');

const useMock = process.argv.includes('--mock') || !process.env.GITHUB_TOKEN;

mkdirSync(OUTPUT_DIR, { recursive: true });

if (useMock) {
  console.log('Using mock data (--mock flag or no GITHUB_TOKEN)');
  copyFileSync(SAMPLE_FILE, OUTPUT_FILE);
  const projects = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
  console.log(`Wrote ${projects.length} sample projects to projects.json`);
  process.exit(0);
}

// --- Live mode: fetch from GitHub ---

const token = process.env.GITHUB_TOKEN;
const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));

// Dynamic imports for ESM packages
const { default: matter } = await import('gray-matter');
const { default: Ajv } = await import('ajv');
const { default: addFormats } = await import('ajv-formats');

const schema = JSON.parse(readFileSync(SCHEMA_FILE, 'utf-8'));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const projects = [];
let valid = 0;
let skipped = 0;

for (const entry of config.repos) {
  const { owner, repo, path: filePath = 'PORTFOLIO_PRESENTATION.md' } = entry;
  const label = `${owner}/${repo}`;

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3.raw',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error(`[SKIP] ${label}: HTTP ${res.status}`);
      skipped++;
      continue;
    }

    const raw = await res.text();
    const { data: metadata, content: markdown } = matter(raw);

    const isValid = validate(metadata);
    if (!isValid) {
      console.error(`[FAIL] ${label}: schema validation errors:`);
      for (const err of validate.errors) {
        console.error(`  - ${err.instancePath || '/'} ${err.message}`);
      }
      process.exit(1);
    }

    projects.push({ ...metadata, markdown });
    valid++;
    console.log(`[OK]   ${label}`);
  } catch (err) {
    console.error(`[SKIP] ${label}: ${err.message}`);
    skipped++;
  }
}

writeFileSync(OUTPUT_FILE, JSON.stringify(projects, null, 2));
console.log(`\nFetched ${config.repos.length} presentations (${valid} valid, ${skipped} skipped)`);

if (valid === 0) {
  console.error('No valid projects collected — build will have no data.');
  process.exit(1);
}
