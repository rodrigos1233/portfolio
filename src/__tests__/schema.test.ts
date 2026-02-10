import { readFileSync } from 'fs';
import { resolve } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const schemaPath = resolve(__dirname, '../../schema/portfolio-project.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

const samplePath = resolve(__dirname, '../_portfolio/projects.sample.json');
const sampleProjects = JSON.parse(readFileSync(samplePath, 'utf-8'));

function createValidator() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

function validProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-project',
    title: 'Test Project',
    tagline: 'A test project',
    status: 'live',
    visibility: 'public',
    tags: ['test'],
    stack: ['TypeScript'],
    ...overrides,
  };
}

describe('portfolio project schema', () => {
  const validate = createValidator();

  it('accepts a minimal valid project', () => {
    expect(validate(validProject())).toBe(true);
  });

  it('accepts all sample projects', () => {
    for (const project of sampleProjects) {
      const { markdown: _, ...metadata } = project;
      const valid = validate(metadata);
      if (!valid) {
        throw new Error(
          `Sample project "${project.id}" failed validation: ${JSON.stringify(validate.errors)}`,
        );
      }
    }
  });

  describe('required fields', () => {
    const requiredFields = ['id', 'title', 'tagline', 'status', 'visibility', 'tags', 'stack'];

    for (const field of requiredFields) {
      it(`rejects missing "${field}"`, () => {
        const project = validProject();
        delete (project as Record<string, unknown>)[field];
        expect(validate(project)).toBe(false);
        expect(validate.errors?.some((e) => e.params?.missingProperty === field)).toBe(true);
      });
    }
  });

  describe('enum validation', () => {
    it('rejects invalid status', () => {
      expect(validate(validProject({ status: 'deleted' }))).toBe(false);
    });

    it('rejects invalid visibility', () => {
      expect(validate(validProject({ visibility: 'unlisted' }))).toBe(false);
    });

    it('rejects invalid role', () => {
      expect(validate(validProject({ role: 'freelance' }))).toBe(false);
    });

    it('rejects invalid origin', () => {
      expect(validate(validProject({ origin: 'academic' }))).toBe(false);
    });
  });

  describe('id format', () => {
    it('rejects uppercase characters', () => {
      expect(validate(validProject({ id: 'My-Project' }))).toBe(false);
    });

    it('rejects spaces', () => {
      expect(validate(validProject({ id: 'my project' }))).toBe(false);
    });

    it('rejects trailing hyphen', () => {
      expect(validate(validProject({ id: 'my-project-' }))).toBe(false);
    });

    it('accepts kebab-case', () => {
      expect(validate(validProject({ id: 'my-cool-project' }))).toBe(true);
    });
  });

  describe('links format', () => {
    it('rejects malformed URIs', () => {
      expect(validate(validProject({ links: { repo: 'not-a-url' } }))).toBe(false);
    });

    it('accepts valid URIs', () => {
      expect(validate(validProject({ links: { repo: 'https://github.com/user/repo' } }))).toBe(true);
    });

    it('accepts null link values', () => {
      expect(validate(validProject({ links: { repo: null } }))).toBe(true);
    });
  });

  it('rejects additional properties', () => {
    expect(validate(validProject({ unknownField: 'value' }))).toBe(false);
  });
});
