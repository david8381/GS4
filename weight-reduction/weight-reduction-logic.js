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

  // currentWRPct must be a multiple of 20 in [0, 80].
  // Returns an array of 6 entries, one per WR_LEVEL (0,20,40,60,80,100).
  // Each entry: { wrPct, cumulativeCost, isReached, hasExtrapolated }
  function getCostCurve(container, currentWRPct) {
    const WR_LEVELS = [0, 20, 40, 60, 80, 100];
    const currentTier = Math.round(currentWRPct / 20); // 0-4
    let runningCost = 0;
    return WR_LEVELS.map((wrPct, i) => {
      const tierIndex = i - 1; // tier needed to reach this level (tier 0 = 1-20%)
      if (i === 0) {
        return { wrPct: 0, cumulativeCost: 0, isReached: true, hasExtrapolated: false };
      }
      const tierIdx = i - 1;
      if (tierIdx < currentTier) {
        // Already purchased — cost to user is 0 (already paid), show 0 delta
        return { wrPct, cumulativeCost: 0, isReached: true, hasExtrapolated: container.extrapolated[tierIdx] };
      }
      runningCost += container.tierCosts[tierIdx];
      return {
        wrPct,
        cumulativeCost: runningCost,
        isReached: false,
        hasExtrapolated: container.extrapolated[tierIdx],
      };
    });
  }

  // Weight saved (lbs) at a given WR% vs 0% WR, given container capacity and fill fraction.
  // fillPct: 0-100 (typical % of capacity that is filled)
  function getWeightSavedCurve(capacity, fillPct) {
    const WR_LEVELS = [0, 20, 40, 60, 80, 100];
    const typicalWeight = capacity * (fillPct / 100);
    return WR_LEVELS.map((wrPct) => ({
      wrPct,
      weightSaved: typicalWeight * (wrPct / 100),
    }));
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
