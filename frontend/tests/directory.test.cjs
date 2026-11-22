const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let model;
before(async () => { model = await import('../../public/js/directory-model.mjs'); });

test('preview covers twelve unique resources across all four categories', () => {
  const { resources, categories } = model;
  assert.equal(resources.length, 12);
  assert.equal(new Set(resources.map(resource => resource.id)).size, 12);
  for (const category of categories) assert.equal(resources.filter(resource => resource.category === category.id).length, 3);
  for (const resource of resources) {
    assert.ok(resource.building && resource.description && resource.capacity && resource.features.length);
    assert.equal(resource.condition, 'Unknown');
    assert.equal(typeof resource.active, 'boolean');
    assert.ok(fs.existsSync(path.join(__dirname, '../../public/assets', `${resource.art}.svg`)));
  }
});

test('search composes with category and matches case-insensitive names and locations', () => {
  const result = model.filterResources(model.resources, { query: ' LIBRARY ', category: 'study' });
  assert.deepEqual(result.map(resource => resource.id), ['library-quiet', 'reading-room']);
  assert.equal(model.filterResources(model.resources, { query: 'library', category: 'labs' }).length, 0);
});

test('multi-word search and feature search work', () => {
  assert.deepEqual(model.filterResources(model.resources, { query: 'engineering computing' }).map(resource => resource.id), ['computing-lab']);
  assert.equal(model.filterResources(model.resources, { query: 'desktop workstations' }).length, 3);
  assert.equal(model.filterResources(model.resources, { query: '  ' }).length, 12);
  assert.equal(model.filterResources(model.resources, { query: '<script>' }).length, 0);
});

test('saved-only view composes with search and category filters', () => {
  const saved = ['library-quiet', 'computing-lab'];
  assert.equal(model.filterResources(model.resources, { savedOnly: true }, saved).length, 2);
  assert.equal(model.filterResources(model.resources, { savedOnly: true, category: 'study', query: 'quiet' }, saved).length, 1);
  assert.equal(model.filterResources(model.resources, { savedOnly: true }, []).length, 0);
});

test('sorting leaves source data unchanged', () => {
  const before = model.resources.map(resource => resource.id);
  const result = model.filterResources(model.resources, { sort: 'name' });
  assert.deepEqual(result.map(resource => resource.name), result.map(resource => resource.name).toSorted((a, b) => a.localeCompare(b)));
  assert.deepEqual(model.resources.map(resource => resource.id), before);
});

test('inactive resources are excluded from directory and preview suggestions', () => {
  const inactive = [{ ...model.resources[0], active: false }];
  assert.equal(model.filterResources(inactive, {}).length, 0);
  assert.equal(model.recommendResources(inactive, { category: 'study' }).length, 0);
});

test('recommendation preview matches category and building without assigning favorable scores to unknowns', () => {
  const result = model.recommendResources(model.resources, { category: 'labs', building: 'Engineering Building' });
  assert.deepEqual(result.map(resource => resource.id), ['computing-lab']);
  assert.equal(result[0].condition, 'Unknown');
  assert.equal(result[0].score, undefined);
  assert.equal(model.recommendResources(model.resources, { category: 'printers', building: 'Design Building' }).length, 0);
});

test('preference options are category-specific', () => {
  assert.ok(model.preferences.printers.includes('Working'));
  assert.ok(!model.preferences.food.includes('Working'));
  assert.ok(model.preferences.food.includes('Short wait'));
});

test('malformed URL filters fall back safely', () => {
  assert.deepEqual(model.normalizeFilters({ category: 'unknown', sort: '<script>', savedOnly: 'yes', query: '  hello  ' }), { category: 'all', sort: 'featured', savedOnly: false, query: 'hello' });
  assert.equal(model.normalizeFilters({ query: 'x'.repeat(1000) }).query.length, 200);
});

test('stored bookmarks reject corrupt, duplicate, unknown and non-string values', () => {
  for (const value of [null, 'invalid', '{}', 'null', '42']) assert.deepEqual(model.parseSaved(value), []);
  assert.deepEqual(model.parseSaved('["library-quiet","library-quiet","missing",null,1]'), ['library-quiet']);
});
