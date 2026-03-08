const test = require('node:test');
const assert = require('node:assert/strict');

const enhanciveImport = require('../enhancive-import.js');

test('parseEnhanciveListBlock extracts worn item names and count', () => {
  const parsed = enhanciveImport.parseEnhanciveListBlock(`
You are not holding any enhancive items.

You are wearing the following enhancive items:
  a gilded locus
  a tin-bound ceramic badge

(Items: 2)
  `);

  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[0].name, 'a gilded locus');
  assert.equal(parsed.items[1].name, 'a tin-bound ceramic badge');
  assert.equal(parsed.summary.itemCount, 2);
});

test('parseEnhanciveDetailsBlock separates unresolved and known-source contributions', () => {
  const parsed = enhanciveImport.parseEnhanciveDetailsBlock(`
Stats:
  Agility (AGI): 4/40
    +4: an unknown source (needs loresong)

Skills:
  Arcane Symbols: 3/50
    +3: a silver-ringed charm

Statistics:
  Enhancive Items: 2
  Enhancive Properties: 2
  Total Enhancive Amount: 7
  `);

  assert.equal(parsed.unresolved.length, 1);
  assert.equal(parsed.unresolved[0].target, 'Agility (AGI)');
  assert.equal(parsed.unresolved[0].value, 4);
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].name, 'a silver-ringed charm');
  assert.equal(parsed.items[0].effects[0].target, 'Arcane Symbols');
  assert.equal(parsed.summary.itemCount, 2);
  assert.equal(parsed.summary.propertyCount, 2);
  assert.equal(parsed.summary.totalAmount, 7);
});

test('mergeImportedEnhanciveSnapshot combines list items with known detail effects', () => {
  const merged = enhanciveImport.mergeImportedEnhanciveSnapshot(
    `
You are wearing the following enhancive items:
  a silver-ringed charm

(Items: 1)
    `,
    '',
    `
Skills:
  Arcane Symbols: 3/50
    +3: a silver-ringed charm
    `
  );

  assert.equal(merged.importedSnapshot.items.length, 1);
  assert.equal(merged.importedSnapshot.items[0].effects.length, 1);
  assert.equal(merged.importedSnapshot.summary.itemCount, 1);
});

test('normalizeEnhanciveEquipmentState defaults missing sections safely', () => {
  const normalized = enhanciveImport.normalizeEnhanciveEquipmentState({});
  assert.equal(normalized.enhancivesEnabled, true);
  assert.deepEqual(normalized.importedSnapshot.summary, {
    itemCount: 0,
    propertyCount: 0,
    totalAmount: 0,
  });
  assert.deepEqual(normalized.manualResolutions.items, []);
});
