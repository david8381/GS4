const test = require("node:test");
const assert = require("node:assert/strict");

const profileState = require("../profile-state.js");
const enhanciveImport = require("../enhancive-import.js");

function normalizeBadgeDefaults(value) {
  return value == null ? { boosts: [] } : value;
}

test("mergeImportedProfileState preserves manual enhancive resolutions when new imported snapshot exists", () => {
  const existing = {
    defaults: { badge: { boosts: ["agi"] }, gearWeight: 12 },
    equipment: {
      enhancives: {
        importedSnapshot: {
          items: [{ id: "old-import", name: "old item", effects: [] }],
          unresolved: [],
          summary: { itemCount: 1, propertyCount: 0, totalAmount: 0 },
        },
        manualResolutions: {
          items: [{ id: "manual-1", name: "resolved badge", effects: [{ type: "stat", target: "agi", value: 4 }] }],
          resolvedFromImported: ["old-unresolved"],
        },
      },
    },
    ascension: { points: 5 },
    enhancive: { legacy: true },
  };

  const record = {
    defaults: { gearWeight: 30 },
    equipment: {
      enhancives: {
        raw: { list: "new list", totals: "", totalsDetails: "" },
        importedSnapshot: {
          items: [{ id: "new-import", name: "new item", effects: [] }],
          unresolved: [{ id: "new-unresolved", target: "Agility", value: 4 }],
          summary: { itemCount: 1, propertyCount: 1, totalAmount: 4 },
        },
        manualResolutions: { items: [], resolvedFromImported: [] },
        enhancivesEnabled: false,
      },
    },
  };

  const merged = profileState.mergeImportedProfileState({
    existing,
    record,
    preserveUnsyncedFromExisting: true,
    normalizeBadgeDefaults,
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
  });

  assert.equal(merged.equipment.enhancives.importedSnapshot.items[0].id, "new-import");
  assert.equal(merged.equipment.enhancives.manualResolutions.items[0].id, "manual-1");
  assert.deepEqual(merged.defaults.badge, { boosts: ["agi"] });
  assert.deepEqual(merged.ascension, existing.ascension);
  assert.deepEqual(merged.enhancive, existing.enhancive);
  assert.equal(merged.equipment.enhancives.enhancivesEnabled, false);
});

test("mergeImportedProfileState keeps existing enhancive equipment when there is no imported input", () => {
  const existingEnhancives = enhanciveImport.normalizeEnhanciveEquipmentState({
    importedSnapshot: {
      items: [{ id: "existing-import", name: "existing item", effects: [] }],
      unresolved: [],
      summary: { itemCount: 1, propertyCount: 0, totalAmount: 0 },
    },
    manualResolutions: {
      items: [{ id: "manual-1", name: "manual item", effects: [] }],
      resolvedFromImported: [],
    },
  });

  const merged = profileState.mergeImportedProfileState({
    existing: {
      defaults: { badge: null },
      equipment: { enhancives: existingEnhancives },
    },
    record: {
      defaults: {},
      equipment: { enhancives: enhanciveImport.defaultEnhanciveEquipmentState() },
    },
    preserveUnsyncedFromExisting: true,
    normalizeBadgeDefaults,
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
  });

  assert.equal(merged.equipment.enhancives.importedSnapshot.items[0].id, "existing-import");
  assert.equal(merged.equipment.enhancives.manualResolutions.items[0].id, "manual-1");
});

test("mergeImportedProfileState uses incoming society even when key is null (user left society)", () => {
  const merged = profileState.mergeImportedProfileState({
    existing: {
      society: { key: "voln", rank: 14 },
      defaults: { badge: null },
      equipment: { enhancives: enhanciveImport.defaultEnhanciveEquipmentState() },
    },
    record: {
      society: { key: null, rank: 0 },
      defaults: {},
      equipment: { enhancives: enhanciveImport.defaultEnhanciveEquipmentState() },
    },
    preserveUnsyncedFromExisting: true,
    normalizeBadgeDefaults,
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
  });

  assert.deepEqual(merged.society, { key: null, rank: 0 });
});

test("rebuildImportedEnhanciveState preserves manual resolutions when requested", () => {
  const currentEnhanciveEquipment = enhanciveImport.normalizeEnhanciveEquipmentState({
    importedSnapshot: {
      items: [{ id: "old-import", name: "old item", effects: [] }],
      unresolved: [],
      summary: { itemCount: 1, propertyCount: 0, totalAmount: 0 },
    },
    manualResolutions: {
      items: [{ id: "manual-1", name: "manual item", effects: [] }],
      resolvedFromImported: [],
    },
  });

  const rebuilt = profileState.rebuildImportedEnhanciveState({
    currentEnhanciveEquipment,
    listText: "new list",
    totalsText: "",
    detailsText: "",
    preserveManual: true,
    importedAt: "2026-03-09T00:00:00Z",
    mergeImportedEnhanciveSnapshot: () => ({
      lastImportedAt: "2026-03-09T00:00:00Z",
      raw: { list: "new list", totals: "", totalsDetails: "" },
      importedSnapshot: {
        items: [{ id: "new-import", name: "new item", effects: [] }],
        unresolved: [],
        summary: { itemCount: 1, propertyCount: 0, totalAmount: 0 },
      },
      manualResolutions: { items: [], resolvedFromImported: [] },
      enhancivesEnabled: true,
    }),
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
  });

  assert.equal(rebuilt.importedSnapshot.items[0].id, "new-import");
  assert.equal(rebuilt.manualResolutions.items[0].id, "manual-1");
  assert.equal(rebuilt.lastImportedAt, "2026-03-09T00:00:00Z");
});

test("comparableProfile preserves society favor data", () => {
  const comparable = profileState.comparableProfile({
    record: {
      name: "Sajehn",
      race: "Dark Elf",
      profession: "Sorcerer",
      society: {
        key: "voln",
        rank: 12,
        favor: {
          current: 38027907,
          atLastStepChange: 37500000,
          history: [{ step: 12, favor: 37500000, previousStep: 11, timestamp: "2026-03-01T00:00:00Z" }],
          lastUpdated: "2026-03-13T01:02:03Z",
        },
      },
      level: 80,
      experience: 5504113,
      stats: { str: { base: 70, enhanced: 70 } },
      ascension: { stats: {}, skills: {} },
      enhancive: { stats: {}, skills: {} },
      equipment: { enhancives: enhanciveImport.defaultEnhanciveEquipmentState() },
      skills: [],
      defaults: { badge: null },
    },
    stats: [{ key: "str" }],
    mergeSkillsWithCatalog(skills) { return skills; },
    skillKey(name) { return String(name || "").toLowerCase(); },
    normalizeSkillEntry(skill) { return { name: skill?.name || "", ranks: Number(skill?.ranks) || 0 }; },
    skillBonusFromRanks(ranks) { return Number(ranks) || 0; },
    normalizeBadgeDefaults,
    normalizeEnhanciveEquipmentState: enhanciveImport.normalizeEnhanciveEquipmentState,
    normalizeAscensionAbilities(entries) { return entries || []; },
    clamp(value, min, max) { return Math.min(Math.max(Number(value) || 0, min), max); },
    experienceForLevel(level) { return Number(level) || 0; },
  });

  assert.deepEqual(comparable.society, {
    key: "voln",
    rank: 12,
    favor: {
      current: 38027907,
      atLastStepChange: 37500000,
      history: [{ step: 12, favor: 37500000, previousStep: 11, timestamp: "2026-03-01T00:00:00Z" }],
      lastUpdated: "2026-03-13T01:02:03Z",
    },
  });
});
