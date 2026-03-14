const test = require("node:test");
const assert = require("node:assert/strict");

const profileGstools = require("../profile-gstools.js");

test("buildSocietyFavorOverride returns null for non-voln tracking", () => {
  assert.equal(profileGstools.buildSocietyFavorOverride(null), null);
  assert.equal(profileGstools.buildSocietyFavorOverride({ society: "col", step: 12, favor: 1000 }), null);
});

test("buildSocietyFavorOverride derives favor payload from voln tracking history", () => {
  const result = profileGstools.buildSocietyFavorOverride({
    society: "voln",
    step: 14,
    favor: 38027907,
    lastUpdated: "2026-03-13T01:02:03Z",
    history: [
      { step: 12, favor: 37000000, previousStep: 11, timestamp: "2026-02-01T00:00:00Z" },
      { step: 14, favor: 37500000, previousStep: 13, timestamp: "2026-03-01T00:00:00Z" },
    ],
  });

  assert.deepEqual(result, {
    current: 38027907,
    atLastStepChange: 37500000,
    history: [
      { step: 12, favor: 37000000, previousStep: 11, timestamp: "2026-02-01T00:00:00Z" },
      { step: 14, favor: 37500000, previousStep: 13, timestamp: "2026-03-01T00:00:00Z" },
    ],
    lastUpdated: "2026-03-13T01:02:03Z",
  });
});

test("buildSocietyFavorOverride falls back to current favor when current step has no history entry", () => {
  const result = profileGstools.buildSocietyFavorOverride({
    society: "voln",
    step: 12,
    favor: 123456,
    lastUpdated: "2026-03-13T01:02:03Z",
    history: [],
  });

  assert.equal(result.current, 123456);
  assert.equal(result.atLastStepChange, 123456);
});

test("buildSocietyFavorOverride prefers explicit atLastStepChange override when present", () => {
  const result = profileGstools.buildSocietyFavorOverride({
    society: "voln",
    step: 12,
    favor: 123456,
    atLastStepChange: 100000,
    history: [{ step: 12, favor: 90000, previousStep: 11, timestamp: "2026-03-01T00:00:00Z" }],
  });

  assert.equal(result.current, 123456);
  assert.equal(result.atLastStepChange, 100000);
});

test("buildSocietyFavorOverride returns null when favor is missing", () => {
  const result = profileGstools.buildSocietyFavorOverride({
    society: "voln",
    step: 12,
    favor: null,
    history: [{ step: 12, favor: 1000, previousStep: 11, timestamp: "2026-03-01T00:00:00Z" }],
  });

  assert.equal(result, null);
});
