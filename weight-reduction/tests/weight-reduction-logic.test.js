const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const logic = require("../weight-reduction-logic.js");

const containers = [
  {
    capacity: 100,
    tierCosts: [850, 1701, 5102, 20403, 102004],
    extrapolated: [false, false, false, false, false],
  },
  {
    capacity: 200,
    tierCosts: [1275, 2551, 7653, 30604, 153005],
    extrapolated: [false, false, false, false, false],
  },
];

describe("getContainer", () => {
  it("finds by capacity", () => {
    const c = logic.getContainer(containers, 100);
    assert.equal(c.capacity, 100);
  });
  it("returns null for unknown capacity", () => {
    assert.equal(logic.getContainer(containers, 999), null);
  });
});

describe("getCostCurve", () => {
  it("at 0% current WR, cumulative costs build from tier 1", () => {
    const c = logic.getContainer(containers, 100);
    const curve = logic.getCostCurve(c, 0);
    assert.equal(curve[0].cumulativeCost, 0);     // 0% WR
    assert.equal(curve[1].cumulativeCost, 850);   // 20% WR: T1
    assert.equal(curve[2].cumulativeCost, 2551);  // 40% WR: T1+T2
    assert.equal(curve[3].cumulativeCost, 7653);  // 60% WR: T1+T2+T3
    assert.equal(curve[4].cumulativeCost, 28056); // 80% WR: T1+T2+T3+T4
    assert.equal(curve[5].cumulativeCost, 130060);// 100% WR: all 5 tiers
  });

  it("at 40% current WR, already-bought tiers show 0 cost", () => {
    const c = logic.getContainer(containers, 100);
    const curve = logic.getCostCurve(c, 40);
    assert.equal(curve[0].cumulativeCost, 0);  // 0% (already past)
    assert.equal(curve[1].cumulativeCost, 0);  // 20% (already past)
    assert.equal(curve[2].cumulativeCost, 0);  // 40% (already there)
    assert.equal(curve[3].cumulativeCost, 5102);   // 60% WR: T3
    assert.equal(curve[4].cumulativeCost, 25505);  // 80% WR: T3+T4
    assert.equal(curve[5].cumulativeCost, 127509); // 100% WR: T3+T4+T5
  });

  it("marks tiers as isReached correctly", () => {
    const c = logic.getContainer(containers, 100);
    const curve = logic.getCostCurve(c, 40);
    assert.equal(curve[0].isReached, true);
    assert.equal(curve[1].isReached, true);
    assert.equal(curve[2].isReached, true);
    assert.equal(curve[3].isReached, false);
    assert.equal(curve[4].isReached, false);
  });
});

describe("getWeightSavedCurve", () => {
  it("at 0% fill, always saves 0 lbs", () => {
    const curve = logic.getWeightSavedCurve(100, 0);
    curve.forEach((pt) => assert.equal(pt.weightSaved, 0));
  });

  it("at 100% fill, 100lb container: saves capacity × WR%", () => {
    const curve = logic.getWeightSavedCurve(100, 100);
    assert.equal(curve[0].weightSaved, 0);
    assert.equal(curve[1].weightSaved, 20);
    assert.equal(curve[3].weightSaved, 60);
    assert.equal(curve[5].weightSaved, 100);
  });

  it("at 50% fill, 200lb container: saves half × WR%", () => {
    const curve = logic.getWeightSavedCurve(200, 50);
    assert.equal(curve[5].weightSaved, 100); // 200 * 0.5 * 1.0
    assert.equal(curve[3].weightSaved, 60);  // 200 * 0.5 * 0.6
  });
});

describe("computeCarryCapacity", () => {
  it("Human with str=80, con=60 gives expected body weight", () => {
    const human = { baseWeight: 90, weightFactor: 0.9, maxWeight: 270, encFactor: 1.0 };
    const result = logic.computeCarryCapacity(human, 80, 60, 0);
    // strEven=80, conEven=60, bodyWeight = 90 + (80+60)*0.9 = 90 + 126 = 216
    assert.equal(result.bodyWeight, 216);
  });

  it("body weight capped at race max", () => {
    const human = { baseWeight: 90, weightFactor: 0.9, maxWeight: 270, encFactor: 1.0 };
    const result = logic.computeCarryCapacity(human, 200, 200, 0);
    assert.equal(result.bodyWeight, 270);
  });
});

describe("encumbranceLabel", () => {
  it("returns None at 0", () => assert.equal(logic.encumbranceLabel(0), "None"));
  it("returns 0–10% at 5", () => assert.equal(logic.encumbranceLabel(5), "0–10%"));
  it("returns 100%+ above 100", () => assert.equal(logic.encumbranceLabel(110), "100%+"));
});
