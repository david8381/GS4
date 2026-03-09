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

test('parseEnhancive blocks handle Sajehn inventory enhancive outputs', () => {
  const listParsed = enhanciveImport.parseEnhanciveListBlock(`
You are not holding any enhancive items.

You are wearing the following enhancive items:
  a gilded locus
  a tin-bound ceramic badge

(Items: 2)

For more information, see INVENTORY ENHANCIVE TOTALS.
  `);
  assert.equal(listParsed.items.length, 2);
  assert.equal(listParsed.items[0].name, 'a gilded locus');
  assert.equal(listParsed.items[1].name, 'a tin-bound ceramic badge');

  const detailParsed = enhanciveImport.parseEnhanciveDetailsBlock(`
Stats:
  Agility (AGI): 4/40
    +4: an unknown source (needs loresong)


Resources:
  Max Mana: 1/600
    +1: an unknown source (needs loresong)


Statistics:
  Enhancive Items: 2
  Enhancive Properties: 2
  Total Enhancive Amount: 5

For fewer details, see INVENTORY ENHANCIVE TOTALS.
You are not currently accepting the benefit of any enhancive items in your inventory.
  `);

  assert.equal(detailParsed.items.length, 0);
  assert.equal(detailParsed.unresolved.length, 2);
  assert.equal(detailParsed.unresolved[0].target, 'Agility (AGI)');
  assert.equal(detailParsed.unresolved[0].value, 4);
  assert.equal(detailParsed.unresolved[1].target, 'Max Mana');
  assert.equal(detailParsed.unresolved[1].value, 1);
  assert.equal(detailParsed.summary.itemCount, 2);
  assert.equal(detailParsed.summary.propertyCount, 2);
  assert.equal(detailParsed.summary.totalAmount, 5);

  const merged = enhanciveImport.mergeImportedEnhanciveSnapshot(
    `
You are not holding any enhancive items.

You are wearing the following enhancive items:
  a gilded locus
  a tin-bound ceramic badge

(Items: 2)

For more information, see INVENTORY ENHANCIVE TOTALS.
    `,
    `
Stats:
  Agility (AGI):  4/40

Resources:
  Max Mana:   1/600

Statistics:
  Enhancive Items: 2
  Enhancive Properties: 2
  Total Enhancive Amount: 5

For more details, see INVENTORY ENHANCIVE TOTALS DETAILS.
You are not currently accepting the benefit of any enhancive items in your inventory.
    `,
    `
Stats:
  Agility (AGI): 4/40
    +4: an unknown source (needs loresong)


Resources:
  Max Mana: 1/600
    +1: an unknown source (needs loresong)


Statistics:
  Enhancive Items: 2
  Enhancive Properties: 2
  Total Enhancive Amount: 5

For fewer details, see INVENTORY ENHANCIVE TOTALS.
You are not currently accepting the benefit of any enhancive items in your inventory.
    `
  );

  assert.equal(merged.importedSnapshot.items.length, 2);
  assert.equal(merged.importedSnapshot.unresolved.length, 2);
  assert.equal(merged.enhancivesEnabled, false);
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

test('parseEnhanciveDetailsBlock keeps resource contributions for later normalization', () => {
  const parsed = enhanciveImport.parseEnhanciveDetailsBlock(`
Resources:
  Max Health: 6/600
    +6: a brass talisman
  Max Spirit: 1/20
    +1: an unknown source (needs loresong)
  Spirit Recovery: 2/50
    +2: a brass talisman
  `);

  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].name, 'a brass talisman');
  assert.equal(parsed.items[0].effects[0].target, 'Max Health');
  assert.equal(parsed.items[0].effects[1].target, 'Spirit Recovery');
  assert.equal(parsed.unresolved.length, 1);
  assert.equal(parsed.unresolved[0].target, 'Max Spirit');
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

test('mergeImportedEnhanciveSnapshot marks enhancives disabled when totals say benefits are off', () => {
  const merged = enhanciveImport.mergeImportedEnhanciveSnapshot(
    `
You are wearing the following enhancive items:
  a gilded locus

(Items: 1)
    `,
    `
Stats:
  Agility (AGI): 4/40
You are not currently accepting the benefit of any enhancive items in your inventory.
    `,
    `
Stats:
  Agility (AGI): 4/40
    +4: an unknown source (needs loresong)
You are not currently accepting the benefit of any enhancive items in your inventory.
    `
  );

  assert.equal(merged.enhancivesEnabled, false);
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

test('normalizeEnhanciveEquipmentState preserves linked imported item names on manual resolutions', () => {
  const normalized = enhanciveImport.normalizeEnhanciveEquipmentState({
    manualResolutions: {
      items: [{
        id: 'manual-1',
        name: 'a tin-bound ceramic badge',
        linkedImportedName: 'a tin-bound ceramic badge',
        effects: [{ type: 'stat', target: 'agi', label: 'Agility', value: 4 }],
      }],
      resolvedFromImported: ['import-unresolved-1'],
    },
  });

  assert.equal(normalized.manualResolutions.items.length, 1);
  assert.equal(normalized.manualResolutions.items[0].linkedImportedName, 'a tin-bound ceramic badge');
});
