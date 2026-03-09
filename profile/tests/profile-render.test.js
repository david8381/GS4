const test = require('node:test');
const assert = require('node:assert/strict');

const profileRender = require('../profile-render.js');

test('getStandaloneManualResolutionItems excludes linked imported-item resolutions', () => {
  const items = [
    {
      id: 'manual-1',
      name: 'a tin-bound ceramic badge',
      linkedImportedName: 'a tin-bound ceramic badge',
      effects: [{ type: 'stat', target: 'agi', label: 'Agility', value: 4 }],
    },
    {
      id: 'manual-2',
      name: 'Manual Enhancive',
      linkedImportedName: '',
      effects: [{ type: 'resource', target: 'max_mana', label: 'Max Mana', value: 1 }],
    },
  ];

  const result = profileRender.getStandaloneManualResolutionItems(items);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'manual-2');
});
