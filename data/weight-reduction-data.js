(function (root) {
  // Cost PER 1% of weight reduction within each tier, for each container capacity.
  // Tiers: [1-20%, 21-40%, 41-60%, 61-80%, 81-100%]
  // Full tier cost = tierCosts[i] × 20 (since each tier covers 20 percentage points).
  // Costs sourced from GemStone Wiki (Rumor Woods service).
  // Tier N costs N × Tier (N-1), so the escalation is factorial.
  // Missing wiki entries are extrapolated using that rule and flagged.
  const containers = [
    {
      capacity: 50,
      tierCosts: [425, 850, 2550, 10200, 51000],
      extrapolated: [false, true, true, true, true],
    },
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
    {
      capacity: 250,
      tierCosts: [1488, 2976, 8928, 35712, 178560],
      extrapolated: [false, false, false, true, true],
    },
    {
      capacity: 1000,
      tierCosts: [4676, 9353, 28061, 112244, 561120],
      extrapolated: [false, false, false, false, false],
    },
  ];

  // WR tiers: each covers a 20% range.
  // tierIndex 0 = 1-20%, tierIndex 4 = 81-100%.
  // WR level in 20% steps: 0, 20, 40, 60, 80, 100.
  const WR_STEP = 20;
  const WR_LEVELS = [0, 20, 40, 60, 80, 100];
  const TIER_COUNT = 5;

  root.WEIGHT_REDUCTION_DATA = { containers, WR_STEP, WR_LEVELS, TIER_COUNT };
})(typeof globalThis !== "undefined" ? globalThis : window);
