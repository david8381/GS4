(function (root) {
  const defaultCreationConstraints = {
    minStat: 20,
    maxStat: 100,
    totalPoints: 640,
    maxStatsAbove70: 4,
    maxStatsAbove90: 1,
  };

  const solverDefaults = {
    mode: "constraint_free_auto",
    maxSeconds: 3,
    fastRestarts: 12,
    fastIterations: 2500,
  };

  const objectivePresets = {
    tp_max: {
      id: "tp_max",
      label: "Maximize PTP then MTP then Overall Stats",
      priorities: ["ptp", "mtp", "overall"],
    },
    mtp_max: {
      id: "mtp_max",
      label: "Maximize MTP then PTP then Overall Stats",
      priorities: ["mtp", "ptp", "overall"],
    },
    stats_max: {
      id: "stats_max",
      label: "Maximize Overall Stats then PTP then MTP",
      priorities: ["overall", "ptp", "mtp"],
    },
    balanced: {
      id: "balanced",
      label: "Balanced (PTP + MTP + Overall)",
      priorities: ["balanced", "ptp", "mtp", "overall"],
    },
  };

  root.STAT_OPTIMIZER_DATA = {
    defaultCreationConstraints,
    solverDefaults,
    objectivePresets,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
