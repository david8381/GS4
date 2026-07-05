const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../badge-logic.js');

const boost = (id, value) => ({ id, value });
const noBoosts = [boost(0, 0), boost(0, 0), boost(0, 0)];

test('slotCount unlocks by concentration, not raw total', () => {
  // Baseline: no upgrades -> no slots; any single upgrade -> 1 slot.
  assert.equal(logic.slotCount([0, 0, 0, 0, 0]), 0);
  assert.equal(logic.slotCount([1, 0, 0, 0, 0]), 1);

  // 2nd enhancement: 10 upgrades within the top 2 components.
  assert.equal(logic.slotCount([5, 5, 0, 0, 0]), 2); // cheapest path (300k)
  assert.equal(logic.slotCount([10, 0, 0, 0, 0]), 2);
  assert.equal(logic.slotCount([7, 3, 0, 0, 0]), 2);
  assert.equal(logic.slotCount([9, 0, 0, 0, 0]), 1); // top2 = 9 < 10

  // 3rd enhancement: 20 upgrades within the top 3 components.
  assert.equal(logic.slotCount([7, 7, 6, 0, 0]), 3); // cheapest path (770k)
  assert.equal(logic.slotCount([8, 7, 5, 0, 0]), 3);
  assert.equal(logic.slotCount([10, 10, 10, 10, 10]), 3); // top3 = 30

  // The bug this replaces: spread builds must NOT over-report slots.
  assert.equal(logic.slotCount([3, 3, 3, 3, 3]), 1); // total 15, top2 = 6
  assert.equal(logic.slotCount([4, 4, 4, 4, 4]), 1); // total 20, top3 = 12
  assert.equal(logic.slotCount([5, 5, 5, 5, 0]), 2); // total 20, top3 = 15 (< 20)
});

test('slotAdvice reports the gap to the next slot', () => {
  assert.deepEqual(logic.slotAdvice([0, 0, 0, 0, 0]), { nextSlot: 2, withinTop: 2, needed: 10 });
  assert.deepEqual(logic.slotAdvice([4, 4, 4, 4, 4]), { nextSlot: 2, withinTop: 2, needed: 2 });
  assert.deepEqual(logic.slotAdvice([5, 5, 0, 0, 0]), { nextSlot: 3, withinTop: 3, needed: 10 });
  assert.deepEqual(logic.slotAdvice([8, 7, 4, 0, 0]), { nextSlot: 3, withinTop: 3, needed: 1 });
  assert.equal(logic.slotAdvice([7, 7, 6, 0, 0]), null); // all 3 unlocked
});

test('upgrade cost formula matches GSWiki milestones', () => {
  assert.equal(logic.upgradeCostForLevel(1), 10000); // first upgrade
  assert.equal(logic.upgradeCostForLevel(2), 30000); // 10k + 20k
  assert.equal(logic.upgradeCostForLevel(3), 60000);
  assert.equal(logic.nextUpgradeCost(0), 10000);
  assert.equal(logic.nextUpgradeCost(1), 20000);
  assert.equal(logic.nextUpgradeCost(10), 0); // capped

  assert.equal(logic.upgradeCostForComponents([5, 5, 0, 0, 0]), 300000); // 2nd-slot path
  assert.equal(logic.upgradeCostForComponents([7, 7, 6, 0, 0]), 770000); // 3rd-slot path
  assert.equal(logic.upgradeCostForComponents([10, 10, 10, 10, 10]), 2750000); // maxed
});

