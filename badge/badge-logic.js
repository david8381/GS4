(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BadgeLogic = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  // Each badge upgrade grants this much enhancive "power" (community-derived; see
  // the Introduction/Cost Spreadsheet references). A boost can only be held once the
  // badge has enough total upgrades to cover its recharge cost / POWER_PER_UPGRADE.
  const POWER_PER_UPGRADE = 1200;

  const componentNames = ["Material", "Binding", "Device", "Motif", "Gem"];

  const statNames = [
    "Strength",
    "Constitution",
    "Dexterity",
    "Agility",
    "Discipline",
    "Aura",
    "Logic",
    "Intuition",
    "Wisdom",
    "Influence",
  ];

  const rankNames = [
    "Two Weapon Combat Ranks",
    "Armor Use Ranks",
    "Shield Use Ranks",
    "Combat Maneuvers Ranks",
    "Edged Weapons Ranks",
    "Blunt Weapons Ranks",
    "Two-Handed Weapons Ranks",
    "Ranged Weapons Ranks",
    "Thrown Weapons Ranks",
    "Polearm Weapons Ranks",
    "Brawling Ranks",
    "Ambushing Ranks",
    "Multi Opponent Combat Ranks",
    "Physical Fitness Ranks",
    "Dodging Ranks",
    "Arcane Symbols Ranks",
    "Magic Item Use Ranks",
    "Spell Aiming Ranks",
    "Harness Power Ranks",
    "Elemental Mana Control Ranks",
    "Mental Mana Control Ranks",
    "Spirit Mana Control Ranks",
    "Elemental Lore - Air Ranks",
    "Elemental Lore - Earth Ranks",
    "Elemental Lore - Fire Ranks",
    "Elemental Lore - Water Ranks",
    "Spiritual Lore - Blessings Ranks",
    "Spiritual Lore - Religion Ranks",
    "Spiritual Lore - Summoning Ranks",
    "Sorcerous Lore - Demonology Ranks",
    "Sorcerous Lore - Necromancy Ranks",
    "Mental Lore - Divination Ranks",
    "Mental Lore - Manipulation Ranks",
    "Mental Lore - Telepathy Ranks",
    "Mental Lore - Transference Ranks",
    "Mental Lore - Transformation Ranks",
    "Survival Ranks",
    "Disarming Traps Ranks",
    "Picking Locks Ranks",
    "Stalking and Hiding Ranks",
    "Perception Ranks",
    "Climbing Ranks",
    "Swimming Ranks",
    "First Aid Ranks",
    "Trading Ranks",
    "Pickpocketing Ranks",
  ];

  function buildBoostDefs() {
    const defs = [];

    const statUnits = [320, 240, 240, 240, 240, 480, 160, 160, 400, 160];
    statNames.forEach((name, idx) => {
      defs.push({ id: idx + 1, name: `${name} Stat`, max: 10, unit: statUnits[idx] });
    });

    const statBonusUnits = [1120, 880, 880, 880, 880, 1680, 560, 560, 1440, 560];
    statNames.forEach((name, idx) => {
      defs.push({ id: idx + 11, name: `${name} Bonus`, max: 5, unit: statBonusUnits[idx] });
    });

    defs.push({ id: 21, name: "Max Mana", max: 20, unit: 240 });
    defs.push({ id: 22, name: "Mana Recovery", max: 10, unit: 800 });
    defs.push({ id: 23, name: "Max Health", max: 20, unit: 160 });
    defs.push({ id: 24, name: "Health Recovery", max: 10, unit: 800 });
    defs.push({ id: 25, name: "Max Stamina", max: 20, unit: 240 });
    defs.push({ id: 26, name: "Stamina Recovery", max: 10, unit: 240 });
    defs.push({ id: 27, name: "Spirit Recovery", max: 2, unit: 16000 });

    const rankUnitOverrides = {
      29: { unit: 4000 }, // Armor Use
      40: { unit: 4800, max: 4 }, // MOC
      41: { unit: 1600 }, // PF
      43: { unit: 3200 }, // Arcane Symbols
      44: { unit: 3200 }, // MIU
      50: { unit: 4000 },
      51: { unit: 4000 },
      52: { unit: 4000 },
      53: { unit: 4000 },
      54: { unit: 4000 },
      55: { unit: 4000 },
      56: { unit: 4000 },
      57: { unit: 4000 },
      58: { unit: 4000 },
      59: { unit: 4000 },
      60: { unit: 4000 },
      61: { unit: 4000 },
      62: { unit: 4000 },
      63: { unit: 4000 },
      64: { unit: 1600 },
      65: { unit: 1600 },
      66: { unit: 1600 },
      67: { unit: 1600 },
      68: { unit: 1600 },
      69: { unit: 800, max: 10 }, // Climbing
      70: { unit: 800, max: 10 }, // Swimming
      71: { unit: 1600 },
      72: { unit: 1600 },
      73: { unit: 1600 },
    };

    rankNames.forEach((name, idx) => {
      const id = 28 + idx;
      const override = rankUnitOverrides[id] || {};
      defs.push({
        id,
        name,
        max: override.max || 5,
        unit: override.unit || 2400,
      });
    });

    const bonusUnitOverrides = {
      29: 400,
      40: 480,
      41: 160,
      43: 320,
      44: 320,
      50: 400,
      51: 400,
      52: 400,
      53: 400,
      54: 400,
      55: 400,
      56: 400,
      57: 400,
      58: 400,
      59: 400,
      60: 400,
      61: 400,
      62: 400,
      63: 400,
      64: 160,
      65: 160,
      66: 160,
      67: 160,
      68: 160,
      69: 80,
      70: 80,
      71: 160,
      72: 160,
      73: 160,
    };

    rankNames.forEach((name, idx) => {
      const sourceId = 28 + idx;
      const id = 74 + idx;
      defs.push({
        id,
        name: name.replace("Ranks", "Bonus"),
        max: 10,
        unit: bonusUnitOverrides[sourceId] || 240,
      });
    });

    return defs;
  }

  const boostDefs = buildBoostDefs();
  const boostById = new Map(boostDefs.map((def) => [def.id, def]));

  // Recharge cost for a boost of `value` points priced at `unit` per point is
  // triangular: unit * (1 + 2 + ... + value). Verified against the Cost Spreadsheet.
  function triangularCost(unit, value) {
    if (value <= 0) return 0;
    return unit * ((value * (value + 1)) / 2);
  }

  // Total lifetime BP invested to bring one component to `level` (triangular, 10k/level).
  function upgradeCostForLevel(level) {
    return 10000 * ((level * (level + 1)) / 2);
  }

  // Lifetime BP for the single next level of a component (capped at level 10).
  function nextUpgradeCost(level) {
    if (level >= 10) return 0;
    return (level + 1) * 10000;
  }

  function upgradeCostForComponents(components) {
    return components.reduce((sum, level) => sum + upgradeCostForLevel(level), 0);
  }

  function totalUpgrades(components) {
    return components.reduce((sum, value) => sum + value, 0);
  }

  // Enhancement slots unlock by CONCENTRATION, not raw total:
  //   2nd enhancement -> 10 upgrades within your top 2 components
  //   3rd enhancement -> 20 upgrades within your top 3 components
  // (GSWiki: Introduction to Adventurer's Guild Badges. Cheapest paths 5/5/0/0/0 and
  //  7/7/6/0/0.) A spread build like 4/4/4/4/4 unlocks only 1 slot despite 20 upgrades.
  function slotCount(components) {
    const sorted = [...components].sort((a, b) => b - a);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    let slots = total > 0 ? 1 : 0;
    const top2 = (sorted[0] || 0) + (sorted[1] || 0);
    const top3 = top2 + (sorted[2] || 0);
    if (top2 >= 10) slots = Math.max(slots, 2);
    if (top3 >= 20) slots = Math.max(slots, 3);
    return slots;
  }

  // Describes how to reach the next locked slot. Returns null when all 3 are unlocked.
  // { nextSlot: 2|3, withinTop: 2|3, needed: <upgrades still required in those comps> }
  function slotAdvice(components) {
    const current = slotCount(components);
    if (current >= 3) return null;
    const sorted = [...components].sort((a, b) => b - a);
    const top2 = (sorted[0] || 0) + (sorted[1] || 0);
    const top3 = top2 + (sorted[2] || 0);
    if (current < 2) {
      return { nextSlot: 2, withinTop: 2, needed: Math.max(0, 10 - top2) };
    }
    return { nextSlot: 3, withinTop: 3, needed: Math.max(0, 20 - top3) };
  }

  function requiredUpgradesForCost(cost) {
    if (cost <= 0) return 0;
    return Math.ceil(cost / POWER_PER_UPGRADE);
  }

  function availableEnhancementPowerForComponents(components) {
    return totalUpgrades(components) * POWER_PER_UPGRADE;
  }

  function boostCost(entry) {
    const def = boostById.get(entry.id);
    if (!def) return 0;
    return triangularCost(def.unit, entry.value);
  }

  function rechargeCostForBoosts(boosts) {
    return boosts.reduce((sum, entry) => sum + boostCost(entry), 0);
  }

  // Pure evaluation of a full badge state, used by both the UI and the test suite.
  function evaluateTestState(testState) {
    const upgrade = upgradeCostForComponents(testState.components);
    const slotsUnlocked = slotCount(testState.components);
    const slotsUsed = testState.boosts.filter((entry) => entry.value > 0).length;
    const recharge = rechargeCostForBoosts(testState.boosts);
    const power = availableEnhancementPowerForComponents(testState.components);
    return {
      upgrade,
      upgradeValid: upgrade <= testState.lifetimeBp,
      slotsUnlocked,
      slotsUsed,
      recharge,
      power,
      enhValid: slotsUsed <= slotsUnlocked && recharge <= power,
    };
  }

  return {
    POWER_PER_UPGRADE,
    componentNames,
    statNames,
    rankNames,
    buildBoostDefs,
    boostDefs,
    boostById,
    triangularCost,
    upgradeCostForLevel,
    nextUpgradeCost,
    upgradeCostForComponents,
    totalUpgrades,
    slotCount,
    slotAdvice,
    requiredUpgradesForCost,
    availableEnhancementPowerForComponents,
    boostCost,
    rechargeCostForBoosts,
    evaluateTestState,
  };
});
