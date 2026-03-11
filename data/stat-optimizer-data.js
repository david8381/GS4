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

  const statGeneralInfo = {
    str: {
      summary: "Melee AS, encumbrance, stamina, and block/parry support. Also helps ranged and thrown roundtime.",
    },
    con: {
      summary: "HP, stamina, crit resistance, disease resistance, and some encumbrance durability.",
    },
    dex: {
      summary: "Ranged and bolt accuracy, ambush precision, lock/trap work, and some melee speed/weighting.",
    },
    agi: {
      summary: "Evade-based DS, melee roundtime, maneuver defense, and UAF-style physical agility.",
    },
    dis: {
      summary: "Both PTP and MTP growth, experience pool, society/guild checks, and general willpower-style systems.",
    },
    aur: {
      summary: "PTP and MTP growth, spirit pool, and spirit/elemental casting and TD support.",
    },
    log: {
      summary: "MTP growth, experience pool and absorption, and magical utility/service support.",
    },
    int: {
      summary: "Trap sense, aiming/evade support, magical item use checks, and magical service support.",
    },
    wis: {
      summary: "Spiritual CS/TD support.",
    },
    inf: {
      summary: "Social systems, trading, and society-style checks.",
    },
  };

  const professionManaStats = {
    Bard: ["aur", "inf"],
    Cleric: ["wis"],
    Empath: ["wis", "inf"],
    Monk: ["log", "wis"],
    Paladin: ["wis"],
    Ranger: ["wis"],
    Rogue: ["aur", "wis"],
    Sorcerer: ["aur", "wis"],
    Warrior: ["aur", "wis"],
    Wizard: ["aur"],
  };

  const professionStatReasons = {
    Bard: {
      aur: "Prime requisite and mana stat. It matters to Bard-base spellcasting and Song of Luck.",
      inf: "Prime requisite and mana stat. It matters to bard mana, song support, and Song of Luck.",
      dex: "Useful on bolt, ranged, or ambush-leaning bard builds.",
    },
    Cleric: {
      int: "Prime requisite. It matters to Sanctify.",
      wis: "Prime requisite and mana stat. It directly matters to spiritual CS/TD, cleric mana, and Sanctify.",
    },
    Empath: {
      wis: "Prime requisite and mana stat. It directly matters to spiritual CS/TD, empath mana, and Bloodsmith.",
      inf: "Prime requisite and mana stat. It matters to empath mana and Bloodsmith.",
      con: "Bloodsmith uses Constitution bonus directly.",
    },
    Monk: {
      str: "Prime requisite. Important for physical offense, stamina, and front-line monk play.",
      agi: "Prime requisite. Important for evade, maneuver defense, and monk physical performance.",
      dex: "Mystic Tattoo uses Dexterity bonus directly.",
      dis: "Mystic Tattoo uses Discipline bonus directly.",
      log: "Mana stat for monks.",
      wis: "Mana stat for monks and relevant to monk spellcasting.",
    },
    Paladin: {
      str: "Prime requisite. Core to weapon AS, stamina, encumbrance, and front-line paladin play.",
      wis: "Prime requisite and mana stat. It matters to paladin CS/TD, mana, and Battle Standard.",
      inf: "Battle Standard uses Influence bonus directly.",
    },
    Ranger: {
      dex: "Prime requisite. Core for ranged/throwing precision, ambush accuracy, and many ranger utility checks.",
      int: "Prime requisite. It matters to Resist Nature.",
      wis: "Mana stat for rangers and relevant to ranger base CS/TD.",
    },
    Rogue: {
      agi: "Prime requisite. Central to evade DS, maneuver defense, and Covert Arts.",
      dex: "Prime requisite. Core for ranged/throwing, ambush precision, locks, traps, and Covert Arts.",
      aur: "Mana stat for rogues.",
      wis: "Mana stat for rogues.",
    },
    Sorcerer: {
      aur: "Prime requisite and mana stat. Central to sorcerer mana and elemental-side casting support.",
      wis: "Prime requisite and mana stat. Central to spiritual-side CS/TD, sorcerer mana, and Ensorcell.",
      int: "Ensorcell uses Intuition bonus directly.",
    },
    Warrior: {
      str: "Prime requisite. Core melee AS, stamina, encumbrance, and Warrior Guild services.",
      con: "Prime requisite. Strongly affects HP, stamina, critical resistance, and warrior durability.",
      aur: "Mana stat for warriors.",
      wis: "Mana stat for warriors.",
    },
    Wizard: {
      aur: "Prime requisite and mana stat. Central to wizard mana and Enchant.",
      log: "Prime requisite. It matters to Enchant.",
      int: "Enchant uses Intuition bonus directly.",
      dex: "Useful on bolt-focused wizard builds.",
    },
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
    statGeneralInfo,
    professionManaStats,
    professionStatReasons,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
