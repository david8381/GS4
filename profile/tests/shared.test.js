const test = require("node:test");
const assert = require("node:assert/strict");

const { GS4Storage, GS4Util } = require("../../shared.js");

test("GS4Util.normalizeRaceForModifierLookup normalizes known aliases", () => {
  assert.equal(GS4Util.normalizeRaceForModifierLookup("darkelf"), "Dark Elf");
  assert.equal(GS4Util.normalizeRaceForModifierLookup("half krolvin"), "Half-Krolvin");
  assert.equal(GS4Util.normalizeRaceForModifierLookup("fgnome"), "Forest Gnome");
});

test("GS4Util.stateEquals compares serialized state snapshots", () => {
  assert.equal(GS4Util.stateEquals({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
  assert.equal(GS4Util.stateEquals({ a: 1 }, { a: 2 }), false);
});

test("GS4Storage round-trips profiles through localStorage", () => {
  const store = new Map();
  global.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };

  const profiles = [{ id: "p1", name: "Sajehn" }];
  GS4Storage.saveProfiles(profiles);

  assert.deepEqual(GS4Storage.loadProfiles(), profiles);
  assert.equal(GS4Storage.findProfile(profiles, "p1")?.name, "Sajehn");
  assert.equal(GS4Storage.findProfile(profiles, "Sajehn")?.id, "p1");

  delete global.localStorage;
});
