(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CsTdLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  function statToBonus(statValue) {
    return Math.floor((Number(statValue) - 50) / 2);
  }

  // Primary circle CS contribution for a given number of ranks at a given level.
  // Returns unrounded value — caller applies rounding.
  function primaryCircleCS(ranks, level, tiers) {
    let cs = 0;
    let remaining = Math.max(0, Math.floor(Number(ranks) || 0));
    const lvl = Math.max(0, Math.floor(Number(level) || 0));

    let prevThreshold = 0;
    for (const tier of tiers) {
      const threshold = tier.maxOver === 0 ? lvl : (tier.maxOver === Infinity ? Infinity : lvl + tier.maxOver);
      const slotEnd = Math.min(remaining, threshold);
      const slotStart = prevThreshold;
      if (slotEnd > slotStart) {
        cs += (slotEnd - slotStart) * tier.perRank;
      }
      prevThreshold = threshold;
      if (remaining <= threshold) break;
    }
    return cs;
  }

  // Secondary circle CS contribution for a given number of ranks at a given level.
  // Returns unrounded value — caller applies ceil.
  function secondaryCircleCS(ranks, level, tiers) {
    let cs = 0;
    let remaining = Math.max(0, Math.floor(Number(ranks) || 0));
    const lvl = Math.max(0, Math.floor(Number(level) || 0));

    let prevThreshold = 0;
    for (const tier of tiers) {
      const threshold = tier.fractionOfLevel === Infinity
        ? Infinity
        : Math.floor(lvl * tier.fractionOfLevel);
      const slotEnd = Math.min(remaining, threshold);
      const slotStart = prevThreshold;
      if (slotEnd > slotStart) {
        cs += (slotEnd - slotStart) * tier.perRank;
      }
      prevThreshold = threshold;
      if (remaining <= threshold) break;
    }
    return cs;
  }

  // Get the CS stat bonus for a circle from pre-computed stat bonuses.
  // statBonuses is a map like { aur: 37, wis: 30, dis: 13 } — already includes racial/ascension/enhancive.
  // For hybrid circles (2 stats), returns ceil(average of the two bonuses).
  function getCSStatBonus(circle, statBonuses, csTdData) {
    const mapping = csTdData.csStatByCircle[circle];
    if (!mapping) return 0;
    const bonuses = mapping.stats.map((statKey) => Number(statBonuses?.[statKey] || 0));
    if (bonuses.length === 1) return bonuses[0];
    return Math.ceil(bonuses.reduce((sum, b) => sum + b, 0) / bonuses.length);
  }

  // Get spell ranks for a given circle from profile skills.
  function getCircleRanks(circle, profile) {
    if (!profile?.skills) return 0;
    const skill = profile.skills.find((s) => s.name === circle);
    return Math.max(0, Math.floor(Number(skill?.finalRanks || skill?.ranks || 0)));
  }

  // Calculate CS when casting from a specific circle.
  // statBonuses: pre-computed map { aur: 37, wis: 30, ... } including all modifiers.
  function calculateCircleCS(castingCircle, profile, professionCircles, csTdData, spellBuffTotals, statBonuses) {
    const level = Math.max(0, Math.floor(Number(profile?.level || 0)));
    const levelCS = level * 3;

    // Stat bonus from pre-computed bonuses
    const statBonus = getCSStatBonus(castingCircle, statBonuses, csTdData);

    // Circle ranks — primary is the casting circle, secondary are the others
    const primaryRanks = getCircleRanks(castingCircle, profile);
    const isPrimary = professionCircles.has(castingCircle);

    let primaryCS = 0;
    let secondaryCS = 0;

    if (isPrimary) {
      primaryCS = Math.round(primaryCircleCS(primaryRanks, level, csTdData.primaryRankTiers));

      for (const circle of professionCircles) {
        if (circle === castingCircle) continue;
        const ranks = getCircleRanks(circle, profile);
        if (ranks > 0) {
          secondaryCS += Math.ceil(secondaryCircleCS(ranks, level, csTdData.secondaryRankTiers));
        }
      }
    } else {
      // Casting from a circle outside profession — all profession circles are secondary
      for (const circle of professionCircles) {
        const ranks = getCircleRanks(circle, profile);
        if (ranks > 0) {
          secondaryCS += Math.ceil(secondaryCircleCS(ranks, level, csTdData.secondaryRankTiers));
        }
      }
    }

    // Spell buff contribution for this circle
    const buffKeys = csTdData.csBuffKeysByCircle[castingCircle] || [];
    let spellBuffCS = 0;
    buffKeys.forEach((key) => {
      spellBuffCS += Number(spellBuffTotals?.[key] || 0);
    });

    const total = levelCS + Math.round(statBonus) + primaryCS + secondaryCS + spellBuffCS;

    return {
      circle: castingCircle,
      level: levelCS,
      statBonus: Math.round(statBonus),
      primaryCS,
      secondaryCS,
      spellBuffCS,
      total,
    };
  }

  // Get racial TD modifier for a sphere.
  function getRacialTDModifier(race, sphere, csTdData) {
    const key = String(race || "").toLowerCase().replace(/\s+/g, "-");
    const mods = csTdData.racialTDModifiers[key];
    if (!mods) return 0;
    return Number(mods[sphere] || 0);
  }

  // Calculate TD for a specific sphere.
  // statBonuses: pre-computed map { aur: 37, wis: 30, dis: 13 } including all modifiers.
  function calculateSphereTD(sphere, profile, csTdData, spellBuffTotals, raceOverride, statBonuses) {
    const level = Math.max(0, Math.floor(Number(profile?.level || 0)));
    const levelTD = level * 3;

    const statKey = csTdData.tdStatBySphere[sphere];
    const statBonus = Number(statBonuses?.[statKey] || 0);

    const race = raceOverride || profile?.race || "";
    const racialMod = getRacialTDModifier(race, sphere, csTdData);

    const tdKey = `td_${sphere}`;
    const spellBuffTD = Number(spellBuffTotals?.[tdKey] || 0);

    const total = levelTD + statBonus + racialMod + spellBuffTD;

    return {
      sphere,
      level: levelTD,
      statBonus,
      racialMod,
      spellBuffTD,
      total,
    };
  }

  // Apply TD buff crossover: each base sphere's buff total distributes
  // floor(50%) to other base spheres and floor(75%) to hybrid spheres.
  // Input: raw spell buff totals from spells module.
  // Returns: adjusted totals with crossover applied.
  function applyTDBuffCrossover(spellBuffTotals) {
    if (!spellBuffTotals) return spellBuffTotals;
    const spr = Number(spellBuffTotals.td_spiritual || 0);
    const ele = Number(spellBuffTotals.td_elemental || 0);
    const men = Number(spellBuffTotals.td_mental || 0);

    // No crossover needed if only one sphere has buffs and no other sphere exists
    if (spr === 0 && ele === 0 && men === 0) return spellBuffTotals;

    return {
      ...spellBuffTotals,
      td_spiritual: spr + Math.floor(ele / 2) + Math.floor(men / 2),
      td_elemental: ele + Math.floor(spr / 2) + Math.floor(men / 2),
      td_mental:    men + Math.floor(spr / 2) + Math.floor(ele / 2),
    };
  }

  // Build complete CS/TD results for a profile.
  // statBonuses: pre-computed map of stat key → final bonus (includes racial, ascension, enhancive).
  function calculateAll({ profile, professionCircles, csTdData, spellBuffTotals, raceOverride, statBonuses, crossoverApplied }) {
    const circles = professionCircles ? Array.from(professionCircles) : [];

    const csResults = circles.map((circle) =>
      calculateCircleCS(circle, profile, professionCircles, csTdData, spellBuffTotals, statBonuses)
    );

    // Skip crossover if caller already applied per-spell crossover
    const tdBuffs = crossoverApplied ? spellBuffTotals : applyTDBuffCrossover(spellBuffTotals);

    const tdResults = csTdData.tdSpheres.map((sphere) =>
      calculateSphereTD(sphere, profile, csTdData, tdBuffs, raceOverride, statBonuses)
    );

    return { csResults, tdResults };
  }

  return {
    statToBonus,
    primaryCircleCS,
    secondaryCircleCS,
    getCSStatBonus,
    getCircleRanks,
    calculateCircleCS,
    getRacialTDModifier,
    calculateSphereTD,
    applyTDBuffCrossover,
    calculateAll,
  };
});
