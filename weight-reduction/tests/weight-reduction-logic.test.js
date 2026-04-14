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
  it("returns 101 points (0–100%)", () => {
    const c = logic.getContainer(containers, 100);
    const curve = logic.getCostCurve(c, 0);
    assert.equal(curve.length, 101);
    assert.equal(curve[0].wrPct, 0);
    assert.equal(curve[100].wrPct, 100);
  });

  it("at 0% current WR, per-1% costs accumulate correctly", () => {
    const c = logic.getContainer(containers, 100);
    const curve = logic.getCostCurve(c, 0);
    assert.equal(curve[0].cumulativeCost, 0);        // 0% WR
    assert.equal(curve[1].cumulativeCost, 850);      // 1% into tier 1
    assert.equal(curve[20].cumulativeCost, 17000);   // 20×850
    assert.equal(curve[21].cumulativeCost, 18701);   // 17000+1701
    assert.equal(curve[40].cumulativeCost, 51020);   // 17000+20×1701
    assert.equal(curve[60].cumulativeCost, 153060);  // +20×5102
    assert.equal(curve[80].cumulativeCost, 561120);  // +20×20403
    assert.equal(curve[100].cumulativeCost, 2601200);// +20×102004
  });

  it("at 40% current WR, already-bought % show 0 cost", () => {
    const c = logic.getContainer(containers, 100);
    const curve = logic.getCostCurve(c, 40);
    assert.equal(curve[0].cumulativeCost, 0);        // already reached
    assert.equal(curve[40].cumulativeCost, 0);       // already reached
    assert.equal(curve[41].cumulativeCost, 5102);    // first unbought 1%
    assert.equal(curve[60].cumulativeCost, 102040);  // 20×5102
    assert.equal(curve[80].cumulativeCost, 510100);  // +20×20403
    assert.equal(curve[100].cumulativeCost, 2550180);// +20×102004
  });

  it("marks isReached correctly", () => {
    const c = logic.getContainer(containers, 100);
    const curve = logic.getCostCurve(c, 40);
    assert.equal(curve[0].isReached, true);
    assert.equal(curve[40].isReached, true);
    assert.equal(curve[41].isReached, false);
    assert.equal(curve[100].isReached, false);
  });
});

describe("getWeightSavedCurve", () => {
  it("returns 101 points", () => {
    assert.equal(logic.getWeightSavedCurve(100, 50).length, 101);
  });

  it("at 0% fill, always saves 0 lbs", () => {
    const curve = logic.getWeightSavedCurve(100, 0);
    curve.forEach((pt) => assert.equal(pt.weightSaved, 0));
  });

  it("at 100% fill, 100lb container: saves capacity × WR%", () => {
    const curve = logic.getWeightSavedCurve(100, 100);
    assert.equal(curve[0].weightSaved, 0);
    assert.equal(curve[20].weightSaved, 20);
    assert.equal(curve[60].weightSaved, 60);
    assert.equal(curve[100].weightSaved, 100);
  });

  it("at 50% fill, 200lb container: saves half × WR%", () => {
    const curve = logic.getWeightSavedCurve(200, 50);
    assert.equal(curve[100].weightSaved, 100); // 200 * 0.5 * 1.0
    assert.equal(curve[60].weightSaved, 60);   // 200 * 0.5 * 0.6
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
