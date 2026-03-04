(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StatOptimizerLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STAT_KEYS = ["str", "con", "dex", "agi", "dis", "aur", "log", "int", "wis", "inf"];

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function toInt(value, fallback = 0) {
    const n = Math.trunc(Number(value));
    return Number.isFinite(n) ? n : fallback;
  }

  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeStartStats(startStats, minStat, maxStat) {
    const normalized = {};
    STAT_KEYS.forEach((key) => {
      normalized[key] = clamp(toInt(startStats?.[key], minStat), minStat, maxStat);
    });
    return normalized;
  }

  function sumStats(stats) {
    return STAT_KEYS.reduce((sum, key) => sum + toInt(stats?.[key], 0), 0);
  }

  function countAbove(stats, threshold) {
    let count = 0;
    STAT_KEYS.forEach((key) => {
      if (toInt(stats?.[key], 0) > threshold) count += 1;
    });
    return count;
  }

  function getPrimeStatKeys(data, profession) {
    const prime = data?.professionPrimeReqs?.[profession];
    if (!Array.isArray(prime)) return [];
    return prime.filter((key) => STAT_KEYS.includes(key));
  }

  function applyPrimeBonuses(startStats, primeKeys) {
    const level0Stats = { ...startStats };
    (primeKeys || []).forEach((key) => {
      level0Stats[key] = clamp(toInt(level0Stats[key], 0) + 10, 1, 100);
    });
    return level0Stats;
  }

  function validateStartStats(startStats, constraints) {
    const errors = [];
    const minStat = toInt(constraints?.minStat, 20);
    const maxStat = toInt(constraints?.maxStat, 100);
    const totalPoints = toInt(constraints?.totalPoints, 640);
    const maxAbove70 = toInt(constraints?.maxStatsAbove70, 4);
    const maxAbove90 = toInt(constraints?.maxStatsAbove90, 1);

    let sum = 0;
    let above70 = 0;
    let above90 = 0;

    STAT_KEYS.forEach((key) => {
      const value = toInt(startStats?.[key], minStat);
      sum += value;
      if (value < minStat || value > maxStat) {
        errors.push(`${key.toUpperCase()} must be between ${minStat} and ${maxStat}.`);
      }
      if (value > 70) above70 += 1;
      if (value > 90) above90 += 1;
    });

    if (sum !== totalPoints) errors.push(`Starting stats must sum to ${totalPoints}. Current sum is ${sum}.`);
    if (above70 > maxAbove70) errors.push(`No more than ${maxAbove70} starting stats can be above 70.`);
    if (above90 > maxAbove90) errors.push(`No more than ${maxAbove90} starting stat can be above 90.`);

    return {
      ok: errors.length === 0,
      errors,
      sum,
      above70,
      above90,
    };
  }

  function computeStatsFromLevel0(data, profileLogic, level0Stats, level, raceName, profession) {
    if (profileLogic?.computeStatsFromLevel0) {
      return profileLogic.computeStatsFromLevel0({
        stats: data?.stats,
        level0Stats,
        level,
        raceName,
        profession,
        baseGrowthRates: data?.baseGrowthRates,
        raceGrowthModifiers: data?.raceGrowthModifiers,
      });
    }

    // Fallback should match profile/profile-logic.js behavior.
    const computed = {};
    (data?.stats || []).forEach((stat) => {
      const key = stat.key;
      const base = data?.baseGrowthRates?.[profession]?.[key];
      const mod = data?.raceGrowthModifiers?.[raceName]?.[key] ?? 0;
      const rate = base == null ? null : base + mod;
      if (!rate || level0Stats?.[key] == null) return;
      let value = level0Stats[key];
      for (let lvl = 1; lvl <= level; lvl += 1) {
        const gi = Math.max(Math.trunc(value / rate), 1);
        if (lvl % gi === 0) value = Math.min(100, value + 1);
      }
      computed[key] = { base: value, enhanced: value };
    });
    return computed;
  }

  function levelFromExperience(levelThresholds, experience) {
    const exp = Math.max(0, toInt(experience, 0));
    const thresholds = Array.isArray(levelThresholds) ? levelThresholds : [];
    let level = 0;
    while (level + 1 < thresholds.length && exp >= thresholds[level + 1]) {
      level += 1;
    }
    return level;
  }

  function trainingPointsPerLevelForStats(statSnapshot, profession, professionPrimeReqs) {
    const primes = new Set(professionPrimeReqs?.[profession] || []);
    const weighted = (key) => {
      const value = clamp(toInt(statSnapshot?.[key], 50), 1, 100);
      return primes.has(key) ? value * 2 : value;
    };

    const str = weighted("str");
    const con = weighted("con");
    const dex = weighted("dex");
    const agi = weighted("agi");
    const aur = weighted("aur");
    const dis = weighted("dis");
    const log = weighted("log");
    const int = weighted("int");
    const wis = weighted("wis");
    const inf = weighted("inf");
    const hybrid = (aur + dis) / 2;

    const ptpPerLevel = Math.max(0, Math.floor((str + con + dex + agi + hybrid) / 20 + 25));
    const mtpPerLevel = Math.max(0, Math.floor((log + int + wis + inf + hybrid) / 20 + 25));
    return { ptpPerLevel, mtpPerLevel };
  }

  function estimateTotalTrainingPointsFromExperience(params) {
    const {
      data,
      profileLogic,
      experience,
      raceName,
      profession,
      level0Stats,
    } = params;

    const thresholds = data?.levelThresholds || [];
    const totalExp = Math.max(0, toInt(experience, 0));
    const capExp = Math.max(0, toInt(thresholds[100], 0));
    const expForLeveledGain = Math.min(totalExp, capExp);

    const statsAtLevelCache = new Map();
    function getStatsForLevel(level) {
      const key = Math.max(0, Math.min(100, toInt(level, 0)));
      if (!statsAtLevelCache.has(key)) {
        const computed = computeStatsFromLevel0(data, profileLogic, level0Stats, key, raceName, profession);
        const snapshot = {};
        STAT_KEYS.forEach((k) => {
          snapshot[k] = toInt(computed?.[k]?.base, level0Stats?.[k]);
        });
        statsAtLevelCache.set(key, snapshot);
      }
      return statsAtLevelCache.get(key);
    }

    let totalPtp = 0;
    let totalMtp = 0;

    const level0Gain = trainingPointsPerLevelForStats(getStatsForLevel(0), profession, data?.professionPrimeReqs);
    totalPtp += level0Gain.ptpPerLevel;
    totalMtp += level0Gain.mtpPerLevel;

    for (let level = 0; level < 100; level += 1) {
      const start = toInt(thresholds[level], 0);
      const end = toInt(thresholds[level + 1], start);
      if (expForLeveledGain <= start) break;
      const gained = Math.min(expForLeveledGain, end) - start;
      if (gained <= 0) continue;
      const interval = Math.max(1, end - start);
      const perLevel = trainingPointsPerLevelForStats(getStatsForLevel(level + 1), profession, data?.professionPrimeReqs);

      if (gained >= interval) {
        totalPtp += perLevel.ptpPerLevel;
        totalMtp += perLevel.mtpPerLevel;
      } else {
        totalPtp += Math.floor((gained * perLevel.ptpPerLevel) / interval);
        totalMtp += Math.floor((gained * perLevel.mtpPerLevel) / interval);
        break;
      }
    }

    if (totalExp > capExp) {
      const postCapChunks = Math.floor((totalExp - capExp) / 2500);
      totalPtp += postCapChunks;
      totalMtp += postCapChunks;
    }

    return {
      ptp: Math.max(0, toInt(totalPtp, 0)),
      mtp: Math.max(0, toInt(totalMtp, 0)),
    };
  }

  function deriveExperienceTarget(data, targetLevel, targetExperience) {
    const explicit = toInt(targetExperience, -1);
    if (explicit >= 0) return explicit;
    const lvl = clamp(toInt(targetLevel, 0), 0, 100);
    return toInt(data?.levelThresholds?.[lvl], 0);
  }

  function computeFinalStatSummary(computedStats) {
    const summary = {};
    let total = 0;
    STAT_KEYS.forEach((key) => {
      const value = toInt(computedStats?.[key]?.base, 0);
      summary[key] = value;
      total += value;
    });
    summary.total = total;
    return summary;
  }

  function compareVectors(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      const av = toInt(a[i], 0);
      const bv = toInt(b[i], 0);
      if (av > bv) return 1;
      if (av < bv) return -1;
    }
    return 0;
  }

  function objectiveVector(metrics, objectivePreset) {
    const priorities = objectivePreset?.priorities || ["ptp", "mtp", "overall"];
    const vector = [];
    priorities.forEach((priority) => {
      if (priority === "ptp") vector.push(toInt(metrics?.ptp, 0));
      else if (priority === "mtp") vector.push(toInt(metrics?.mtp, 0));
      else if (priority === "overall") vector.push(toInt(metrics?.overall, 0));
      else if (priority === "balanced") vector.push(toInt(metrics?.ptp, 0) + toInt(metrics?.mtp, 0) + toInt(metrics?.overall, 0));
      else if (priority === "tp_blend") {
        const ptpWeight = Number.isFinite(objectivePreset?.ptpWeight) ? objectivePreset.ptpWeight : 0.5;
        const mtpWeight = Number.isFinite(objectivePreset?.mtpWeight) ? objectivePreset.mtpWeight : 0.5;
        vector.push(Math.round(toInt(metrics?.ptp, 0) * ptpWeight + toInt(metrics?.mtp, 0) * mtpWeight));
      }
    });
    return vector;
  }

  function minimumDeficit(metrics, minimums) {
    if (!minimums) return 0;
    let deficit = 0;
    const minFinalStats = minimums.minFinalStats || {};
    const minStartStats = minimums.minStartStats || {};
    const maxStartStats = minimums.maxStartStats || {};
    for (const key of STAT_KEYS) {
      deficit += Math.max(0, toInt(minFinalStats[key], 0) - toInt(metrics?.finalStats?.[key], 0));
      deficit += Math.max(0, toInt(minStartStats[key], 0) - toInt(metrics?.level0Stats?.[key], 0));
      const maxValue = toInt(maxStartStats[key], 0);
      if (maxValue > 0) {
        deficit += Math.max(0, toInt(metrics?.level0Stats?.[key], 0) - maxValue);
      }
    }
    return deficit;
  }

  function scoreVector(metrics, minimums, objectivePreset) {
    const deficit = minimumDeficit(metrics, minimums);
    const meetsMinimums = deficit === 0;
    return [meetsMinimums ? 1 : 0, -deficit, ...objectiveVector(metrics, objectivePreset)];
  }

  function hasAnyMinimums(minimums) {
    if (!minimums) return false;
    const minFinalStats = minimums.minFinalStats || {};
    const minStartStats = minimums.minStartStats || {};
    const maxStartStats = minimums.maxStartStats || {};
    return STAT_KEYS.some((key) =>
      toInt(minFinalStats[key], 0) > 0 ||
      toInt(minStartStats[key], 0) > 0 ||
      toInt(maxStartStats[key], 0) > 0
    );
  }

  function satisfiesMinimums(metrics, minimums) {
    if (!minimums) return true;
    const minFinalStats = minimums.minFinalStats || {};
    const minStartStats = minimums.minStartStats || {};
    const maxStartStats = minimums.maxStartStats || {};
    for (const key of STAT_KEYS) {
      if (toInt(minFinalStats[key], 0) > toInt(metrics?.finalStats?.[key], 0)) return false;
      if (toInt(minStartStats[key], 0) > toInt(metrics?.level0Stats?.[key], 0)) return false;
      const maxValue = toInt(maxStartStats[key], 0);
      if (maxValue > 0 && toInt(metrics?.level0Stats?.[key], 0) > maxValue) return false;
    }
    return true;
  }

  function evaluateBuild(params) {
    const {
      data,
      profileLogic,
      startStats,
      constraints,
      raceName,
      profession,
      targetLevel,
      targetExperience,
      minimums,
      objectivePreset,
    } = params;

    const normalized = normalizeStartStats(startStats, constraints.minStat, constraints.maxStat);
    const validation = validateStartStats(normalized, constraints);
    if (!validation.ok) {
      return {
        ok: false,
        reason: validation.errors.join(" "),
        validation,
      };
    }

    const primeKeys = getPrimeStatKeys(data, profession);
    const level0Stats = applyPrimeBonuses(normalized, primeKeys);

    const effectiveTargetExp = deriveExperienceTarget(data, targetLevel, targetExperience);
    const effectiveLevel = levelFromExperience(data?.levelThresholds, effectiveTargetExp);
    const computedAtTarget = computeStatsFromLevel0(
      data,
      profileLogic,
      level0Stats,
      effectiveLevel,
      raceName,
      profession
    );
    const finalSummary = computeFinalStatSummary(computedAtTarget);

    const tpTotals = estimateTotalTrainingPointsFromExperience({
      data,
      profileLogic,
      experience: effectiveTargetExp,
      raceName,
      profession,
      level0Stats,
    });

    const metrics = {
      ptp: tpTotals.ptp,
      mtp: tpTotals.mtp,
      startPtp: trainingPointsPerLevelForStats(level0Stats, profession, data?.professionPrimeReqs).ptpPerLevel,
      startMtp: trainingPointsPerLevelForStats(level0Stats, profession, data?.professionPrimeReqs).mtpPerLevel,
      overall: finalSummary.total,
      finalStats: finalSummary,
      level0Stats,
      level: effectiveLevel,
      experience: effectiveTargetExp,
      primeKeys,
    };

    const meets = satisfiesMinimums(metrics, minimums);
    return {
      ok: true,
      validation,
      startStats: normalized,
      level0Stats,
      metrics,
      vector: scoreVector(metrics, minimums, objectivePreset),
      meetsMinimums: meets,
      reason: meets ? "" : "Build does not satisfy selected minima.",
    };
  }

  function canIncreaseStat(stats, key, constraints) {
    if (toInt(stats?.[key], 0) >= toInt(constraints.maxStat, 100)) return false;
    const next = { ...stats, [key]: toInt(stats?.[key], 0) + 1 };
    if (countAbove(next, 70) > toInt(constraints.maxStatsAbove70, 4)) return false;
    if (countAbove(next, 90) > toInt(constraints.maxStatsAbove90, 1)) return false;
    return true;
  }

  function canDecreaseStat(stats, key, constraints) {
    return toInt(stats?.[key], 0) > toInt(constraints.minStat, 20);
  }

  function growthRateByStat(data, raceName, profession) {
    const rates = {};
    let maxRate = 1;
    STAT_KEYS.forEach((key) => {
      const base = toInt(data?.baseGrowthRates?.[profession]?.[key], 0);
      const mod = toInt(data?.raceGrowthModifiers?.[raceName]?.[key], 0);
      const rate = Math.max(1, base + mod);
      rates[key] = rate;
      if (rate > maxRate) maxRate = rate;
    });
    rates._max = maxRate;
    return rates;
  }

  function statPriorityWeightMap(params) {
    const {
      data,
      raceName,
      profession,
      objectivePreset,
      minimums,
    } = params;

    const priorities = objectivePreset?.priorities || ["ptp", "mtp", "overall"];
    const primeKeys = new Set(getPrimeStatKeys(data, profession));
    const growth = growthRateByStat(data, raceName, profession);
    const weights = {};

    STAT_KEYS.forEach((key) => {
      let w = 1;
      const isPtpKey = ["str", "con", "dex", "agi", "aur", "dis"].includes(key);
      const isMtpKey = ["log", "int", "wis", "inf", "aur", "dis"].includes(key);
      const minFinal = toInt(minimums?.minFinalStats?.[key], 0);

      if (priorities.includes("ptp") && isPtpKey) w += 2.25;
      if (priorities.includes("mtp") && isMtpKey) w += 2.25;

      // Growth-aware heuristic: slower-growing stats receive higher start-priority
      // for overall optimization targets.
      if (priorities.includes("overall")) {
        const rate = growth[key];
        const normalizedSlow = (growth._max - rate) / Math.max(1, growth._max);
        w += 1 + normalizedSlow * 3;
      }

      if (priorities.includes("balanced") && (isPtpKey || isMtpKey)) w += 1.5;
      if (primeKeys.has(key)) w += 1.25;
      if (minFinal > 0) w += 2 + Math.min(4, minFinal / 25);

      weights[key] = w;
    });

    return weights;
  }

  function xorshift(seed) {
    let x = seed || 88675123;
    return function next() {
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  }

  function buildSeedStartStats(data, constraints, objectivePreset, seed, profession) {
    const rng = xorshift(seed);
    const stats = {};
    STAT_KEYS.forEach((key) => {
      stats[key] = toInt(constraints.minStat, 20);
    });

    let remaining = toInt(constraints.totalPoints, 640) - sumStats(stats);
    const priorityWeights = statPriorityWeightMap({
      data,
      raceName: constraints._raceName,
      profession,
      objectivePreset,
      minimums: constraints._minimums,
    });

    while (remaining > 0) {
      const candidates = STAT_KEYS.filter((key) => canIncreaseStat(stats, key, constraints));
      if (!candidates.length) break;
      const weighted = [];
      candidates.forEach((key) => {
        const repeats = Math.max(1, Math.floor(priorityWeights[key] * 3 + rng() * 2));
        for (let i = 0; i < repeats; i += 1) weighted.push(key);
      });
      const chosen = weighted[Math.floor(rng() * weighted.length)] || candidates[0];
      stats[chosen] += 1;
      remaining -= 1;
    }

    return stats;
  }

  function buildBoundedSeedStartStats(data, constraints, objectivePreset, seed, profession, minimums) {
    const primeKeys = new Set(getPrimeStatKeys(data, profession));
    const minStartStats = minimums?.minStartStats || {};
    const maxStartStats = minimums?.maxStartStats || {};
    const lower = {};
    const upper = {};
    const minStat = toInt(constraints.minStat, 20);
    const maxStat = toInt(constraints.maxStat, 100);

    for (const key of STAT_KEYS) {
      const shift = primeKeys.has(key) ? 10 : 0;
      const minL0 = toInt(minStartStats[key], 0);
      const maxL0 = toInt(maxStartStats[key], 0);
      let lo = minStat;
      let hi = maxStat;
      if (minL0 > 0) lo = Math.max(lo, minL0 - shift);
      if (maxL0 > 0) hi = Math.min(hi, maxL0 - shift);
      lo = clamp(lo, minStat, maxStat);
      hi = clamp(hi, minStat, maxStat);
      if (lo > hi) return null;
      lower[key] = lo;
      upper[key] = hi;
    }

    const priorityWeights = statPriorityWeightMap({
      data,
      raceName: constraints._raceName,
      profession,
      objectivePreset,
      minimums: constraints._minimums,
    });

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const rng = xorshift(seed + attempt * 1013);
      const stats = {};
      STAT_KEYS.forEach((key) => {
        stats[key] = lower[key];
      });

      if (countAbove(stats, 70) > toInt(constraints.maxStatsAbove70, 4)) continue;
      if (countAbove(stats, 90) > toInt(constraints.maxStatsAbove90, 1)) continue;

      let remaining = toInt(constraints.totalPoints, 640) - sumStats(stats);
      if (remaining < 0) continue;

      let failed = false;
      while (remaining > 0) {
        const candidates = STAT_KEYS.filter((key) => {
          if (toInt(stats[key], 0) >= toInt(upper[key], maxStat)) return false;
          return canIncreaseStat(stats, key, constraints);
        });
        if (!candidates.length) {
          failed = true;
          break;
        }
        const weighted = [];
        candidates.forEach((key) => {
          const slack = Math.max(1, toInt(upper[key], maxStat) - toInt(stats[key], 0));
          const repeats = Math.max(1, Math.floor(priorityWeights[key] * 2 + slack / 4 + rng() * 2));
          for (let i = 0; i < repeats; i += 1) weighted.push(key);
        });
        const chosen = weighted[Math.floor(rng() * weighted.length)] || candidates[0];
        stats[chosen] += 1;
        remaining -= 1;
      }

      if (!failed && remaining === 0) {
        return stats;
      }
    }

    return null;
  }

  function computeStartBounds(constraints, minimums, profession, data) {
    const primeKeys = new Set(getPrimeStatKeys(data, profession));
    const minStartStats = minimums?.minStartStats || {};
    const maxStartStats = minimums?.maxStartStats || {};
    const minStat = toInt(constraints.minStat, 20);
    const maxStat = toInt(constraints.maxStat, 100);
    const lower = {};
    const upper = {};

    for (const key of STAT_KEYS) {
      const shift = primeKeys.has(key) ? 10 : 0;
      const minL0 = toInt(minStartStats[key], 0);
      const maxL0 = toInt(maxStartStats[key], 0);
      let lo = minStat;
      let hi = maxStat;
      if (minL0 > 0) lo = Math.max(lo, minL0 - shift);
      if (maxL0 > 0) hi = Math.min(hi, maxL0 - shift);
      lo = clamp(lo, minStat, maxStat);
      hi = clamp(hi, minStat, maxStat);
      if (lo > hi) return null;
      lower[key] = lo;
      upper[key] = hi;
    }

    return { lower, upper, primeKeys };
  }

  function findFeasibleStartInBounds(constraints, minimums, profession, data) {
    const bounds = computeStartBounds(constraints, minimums, profession, data);
    if (!bounds) return null;
    const { lower, upper } = bounds;

    const keys = [...STAT_KEYS].sort((a, b) => (toInt(upper[a], 100) - toInt(lower[a], 20)) - (toInt(upper[b], 100) - toInt(lower[b], 20)));
    const totalPoints = toInt(constraints.totalPoints, 640);
    const maxAbove70 = toInt(constraints.maxStatsAbove70, 4);
    const maxAbove90 = toInt(constraints.maxStatsAbove90, 1);
    const assignment = {};
    let found = null;

    function recurse(index, sumSoFar, above70, above90) {
      if (found) return;
      if (index === keys.length) {
        if (sumSoFar === totalPoints) {
          found = { ...assignment };
        }
        return;
      }

      const key = keys[index];
      const lo = toInt(lower[key], 20);
      const hi = toInt(upper[key], 100);
      const remainingKeys = keys.length - index - 1;

      let minRest = 0;
      let maxRest = 0;
      for (let i = index + 1; i < keys.length; i += 1) {
        minRest += toInt(lower[keys[i]], 20);
        maxRest += toInt(upper[keys[i]], 100);
      }

      const localLo = Math.max(lo, totalPoints - sumSoFar - maxRest);
      const localHi = Math.min(hi, totalPoints - sumSoFar - minRest);
      if (localLo > localHi) return;

      for (let value = localLo; value <= localHi; value += 1) {
        const nextAbove70 = above70 + (value > 70 ? 1 : 0);
        const nextAbove90 = above90 + (value > 90 ? 1 : 0);
        if (nextAbove70 > maxAbove70 || nextAbove90 > maxAbove90) continue;
        assignment[key] = value;
        recurse(index + 1, sumSoFar + value, nextAbove70, nextAbove90);
        if (found) return;
      }
      delete assignment[key];
    }

    recurse(0, 0, 0, 0);
    return found;
  }

  function diagnoseBoundedFeasibility(constraints, minimums, profession, data) {
    const bounds = computeStartBounds(constraints, minimums, profession, data);
    if (!bounds) {
      return {
        feasible: false,
        reason: "At least one stat has Min above Max after applying prime adjustments.",
      };
    }

    const { lower, upper } = bounds;
    const totalPoints = toInt(constraints.totalPoints, 640);
    const minSum = STAT_KEYS.reduce((sum, key) => sum + toInt(lower[key], 20), 0);
    const maxSum = STAT_KEYS.reduce((sum, key) => sum + toInt(upper[key], 100), 0);
    if (minSum > totalPoints) {
      return {
        feasible: false,
        reason: `Minimum constrained start sum is ${minSum}, which exceeds ${totalPoints}.`,
      };
    }
    if (maxSum < totalPoints) {
      return {
        feasible: false,
        reason: `Maximum constrained start sum is ${maxSum}, which is below ${totalPoints}.`,
      };
    }

    const lowerAbove70 = STAT_KEYS.reduce((count, key) => count + (toInt(lower[key], 20) > 70 ? 1 : 0), 0);
    const lowerAbove90 = STAT_KEYS.reduce((count, key) => count + (toInt(lower[key], 20) > 90 ? 1 : 0), 0);
    if (lowerAbove70 > toInt(constraints.maxStatsAbove70, 4)) {
      return {
        feasible: false,
        reason: `Minimum bounds force ${lowerAbove70} stats above 70 (limit ${toInt(constraints.maxStatsAbove70, 4)}).`,
      };
    }
    if (lowerAbove90 > toInt(constraints.maxStatsAbove90, 1)) {
      return {
        feasible: false,
        reason: `Minimum bounds force ${lowerAbove90} stats above 90 (limit ${toInt(constraints.maxStatsAbove90, 1)}).`,
      };
    }

    return {
      feasible: true,
      reason: "No direct contradiction detected in min/max start bounds.",
    };
  }

  function enforceStartBounds(stats, minimums, primeKeys) {
    const minStartStats = minimums?.minStartStats || {};
    const maxStartStats = minimums?.maxStartStats || {};
    const bounded = { ...stats };
    for (const key of STAT_KEYS) {
      const shift = primeKeys.has(key) ? 10 : 0;
      const minL0 = toInt(minStartStats[key], 0);
      const maxL0 = toInt(maxStartStats[key], 0);
      if (minL0 > 0) {
        bounded[key] = Math.max(bounded[key], minL0 - shift);
      }
      if (maxL0 > 0) {
        bounded[key] = Math.min(bounded[key], maxL0 - shift);
      }
    }
    return bounded;
  }

  function solveFast(params) {
    const { data, constraints, objectivePreset, profession, raceName, minimums } = params;
    const restarts = toInt(params?.fastRestarts, 12);
    const iterations = toInt(params?.fastIterations, 2500);
    const limitMs = Math.max(50, toNumber(params?.maxSeconds, 5) * 1000);
    const startTime = Date.now();
    const shortBudget = limitMs < 1000;
    const effectiveRestarts = shortBudget ? Math.min(4, restarts) : restarts;
    const effectiveIterations = shortBudget ? Math.min(220, iterations) : iterations;

    const localConstraints = {
      ...constraints,
      _raceName: raceName,
      _minimums: minimums,
    };

    let best = null;
    const deterministicBounded = findFeasibleStartInBounds(localConstraints, minimums, profession, data);
    if (deterministicBounded) {
      const deterministic = hillClimb({
        ...params,
        constraints: localConstraints,
        startStats: deterministicBounded,
        maxIterations: shortBudget ? effectiveIterations : Math.max(effectiveIterations, 900),
        deadlineMs: startTime + limitMs,
      });
      if (deterministic.ok && (!hasAnyMinimums(minimums) || deterministic.meetsMinimums)) {
        best = deterministic;
      }
    }

    const boundedSeed = buildBoundedSeedStartStats(
      data,
      localConstraints,
      objectivePreset,
      900719,
      profession,
      minimums
    );
    if (boundedSeed) {
      const bounded = hillClimb({
        ...params,
        constraints: localConstraints,
        startStats: boundedSeed,
        maxIterations: shortBudget ? effectiveIterations : Math.max(effectiveIterations, 900),
        deadlineMs: startTime + limitMs,
      });
      if (bounded.ok && (!hasAnyMinimums(minimums) || bounded.meetsMinimums)) {
        best = bounded;
      }
    }

    if (params?.seedStartStats) {
      const primeKeys = new Set(getPrimeStatKeys(data, profession));
      const boundedSeedStats = enforceStartBounds(
        normalizeStartStats(params.seedStartStats, constraints.minStat, constraints.maxStat),
        minimums,
        primeKeys
      );
      const seeded = hillClimb({
        ...params,
        constraints: localConstraints,
        startStats: boundedSeedStats,
        maxIterations: effectiveIterations,
        deadlineMs: startTime + limitMs,
      });
      if (seeded.ok && (!hasAnyMinimums(minimums) || seeded.meetsMinimums)) {
        best = seeded;
      }
    }

    let timedOut = false;
    for (let i = 0; i < effectiveRestarts; i += 1) {
      if (Date.now() - startTime >= limitMs) {
        timedOut = true;
        break;
      }
      const seed = buildSeedStartStats(data, localConstraints, objectivePreset, i * 7919 + 17, profession);
      const local = hillClimb({
        ...params,
        constraints: localConstraints,
        startStats: seed,
        maxIterations: effectiveIterations,
        deadlineMs: startTime + limitMs,
      });
      if (!local.ok) continue;
      if (hasAnyMinimums(minimums) && !local.meetsMinimums) continue;
      if (!best || compareVectors(local.vector, best.vector) > 0) best = local;
      if (local.timedOut) {
        timedOut = true;
        break;
      }
    }

    const elapsedMs = Date.now() - startTime;
    if (!timedOut && elapsedMs >= limitMs) {
      timedOut = true;
    }

    if (!best) {
      const diagnosis = diagnoseBoundedFeasibility(localConstraints, minimums, profession, data);
      return {
        status: timedOut ? "timeout" : "infeasible",
        provenOptimal: false,
        message: timedOut
          ? "Fast solver timed out before finding a feasible build."
          : diagnosis.feasible
          ? "Fast solver could not find a build that satisfies all minimum requirements. Try Resume, higher iterations, or Exact mode."
          : `Fast solver could not find a build: ${diagnosis.reason}`,
        diagnostic: diagnosis.reason,
        nodesExplored: 0,
        leavesExplored: 0,
        elapsedMs,
        estimatedLeaves: null,
        etaSeconds: null,
        bestBound: null,
      };
    }

    return {
      status: timedOut ? "timeout" : "best_found",
      provenOptimal: false,
      build: best,
      nodesExplored: 0,
      leavesExplored: 0,
      elapsedMs,
      estimatedLeaves: null,
      etaSeconds: null,
      bestBound: null,
    };
  }

  function hillClimb(params) {
    const {
      data,
      profileLogic,
      constraints,
      raceName,
      profession,
      targetLevel,
      targetExperience,
      minimums,
      objectivePreset,
      startStats,
      maxIterations,
      deadlineMs,
    } = params;

    let current = evaluateBuild({
      data,
      profileLogic,
      startStats,
      constraints,
      raceName,
      profession,
      targetLevel,
      targetExperience,
      minimums,
      objectivePreset,
    });

    const statWeights = statPriorityWeightMap({
      data,
      raceName,
      profession,
      objectivePreset,
      minimums,
    });

    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      if ((iteration & 7) === 0 && Number.isFinite(deadlineMs) && Date.now() >= deadlineMs) {
        current.timedOut = true;
        break;
      }
      let improved = false;
      let bestNeighbor = current;

      const orderedDonors = [...STAT_KEYS].sort((a, b) => {
        const slackA = toInt(current.startStats?.[a], 0) - toInt(constraints.minStat, 20);
        const slackB = toInt(current.startStats?.[b], 0) - toInt(constraints.minStat, 20);
        if (slackA !== slackB) return slackB - slackA;
        return statWeights[a] - statWeights[b];
      });
      const orderedReceivers = [...STAT_KEYS].sort((a, b) => statWeights[b] - statWeights[a]);

      for (const donor of orderedDonors) {
        if (Number.isFinite(deadlineMs) && Date.now() >= deadlineMs) {
          current.timedOut = true;
          break;
        }
        for (const receiver of orderedReceivers) {
        if (Number.isFinite(deadlineMs) && Date.now() >= deadlineMs) {
          current.timedOut = true;
          break;
        }
        if (donor === receiver) continue;
        if (!canDecreaseStat(current.startStats, donor, constraints)) continue;
        const candidateStats = { ...current.startStats };
        candidateStats[donor] -= 1;
        if (!canIncreaseStat(candidateStats, receiver, constraints)) continue;
        candidateStats[receiver] += 1;

        const candidate = evaluateBuild({
          data,
          profileLogic,
          startStats: candidateStats,
          constraints,
          raceName,
          profession,
          targetLevel,
          targetExperience,
          minimums,
          objectivePreset,
        });
        if (!candidate.ok) continue;

        if (compareVectors(candidate.vector, bestNeighbor.vector) > 0) {
          bestNeighbor = candidate;
          improved = true;
        }
      }
        if (current.timedOut) break;
      }

      if (!improved) break;
      current = bestNeighbor;
    }

    return current;
  }


  function estimateLeaves(index, remaining, constraints, memo, cap = 2000000000) {
    const key = `${index}|${remaining}`;
    if (memo.has(key)) return memo.get(key);
    if (index === STAT_KEYS.length) {
      const count = remaining === 0 ? 1 : 0;
      memo.set(key, count);
      return count;
    }

    const slotsLeft = STAT_KEYS.length - index;
    const min = toInt(constraints.minStat, 20);
    const max = toInt(constraints.maxStat, 100);
    const minRest = (slotsLeft - 1) * min;
    const maxRest = (slotsLeft - 1) * max;

    let total = 0;
    const low = Math.max(min, remaining - maxRest);
    const high = Math.min(max, remaining - minRest);
    for (let value = low; value <= high; value += 1) {
      total += estimateLeaves(index + 1, remaining - value, constraints, memo, cap);
      if (total > cap) {
        total = cap + 1;
        break;
      }
    }
    memo.set(key, total);
    return total;
  }

  function solveExact(params) {
    const {
      data,
      profileLogic,
      constraints,
      raceName,
      profession,
      targetLevel,
      targetExperience,
      minimums,
      objectivePreset,
      maxSeconds,
      onProgress,
    } = params;

    const startTime = Date.now();
    const limitMs = Math.max(50, toNumber(maxSeconds, 5) * 1000);

    const totalPoints = toInt(constraints.totalPoints, 640);
    const minStat = toInt(constraints.minStat, 20);
    const maxStat = toInt(constraints.maxStat, 100);
    const maxAbove70 = toInt(constraints.maxStatsAbove70, 4);
    const maxAbove90 = toInt(constraints.maxStatsAbove90, 1);

    const memo = new Map();
    const estimatedLeavesRaw = estimateLeaves(0, totalPoints, constraints, memo);
    const estimatedLeaves = estimatedLeavesRaw > 2000000000 ? null : estimatedLeavesRaw;

    let best = null;
    let nodes = 0;
    let leaves = 0;
    let timedOut = false;

    const order = [...STAT_KEYS].sort((a, b) => {
      const baseA = toInt(data?.baseGrowthRates?.[profession]?.[a], 0) + toInt(data?.raceGrowthModifiers?.[raceName]?.[a], 0);
      const baseB = toInt(data?.baseGrowthRates?.[profession]?.[b], 0) + toInt(data?.raceGrowthModifiers?.[raceName]?.[b], 0);
      return baseA - baseB;
    });

    if (params?.initialBestBuild?.ok) {
      best = params.initialBestBuild;
    } else if (params?.seedStartStats) {
      const seeded = evaluateBuild({
        data,
        profileLogic,
        startStats: normalizeStartStats(params.seedStartStats, minStat, maxStat),
        constraints,
        raceName,
        profession,
        targetLevel,
        targetExperience,
        minimums,
        objectivePreset,
      });
      if (seeded?.ok && seeded?.meetsMinimums) {
        best = seeded;
      }
    }

    const warmStart = solveFast({
      ...params,
      fastRestarts: Math.min(6, toInt(params?.fastRestarts, 12)),
      fastIterations: Math.min(900, toInt(params?.fastIterations, 2500)),
    });
    if (warmStart?.build?.ok) {
      best = warmStart.build;
    }

    function recurse(index, remaining, partial, above70, above90) {
      if (timedOut) return;
      nodes += 1;
      if ((nodes & 4095) === 0) {
        const elapsed = Date.now() - startTime;
        if (elapsed >= limitMs) {
          timedOut = true;
          return;
        }
        if (typeof onProgress === "function") {
          const rate = leaves > 0 ? leaves / Math.max(0.001, elapsed / 1000) : 0;
          const remainingLeaves = estimatedLeaves == null ? null : Math.max(0, estimatedLeaves - leaves);
          const eta = rate > 0 && remainingLeaves != null ? remainingLeaves / rate : null;
          onProgress({
            nodes,
            leaves,
            elapsedMs: elapsed,
            estimatedLeaves,
            etaSeconds: eta,
            bestVector: best?.vector || null,
          });
        }
      }

      if (index === order.length) {
        if (remaining !== 0) return;
        leaves += 1;
        const result = evaluateBuild({
          data,
          profileLogic,
          startStats: partial,
          constraints,
          raceName,
          profession,
          targetLevel,
          targetExperience,
          minimums,
          objectivePreset,
        });
        if (!result.ok || !result.meetsMinimums) return;
        if (!best || compareVectors(result.vector, best.vector) > 0) {
          best = result;
        }
        return;
      }

      const slotsLeft = order.length - index;
      const minRest = (slotsLeft - 1) * minStat;
      const maxRest = (slotsLeft - 1) * maxStat;
      const low = Math.max(minStat, remaining - maxRest);
      const high = Math.min(maxStat, remaining - minRest);
      if (low > high) return;

      const key = order[index];
      for (let value = high; value >= low; value -= 1) {
        const nextAbove70 = above70 + (value > 70 ? 1 : 0);
        if (nextAbove70 > maxAbove70) continue;
        const nextAbove90 = above90 + (value > 90 ? 1 : 0);
        if (nextAbove90 > maxAbove90) continue;

        partial[key] = value;
        recurse(index + 1, remaining - value, partial, nextAbove70, nextAbove90);
        if (timedOut) return;
      }
      delete partial[key];
    }

    recurse(0, totalPoints, {}, 0, 0);

    const elapsedMs = Date.now() - startTime;
    const rate = leaves > 0 ? leaves / Math.max(0.001, elapsedMs / 1000) : 0;
    const remainingLeaves = estimatedLeaves == null ? null : Math.max(0, estimatedLeaves - leaves);
    const etaSeconds = timedOut ? (rate > 0 && remainingLeaves != null ? remainingLeaves / rate : null) : 0;

    if (!best) {
      return {
        status: timedOut ? "timeout" : "infeasible",
        provenOptimal: false,
        message: timedOut
          ? "Exact solver timed out before finding a feasible build."
          : "No feasible build satisfies all constraints.",
        nodesExplored: nodes,
        leavesExplored: leaves,
        elapsedMs,
        estimatedLeaves,
        etaSeconds,
        bestBound: null,
      };
    }

    return {
      status: timedOut ? "timeout" : "optimal",
      provenOptimal: !timedOut,
      build: best,
      nodesExplored: nodes,
      leavesExplored: leaves,
      elapsedMs,
      estimatedLeaves,
      etaSeconds,
      bestBound: null,
    };
  }

  function solve(params) {
    const mode = params?.mode === "exact" ? "exact" : "fast";
    if (mode === "exact") return solveExact(params);
    return solveFast(params);
  }

  return {
    STAT_KEYS,
    clamp,
    toInt,
    toNumber,
    normalizeStartStats,
    sumStats,
    countAbove,
    getPrimeStatKeys,
    applyPrimeBonuses,
    validateStartStats,
    levelFromExperience,
    trainingPointsPerLevelForStats,
    estimateTotalTrainingPointsFromExperience,
    deriveExperienceTarget,
    computeFinalStatSummary,
    objectiveVector,
    minimumDeficit,
    scoreVector,
    hasAnyMinimums,
    compareVectors,
    satisfiesMinimums,
    evaluateBuild,
    solveFast,
    solveExact,
    solve,
  };
});