test('recharge cost tables reproduce the Cost Spreadsheet', () => {
  const byId = logic.boostById;
  const costFor = (id, value) => logic.triangularCost(byId.get(id).unit, value);

  // Strength (BOOST 1, unit 320): 320, 960, 1920, 3200, 4800, ... 17600
  assert.deepEqual(
    [1, 2, 3, 4, 5, 10].map((v) => costFor(1, v)),
    [320, 960, 1920, 3200, 4800, 17600]
  );
  // Constitution (BOOST 2, unit 240): 240, 720, 1440, 2400, 3600, 13200
  assert.deepEqual(
    [1, 2, 3, 4, 5, 10].map((v) => costFor(2, v)),
    [240, 720, 1440, 2400, 3600, 13200]
  );
  // Armor Use Ranks (BOOST 29, unit 4000, max 5): 4000, 12000, 24000, 40000, 60000
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((v) => costFor(29, v)),
    [4000, 12000, 24000, 40000, 60000]
  );
  // Mana Recovery (BOOST 22, unit 800): 800, 2400, 4800, 8000, 12000
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((v) => costFor(22, v)),
    [800, 2400, 4800, 8000, 12000]
  );
});

test('boost definitions cover all 119 enhancements with expected caps', () => {
  assert.equal(logic.boostDefs.length, 119);
  assert.equal(logic.boostById.get(40).max, 4); // MOC capped at 4
  assert.equal(logic.boostById.get(27).max, 2); // Spirit Recovery capped at 2
  assert.equal(logic.boostById.get(11).max, 5); // stat bonus capped at 5
});

test('evaluateTestState validates full badge configurations', () => {
  // T1 fresh badge valid
  assert.deepEqual(
    logic.evaluateTestState({ lifetimeBp: 300000, components: [0, 0, 0, 0, 0], boosts: noBoosts }),
    {
      upgrade: 0,
      upgradeValid: true,
      slotsUnlocked: 0,
      slotsUsed: 0,
      recharge: 0,
      power: 0,
      enhValid: true,
    }
  );

  // T2 component overspend invalid
  const t2 = logic.evaluateTestState({ lifetimeBp: 50000, components: [3, 0, 0, 0, 0], boosts: noBoosts });
  assert.equal(t2.upgrade, 60000);
  assert.equal(t2.upgradeValid, false);

  // T3 second slot unlocked and used validly
  const t3 = logic.evaluateTestState({
    lifetimeBp: 9999999,
    components: [5, 5, 0, 0, 0],
    boosts: [boost(1, 1), boost(22, 1), boost(0, 0)],
  });
  assert.equal(t3.slotsUnlocked, 2);
  assert.equal(t3.enhValid, true);

  // T4 third boost invalid when only two slots unlocked
  const t4 = logic.evaluateTestState({
    lifetimeBp: 9999999,
    components: [5, 5, 0, 0, 0],
    boosts: [boost(1, 1), boost(22, 1), boost(87, 1)],
  });
  assert.equal(t4.slotsUnlocked, 2);
  assert.equal(t4.enhValid, false);

  // T5 high-cost boost invalid at low upgrades (not enough power)
  const t5 = logic.evaluateTestState({
    lifetimeBp: 9999999,
    components: [1, 0, 0, 0, 0],
    boosts: [boost(29, 5), boost(0, 0), boost(0, 0)],
  });
  assert.equal(t5.power, 1200);
  assert.equal(t5.enhValid, false);

  // T6 valid at higher upgrades
  const t6 = logic.evaluateTestState({
    lifetimeBp: 9999999,
    components: [10, 10, 0, 0, 0],
    boosts: [boost(29, 2), boost(22, 2), boost(0, 0)],
  });
  assert.equal(t6.slotsUnlocked, 3);
  assert.equal(t6.enhValid, true);

  // T7 concentrated max build unlocks three slots
  const t7 = logic.evaluateTestState({
    lifetimeBp: 9999999,
    components: [10, 10, 10, 10, 10],
    boosts: [boost(1, 1), boost(22, 1), boost(87, 1)],
  });
  assert.equal(t7.slotsUnlocked, 3);
  assert.equal(t7.enhValid, true);

  // T8 (regression) spread build reports only ONE slot -> 2nd boost invalid
  const t8 = logic.evaluateTestState({
    lifetimeBp: 9999999,
    components: [4, 4, 4, 4, 4],
    boosts: [boost(1, 1), boost(22, 1), boost(0, 0)],
  });
  assert.equal(t8.slotsUnlocked, 1);
  assert.equal(t8.enhValid, false);
});
