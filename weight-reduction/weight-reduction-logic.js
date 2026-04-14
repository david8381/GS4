(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WeightReductionLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  // Return the container entry for a given capacity, or null.
  function getContainer(containers, capacity) {
    return containers.find((c) => c.capacity === capacity) || null;
  }

  // Returns an array of 101 entries, one per integer WR% from 0 to 100.
  // tierCosts are per 1% — each 1% increment adds tierCosts[tierIdx] to cost.
  // Tier boundaries: 1-20 → idx 0, 21-40 → idx 1, 41-60 → idx 2, 61-80 → idx 3, 81-100 → idx 4.
  function getCostCurve(container, currentWRPct) {
    let runningCost = 0;
    const points = [];
    for (let t = 0; t <= 100; t++) {
      if (t === 0 || t <= currentWRPct) {
        points.push({ wrPct: t, cumulativeCost: 0, isReached: true, hasExtrapolated: false });
      } else {
        const tierIdx = Math.floor((t - 1) / 20); // 1-20→0, 21-40→1, …
        runningCost += container.tierCosts[tierIdx];
        points.push({
          wrPct: t,
          cumulativeCost: runningCost,
          isReached: false,
          hasExtrapolated: container.extrapolated[tierIdx],
        });
      }
    }
    return points;
  }

  // Returns 101 entries, one per integer WR% from 0 to 100.
  // fillPct: 0-100 (typical % of capacity that is filled)
  function getWeightSavedCurve(capacity, fillPct) {
    const typicalWeight = capacity * (fillPct / 100);
    const points = [];
    for (let t = 0; t <= 100; t++) {
      points.push({ wrPct: t, weightSaved: typicalWeight * (t / 100) });
    }
    return points;
  }

  // Effective weight of container contents at a given WR%.
  function effectiveContainerWeight(capacity, fillPct, wrPct) {
    const typicalWeight = capacity * (fillPct / 100);
    return typicalWeight * (1 - wrPct / 100);
  }

  // Encumbrance carry capacity given race/stats (mirrors encumbrance.js formulas).
  function computeCarryCapacity(race, strStat, conStat, pfBonus) {
    const MAX_STAT = 200;
    const str = Math.min(Math.max(Math.floor(strStat), 1), MAX_STAT);
    const con = Math.min(Math.max(Math.floor(conStat), 1), MAX_STAT);
    const strEven = str % 2 === 0 ? str : str - 1;
    const conEven = con % 2 === 0 ? con : con - 1;
    const bodyWeight = Math.min(
      race.baseWeight + (strEven + conEven) * race.weightFactor,
      race.maxWeight
    );
    const unenc = Math.trunc(
      (((str - 20) / 200) * bodyWeight + bodyWeight / 200) * 100
    ) / 100;
    const pfReduction = (pfBonus || 0) / 10;
    return { bodyWeight, unenc, pfReduction, adjustedCapacity: unenc };
  }

  // Encumbrance percent for a given carried weight and carry params.
  function computeEncumbrancePct(carriedWeight, bodyWeight, adjustedCapacity, pfReduction) {
    const rawEnc = Math.max(0, carriedWeight - adjustedCapacity);
    const enc = Math.max(0, rawEnc - pfReduction);
    return bodyWeight > 0 ? (enc / bodyWeight) * 100 : 0;
  }

  function encumbranceLabel(pct) {
    if (pct <= 0) return "None";
    if (pct <= 10) return "0–10%";
    if (pct <= 20) return "10–20%";
    if (pct <= 30) return "20–30%";
    if (pct <= 40) return "30–40%";
    if (pct <= 50) return "40–50%";
    if (pct <= 65) return "50–65%";
    if (pct <= 80) return "65–80%";
    if (pct <= 100) return "80–100%";
    return "100%+";
  }

  // Returns encumbrance impact curve at each WR tier, given other carried weight.
  // otherWeight: weight carried outside the container
  function getEncumbranceCurve(race, strStat, conStat, pfBonus, capacity, fillPct, otherWeight) {
    const WR_LEVELS = [0, 20, 40, 60, 80, 100];
    const { bodyWeight, adjustedCapacity, pfReduction } = computeCarryCapacity(race, strStat, conStat, pfBonus);
    return WR_LEVELS.map((wrPct) => {
      const containerWeight = effectiveContainerWeight(capacity, fillPct, wrPct);
      const totalCarried = (otherWeight || 0) + containerWeight;
      const encPct = computeEncumbrancePct(totalCarried, bodyWeight, adjustedCapacity, pfReduction);
      return { wrPct, encPct, encLabel: encumbranceLabel(encPct), totalCarried, bodyWeight };
    });
  }

  return {
    getContainer,
    getCostCurve,
    getWeightSavedCurve,
    effectiveContainerWeight,
    computeCarryCapacity,
    computeEncumbrancePct,
    encumbranceLabel,
    getEncumbranceCurve,
  };
});
