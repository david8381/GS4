(() => {
  // Source: https://gswiki.play.net/Buff_spells (oldid=227737)
  // Goal: canonical spell-effect schema with no "*_all" shortcuts.
  // Notes:
  // - If Buff_spells does not provide a numeric effect, modifiers are left at 0.
  // - Some spells have scaling in their dedicated pages; this file captures base values from Buff_spells only.

  const TD_KEYS = ["td_spiritual", "td_elemental", "td_mental"];
  const CS_KEYS = [
    "cs_spiritual",
    "cs_elemental",
    "cs_mental",
    "cs_sorcerer",
    "cs_bard",
  ];

  const MODIFIER_KEYS = [
    "non_bolt_ds",
    "bolt_ds",
    ...TD_KEYS,
    ...CS_KEYS,
    "as_physical",
    "as_bolt",
    "dodge_ranks",
    "uaf",
    "strength_bonus",
  ];

  const FACTOR_DEFINITIONS = {
    level: {
      label: "Level",
      profileSource: { type: "field", path: "level" },
    },
    cleric_spell_ranks: {
      label: "Cleric spell ranks",
      profileSource: { type: "skill_ranks", skillName: "Cleric" },
    },
    major_spiritual_ranks: {
      label: "Major Spiritual ranks",
      profileSource: { type: "skill_ranks", skillName: "Major Spiritual" },
    },
    minor_spiritual_ranks: {
      label: "Minor Spiritual ranks",
      profileSource: { type: "skill_ranks", skillName: "Minor Spiritual" },
    },
    minor_elemental_ranks: {
      label: "Minor Elemental ranks",
      profileSource: { type: "skill_ranks", skillName: "Minor Elemental" },
    },
    ranger_spell_ranks: {
      label: "Ranger spell ranks",
      profileSource: { type: "skill_ranks", skillName: "Ranger" },
    },
    wizard_spell_ranks: {
      label: "Wizard spell ranks",
      profileSource: { type: "skill_ranks", skillName: "Wizard" },
    },
    bard_spell_ranks: {
      label: "Bard spell ranks",
      profileSource: { type: "skill_ranks", skillName: "Bard" },
    },
    major_elemental_ranks: {
      label: "Major Elemental ranks",
      profileSource: { type: "skill_ranks", skillName: "Major Elemental" },
    },
    sorcerer_spell_ranks: {
      label: "Sorcerer spell ranks",
      profileSource: { type: "skill_ranks", skillName: "Sorcerer" },
    },
    empath_spell_ranks: {
      label: "Empath spell ranks",
      profileSource: { type: "skill_ranks", skillName: "Empath" },
    },
    minor_mental_ranks: {
      label: "Minor Mental ranks",
      profileSource: { type: "skill_ranks", skillName: "Minor Mental" },
    },
    paladin_spell_ranks: {
      label: "Paladin spell ranks",
      profileSource: { type: "skill_ranks", skillName: "Paladin" },
    },
    spiritual_lore_blessings_ranks: {
      label: "Blessings Lore ranks",
      profileSource: { type: "skill_ranks", skillName: "Spiritual Lore - Blessings" },
    },
    spiritual_lore_religion_ranks: {
      label: "Religion Lore ranks",
      profileSource: { type: "skill_ranks", skillName: "Spiritual Lore - Religion" },
    },
    elemental_lore_air_ranks: {
      label: "Air Lore ranks",
      profileSource: { type: "skill_ranks", skillName: "Elemental Lore - Air" },
    },
    elemental_lore_earth_ranks: {
      label: "Earth Lore ranks",
      profileSource: { type: "skill_ranks", skillName: "Elemental Lore - Earth" },
    },
    elemental_lore_fire_ranks: {
      label: "Fire Lore ranks",
      profileSource: { type: "skill_ranks", skillName: "Elemental Lore - Fire" },
    },
    mental_lore_telepathy_ranks: {
      label: "Telepathy Lore ranks",
      profileSource: { type: "skill_ranks", skillName: "Mental Lore - Telepathy" },
    },
    mental_lore_transformation_ranks: {
      label: "Transformation Lore ranks",
      profileSource: { type: "skill_ranks", skillName: "Mental Lore - Transformation" },
    },
  };


  const PROFESSION_CIRCLE_BY_NAME = {
    cleric: "Cleric",
    wizard: "Wizard",
    ranger: "Ranger",
    bard: "Bard",
    empath: "Empath",
    sorcerer: "Sorcerer",
    paladin: "Paladin",
    monk: "Minor Mental",
  };

  const QUICK_SELECT_PRESETS = {
    invoker: {
      label: "Invoker",
      castMode: "outside",
      spellIds: [101, 103, 107, 202, 207, 401, 406, 414, 503, 509, 601, 602, 618, 911, 1204, 1208, 1601],
    },
    advanced_spellup_pills: {
      label: "Advanced Spellup Pills",
      castMode: "outside",
      spellIds: [101, 103, 107, 202, 207, 401, 406, 414, 503, 509, 601, 602, 618, 911, 1204, 1208, 1601],
      aliasOf: "invoker",
    },
  };

  function zeroModifiers() {
    const out = {};
    MODIFIER_KEYS.forEach((key) => {
      out[key] = 0;
    });
    return out;
  }

  function inferCalculatorTags(modifiers) {
    const tags = [];
    if (modifiers.non_bolt_ds || modifiers.bolt_ds) tags.push("ds");
    if (modifiers.as_physical || modifiers.as_bolt) tags.push("as");
    if (modifiers.td_spiritual || modifiers.td_elemental || modifiers.td_mental) tags.push("td");
    if (modifiers.cs_spiritual || modifiers.cs_elemental || modifiers.cs_mental || modifiers.cs_sorcerer || modifiers.cs_bard) tags.push("cs");
    if (modifiers.dodge_ranks) tags.push("dodge");
    if (modifiers.uaf) tags.push("uaf");
    if (modifiers.strength_bonus) tags.push("strength");
    return tags;
  }

  function spell({
    id,
    circle,
    name,
    effect_text,
    cast_scope = "sharable",
    stack_mode = "stackable",
    modifiers = {},
    notes = [],
    scaling_notes = [],
    calculator_relevant,
    calculator_tags = [],
  }) {
    const normalizedModifiers = { ...zeroModifiers(), ...modifiers };
    const inferredTags = inferCalculatorTags(normalizedModifiers);
    const explicitRelevant = typeof calculator_relevant === "boolean"
      ? calculator_relevant
      : inferredTags.length > 0;
    return {
      id,
      key: `${circle}:${id}`,
      circle,
      name,
      effect_text,
      cast_scope,
      stack_mode,
      modifiers: normalizedModifiers,
      notes,
      scaling_notes,
      calculator_relevant: explicitRelevant,
      calculator_tags: Array.from(new Set([...inferredTags, ...calculator_tags])),
    };
  }

  const buff_spells = [
    // Minor Spiritual
    spell({ id: 101, circle: "Minor Spiritual", name: "Spirit Warding I", effect_text: "+10 spiritual TD, +10 bolt DS", modifiers: { bolt_ds: 10, td_spiritual: 10 } }),
    spell({ id: 102, circle: "Minor Spiritual", name: "Spirit Barrier", effect_text: "+20 DS, -20 AS/UAF to melee/ranged/unarmed", cast_scope: "self_limited", modifiers: { non_bolt_ds: 20, bolt_ds: 20, as_physical: -20, uaf: -20 } }),
    spell({ id: 103, circle: "Minor Spiritual", name: "Spirit Defense", effect_text: "+10 DS", modifiers: { non_bolt_ds: 10, bolt_ds: 10 } }),
    spell({ id: 104, circle: "Minor Spiritual", name: "Disease Resistance", effect_text: "Additional warding against disease" }),
    spell({ id: 105, circle: "Minor Spiritual", name: "Poison Resistance", effect_text: "Additional warding against poison" }),
    spell({ id: 107, circle: "Minor Spiritual", name: "Spirit Warding II", effect_text: "+15 spiritual TD, +25 bolt DS", modifiers: { bolt_ds: 25, td_spiritual: 15 } }),
    spell({ id: 112, circle: "Minor Spiritual", name: "Water Walking", effect_text: "Walk on water, marsh utility" }),
    spell({ id: 115, circle: "Minor Spiritual", name: "Fasthr's Reward", effect_text: "Second chance vs failed warding", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["special_defense", "warding"], scaling_notes: ["Religion Lore improves the chance to trigger the second warding attempt."] }),
    spell({ id: 117, circle: "Minor Spiritual", name: "Spirit Strike", effect_text: "+75 AS (single strike / short duration)", stack_mode: "not_stackable", modifiers: { as_physical: 75, as_bolt: 75 } }),
    spell({ id: 120, circle: "Minor Spiritual", name: "Lesser Shroud", effect_text: "+15 DS, +20 spiritual TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 15, bolt_ds: 15, td_spiritual: 20 } }),
    spell({ id: 140, circle: "Minor Spiritual", name: "Wall of Force", effect_text: "+100 DS, short duration", stack_mode: "refreshable", modifiers: { non_bolt_ds: 100, bolt_ds: 100 } }),

    // Major Spiritual
    spell({ id: 202, circle: "Major Spiritual", name: "Spirit Shield", effect_text: "+10 DS", modifiers: { non_bolt_ds: 10, bolt_ds: 10 } }),
    spell({ id: 204, circle: "Major Spiritual", name: "Unpresence", effect_text: "Anti-detection utility" }),
    spell({ id: 207, circle: "Major Spiritual", name: "Purify Air", effect_text: "Implosion/gas defense utility", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 209, circle: "Major Spiritual", name: "Untrammel", effect_text: "Second attempt vs web", cast_scope: "self_limited", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 211, circle: "Major Spiritual", name: "Bravery", effect_text: "+15 AS", cast_scope: "self_limited", modifiers: { as_physical: 15, as_bolt: 15 } }),
    spell({ id: 215, circle: "Major Spiritual", name: "Heroism", effect_text: "+25 AS", cast_scope: "self_limited", modifiers: { as_physical: 25, as_bolt: 25 } }),
    spell({ id: 219, circle: "Major Spiritual", name: "Spell Shield", effect_text: "+30 bolt DS, +30 spiritual TD", cast_scope: "self_limited", modifiers: { bolt_ds: 30, td_spiritual: 30 } }),

    // Cleric Base
    spell({ id: 303, circle: "Cleric", name: "Prayer of Protection", effect_text: "+10 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 10, bolt_ds: 10 } }),
    spell({ id: 307, circle: "Cleric", name: "Benediction", effect_text: "+5 physical AS, +5 bolt AS, +5 DS", cast_scope: "self_or_group", modifiers: { as_physical: 5, as_bolt: 5, non_bolt_ds: 5, bolt_ds: 5 } }),
    spell({ id: 310, circle: "Cleric", name: "Warding Sphere", effect_text: "+10 DS, +10 TD", cast_scope: "self_or_group", modifiers: { non_bolt_ds: 10, bolt_ds: 10, td_spiritual: 10, td_elemental: 10, td_mental: 10 } }),
    spell({ id: 313, circle: "Cleric", name: "Prayer", effect_text: "+10 spiritual TD, maneuver defense; DS increases at higher Cleric ranks", cast_scope: "self_only", modifiers: { td_spiritual: 10 } }),
    spell({ id: 314, circle: "Cleric", name: "Relieve Burden", effect_text: "Reduces silver encumbrance", cast_scope: "self_limited" }),
    spell({ id: 319, circle: "Cleric", name: "Soul Ward", effect_text: "Defensive flares", calculator_relevant: true, calculator_tags: ["special_defense"] }),

    // Minor Elemental
    spell({ id: 401, circle: "Minor Elemental", name: "Elemental Defense I", effect_text: "+5 DS, +5 elemental TD", modifiers: { non_bolt_ds: 5, bolt_ds: 5, td_elemental: 5 } }),
    spell({ id: 402, circle: "Minor Elemental", name: "Presence", effect_text: "Perception utility", cast_scope: "self_only", stack_mode: "not_stackable" }),
    spell({ id: 403, circle: "Minor Elemental", name: "Lock Pick Enhancement", effect_text: "Lockpicking enhancement" }),
    spell({ id: 404, circle: "Minor Elemental", name: "Disarm Enhancement", effect_text: "Disarm/aim enhancement" }),
    spell({ id: 406, circle: "Minor Elemental", name: "Elemental Defense II", effect_text: "+10 DS, +10 elemental TD", modifiers: { non_bolt_ds: 10, bolt_ds: 10, td_elemental: 10 } }),
    spell({ id: 414, circle: "Minor Elemental", name: "Elemental Defense III", effect_text: "+20 DS, +15 elemental TD", modifiers: { non_bolt_ds: 20, bolt_ds: 20, td_elemental: 15 }, scaling_notes: ["Earth Lore adds a physical-attack deflection chance; starts at low ranks and scales upward."] }),
    spell({ id: 419, circle: "Minor Elemental", name: "Mass Elemental Defense", effect_text: "+20 DS, +15 elemental TD (same effect as 414)", modifiers: { non_bolt_ds: 20, td_elemental: 15 }, calculator_relevant: false }),
    spell({
      id: 425,
      circle: "Minor Elemental",
      name: "Elemental Targeting",
      effect_text: "+25 physical AS, +25 bolt AS, +25 elemental/bard CS, +13 sorcerer CS",
      cast_scope: "self_only",
      modifiers: {
        as_physical: 25,
        as_bolt: 25,
        cs_elemental: 25,
        cs_bard: 25,
        cs_sorcerer: 13,
      },
      scaling_notes: ["Minor Elemental ranks above 25 add +1 physical AS, +1 bolt AS, +1 elemental CS, and +1 bard CS per 2 ranks, capped by level and maxing at 75 ranks. Sorcerer CS increases by +1 per 4 ranks above 25 (effective rounded-up half bonus). Fire Lore adds a critical-weighting proc chance, which is not included in totals."],
    }),
    spell({ id: 430, circle: "Minor Elemental", name: "Elemental Barrier", effect_text: "+15 DS, +15 elemental TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 15, bolt_ds: 15, td_elemental: 15 }, scaling_notes: ["Minor Elemental ranks above 30 add flat DS and elemental TD. Air Lore adds a chance to reduce incoming critical severity, which is not included in totals."] }),

    // Major Elemental
    spell({ id: 503, circle: "Major Elemental", name: "Thurfel's Ward", effect_text: "+20 DS", cast_scope: "self_or_target", modifiers: { non_bolt_ds: 20, bolt_ds: 20 } }),
    spell({ id: 507, circle: "Major Elemental", name: "Elemental Deflection", effect_text: "+20 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 20, bolt_ds: 20 }, scaling_notes: ["Major Elemental ranks add +1 DS per 2 ranks above 7."] }),
    spell({ id: 508, circle: "Major Elemental", name: "Elemental Bias", effect_text: "+20 elemental TD", cast_scope: "self_only", modifiers: { td_elemental: 20 } }),
    spell({ id: 509, circle: "Major Elemental", name: "Strength", effect_text: "+15 strength bonus (AS comes from strength bonus, reduced encumbrance)", cast_scope: "self_or_target", modifiers: { strength_bonus: 15 }, scaling_notes: ["Earth Lore adds +1 strength bonus per seed 4 summation. This lore bonus is self-cast only."] }),
    spell({ id: 513, circle: "Major Elemental", name: "Elemental Focus", effect_text: "+20 bolt AS", cast_scope: "self_only", modifiers: { as_bolt: 20 }, scaling_notes: ["Spell ranks above 13 add flat bolt AS. Fire Lore adds additional non-flat bolt support not included in totals."] }),
    spell({ id: 520, circle: "Major Elemental", name: "Stone Skin", effect_text: "Armor-like defenses", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 540, circle: "Major Elemental", name: "Temporal Reversion", effect_text: "Additional physical defense chance", calculator_relevant: true, calculator_tags: ["special_defense"] }),

    // Ranger Base
    spell({ id: 601, circle: "Ranger", name: "Natural Colors", effect_text: "+10 DS with hiding bonus", cast_scope: "self_or_group", modifiers: { non_bolt_ds: 10, bolt_ds: 10 }, scaling_notes: ["Blessings Lore adds extra flat DS by seed 5 summation."] }),
    spell({ id: 602, circle: "Ranger", name: "Resist Elements", effect_text: "+15 bolt DS vs fire/ice/steam/lightning", cast_scope: "self_or_target", modifiers: { bolt_ds: 15 }, scaling_notes: ["Blessings Lore adds extra flat bolt DS by seed 5 summation."] }),
    spell({ id: 604, circle: "Ranger", name: "Nature's Bounty", effect_text: "Skinning/foraging bonus" }),
    spell({ id: 605, circle: "Ranger", name: "Barkskin", effect_text: "Chance to block, non-stackable", stack_mode: "not_stackable", calculator_relevant: true, calculator_tags: ["special_defense"], scaling_notes: ["Summoning Lore increases the bark endurance/block-style defense behavior."] }),
    spell({ id: 606, circle: "Ranger", name: "Phoen's Strength", effect_text: "+10 strength bonus (AS comes from strength bonus)", modifiers: { strength_bonus: 10 } }),
    spell({ id: 608, circle: "Ranger", name: "Camouflage", effect_text: "+30 AS while hidden, +18 spiritual CS", modifiers: { as_physical: 30, as_bolt: 30, cs_spiritual: 18 } }),
    spell({ id: 612, circle: "Ranger", name: "Breeze", effect_text: "Roundtime flare utility" }),
    spell({ id: 613, circle: "Ranger", name: "Self Control", effect_text: "+20 DS (melee), +20 spiritual TD", modifiers: { non_bolt_ds: 20, td_spiritual: 20 } }),
    spell({ id: 617, circle: "Ranger", name: "Sneaking", effect_text: "Stalking/hiding movement style" }),
    spell({ id: 618, circle: "Ranger", name: "Mobility", effect_text: "+20 dodge ranks", cast_scope: "self_or_target", modifiers: { dodge_ranks: 20 }, scaling_notes: ["Ranger Base ranks above 18 add phantom Dodge ranks for rangers, capped by level and 100 ranks. Ranger-only CML support is future calculator work."] }),
    spell({ id: 620, circle: "Ranger", name: "Resist Nature", effect_text: "Element resistance utility", cast_scope: "self_or_group" }),
    spell({ id: 625, circle: "Ranger", name: "Nature's Touch", effect_text: "+1 spiritual TD up to +12 (scales with Ranger ranks)", modifiers: { td_spiritual: 1 }, notes: ["Minimum listed base +1 spiritual TD; scales by Ranger spell ranks."] }),
    spell({ id: 640, circle: "Ranger", name: "Wall of Thorns", effect_text: "+20 DS and block chance", modifiers: { non_bolt_ds: 20 } }),
    spell({ id: 650, circle: "Ranger", name: "Assume Aspect", effect_text: "Aspect-dependent buffs", calculator_relevant: true, calculator_tags: ["special_offense", "special_defense"] }),

    // Sorcerer Base
    spell({ id: 704, circle: "Sorcerer", name: "Phase", effect_text: "SMR defense utility", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 712, circle: "Sorcerer", name: "Cloak of Shadows", effect_text: "+25 DS, +20 TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 25, bolt_ds: 25, td_spiritual: 20, td_elemental: 20, td_mental: 20 }, scaling_notes: ["Sorcerer Base ranks add +1 DS per rank above 12, capped by level, and +1 TD per 10 ranks above 12, capped by level."] }),
    spell({ id: 715, circle: "Sorcerer", name: "Curse (Star)", effect_text: "+10 bolt AS after cursed targets die", cast_scope: "self_only", modifiers: { as_bolt: 10 }, notes: ["Star is a curse mode of 715, not spell 703."], scaling_notes: ["Sorcerer Base ranks above 15 add +1 bolt AS per 3 ranks, capped by level. The AS bonus only applies after the cursed target dies."] }),
    spell({ id: 716, circle: "Sorcerer", name: "Pestilence", effect_text: "+25% chance to disease attacker", cast_scope: "self_only" }),
    spell({ id: 735, circle: "Sorcerer", name: "Ensorcell", effect_text: "Life channeling flares", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["special_offense"] }),

    // Wizard Base
    spell({ id: 902, circle: "Wizard", name: "Minor Elemental Edge", effect_text: "+10 enhancive skill bonus to weapon", calculator_relevant: true, calculator_tags: ["weapon_support"] }),
    spell({ id: 905, circle: "Wizard", name: "Prismatic Guard", effect_text: "+5 DS, +20 bolt DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 5, bolt_ds: 20 }, scaling_notes: ["Wizard Base ranks add +1 DS per 4 ranks above 5. Earth Lore adds extra DS by seed 5 summation."] }),
    spell({ id: 909, circle: "Wizard", name: "Tremors", effect_text: "Charge/STOMP utility" }),
    spell({ id: 911, circle: "Wizard", name: "Mass Blur", effect_text: "+20 dodge ranks", cast_scope: "self_or_group", modifiers: { dodge_ranks: 20 }, scaling_notes: ["Air Lore adds +1 Dodge rank by seed 1 summation to the caster only."] }),
    spell({ id: 913, circle: "Wizard", name: "Melgorehn's Aura", effect_text: "+10 DS, +20 elemental TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 10, bolt_ds: 10, td_elemental: 20 }, scaling_notes: ["Wizard Base ranks above 13 add flat DS and elemental TD."] }),
    spell({ id: 919, circle: "Wizard", name: "Wizard's Shield", effect_text: "+50 DS, 60s, not stackable", cast_scope: "self_only", stack_mode: "not_stackable", modifiers: { non_bolt_ds: 50 } }),

    // Bard Base
    spell({ id: 1003, circle: "Bard", name: "Fortitude Song", effect_text: "+10 DS against melee/ranged/bolt", cast_scope: "self_only", stack_mode: "song_not_stackable", modifiers: { non_bolt_ds: 10, bolt_ds: 10 } }),
    spell({ id: 1006, circle: "Bard", name: "Song of Luck", effect_text: "Luck/maneuver utility", cast_scope: "self_or_group", stack_mode: "song_not_stackable", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 1007, circle: "Bard", name: "Kai's Triumph Song", effect_text: "+10 AS", cast_scope: "self_or_group", stack_mode: "song_not_stackable", modifiers: { as_physical: 10, as_bolt: 10 }, scaling_notes: ["Bard Base ranks above 7 add +1 AS each, up to +20 total from songs known. Telepathy Lore adds +1 AS per seed 3 summation, up to +11 additional AS."] }),
    spell({ id: 1010, circle: "Bard", name: "Song of Valor", effect_text: "+10 DS against melee/ranged/bolt, +15 elemental TD", cast_scope: "self_only", stack_mode: "song_not_stackable", modifiers: { non_bolt_ds: 10, bolt_ds: 10, td_elemental: 15 } }),
    spell({ id: 1019, circle: "Bard", name: "Song of Mirrors", effect_text: "+20 dodge", cast_scope: "self_only", stack_mode: "song_not_stackable", modifiers: { dodge_ranks: 20 }, scaling_notes: ["Bard Base ranks add +1 Dodge rank per 2 ranks above 19."] }),
    spell({ id: 1035, circle: "Bard", name: "Song of Tonis", effect_text: "+20 dodge ranks, -1s RT, 60s refreshable", cast_scope: "self_or_group", stack_mode: "refreshable", modifiers: { dodge_ranks: 20 }, scaling_notes: ["Air Lore adds threshold-based Dodge rank increases up to +20 over base. Haste scaling remains note-only for now."] }),

    // Empath Base
    spell({ id: 1109, circle: "Empath", name: "Empathic Focus", effect_text: "+15 spiritual TD, +25 DS, +15 physical AS", cast_scope: "self_only", modifiers: { td_spiritual: 15, non_bolt_ds: 25, bolt_ds: 25, as_physical: 15 } }),
    spell({ id: 1119, circle: "Empath", name: "Strength of Will", effect_text: "+12 spiritual TD, +12 DS", cast_scope: "self_only", modifiers: { td_spiritual: 12, non_bolt_ds: 12, bolt_ds: 12 }, scaling_notes: ["Empath Base ranks add +1 DS and +1 spiritual TD per 3 ranks above 19, up to +25 total DS/TD at 58 ranks."] }),
    spell({ id: 1125, circle: "Empath", name: "Troll's Blood", effect_text: "Healing/regen utility", cast_scope: "self_or_group", calculator_relevant: true, calculator_tags: ["regen"] }),
    spell({ id: 1130, circle: "Empath", name: "Intensity", effect_text: "+20 AS, +20 DS", cast_scope: "self_only", modifiers: { as_physical: 20, as_bolt: 20, non_bolt_ds: 20, bolt_ds: 20 }, scaling_notes: ["Empath Base ranks add +1 AS and +1 DS per 2 ranks above 30, capped by level."] }),
    spell({ id: 1150, circle: "Empath", name: "Regeneration", effect_text: "Heal + crit reduction, 30s, not stackable", cast_scope: "self_only", stack_mode: "not_stackable", calculator_relevant: true, calculator_tags: ["special_defense", "regen"] }),

    // Minor Mental
    spell({ id: 1202, circle: "Minor Mental", name: "Iron Skin", effect_text: "Armor-like defense", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 1204, circle: "Minor Mental", name: "Foresight", effect_text: "+10 DS", cast_scope: "self_or_target", modifiers: { non_bolt_ds: 10 } }),
    spell({ id: 1208, circle: "Minor Mental", name: "Mindward", effect_text: "+20 mental TD", cast_scope: "self_or_target", modifiers: { td_mental: 20 } }),
    spell({ id: 1209, circle: "Minor Mental", name: "Dragonclaw", effect_text: "+10 UAF", cast_scope: "self_only", modifiers: { uaf: 10 }, scaling_notes: ["Transformation Lore adds +1 UAF by seed 1 summation."] }),
    spell({ id: 1213, circle: "Minor Mental", name: "Mind over Body", effect_text: "Stamina-cost utility, focus spell", cast_scope: "self_or_group", stack_mode: "focus_not_stackable" }),
    spell({ id: 1214, circle: "Minor Mental", name: "Brace", effect_text: "Parry enhancement", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 1215, circle: "Minor Mental", name: "Blink", effect_text: "Second chance vs physical/bolt attacks", cast_scope: "self_limited", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({ id: 1216, circle: "Minor Mental", name: "Focus Barrier", effect_text: "+30 DS, group, focus spell", cast_scope: "self_or_group", stack_mode: "focus_not_stackable", modifiers: { non_bolt_ds: 30, bolt_ds: 30 } }),
    spell({ id: 1220, circle: "Minor Mental", name: "Premonition", effect_text: "+20 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 20, bolt_ds: 20 } }),

    // Paladin Base
    spell({ id: 1601, circle: "Paladin", name: "Mantle of Faith", effect_text: "+5 DS, +5 spiritual TD", stack_mode: "not_stackable", modifiers: { non_bolt_ds: 5, bolt_ds: 5, td_spiritual: 5 }, scaling_notes: ["Self-cast only: Blessings Lore adds +1 DS and +1 spiritual TD by seed 2 summation."] }),
    spell({ id: 1605, circle: "Paladin", name: "Arm of the Arkati", effect_text: "+10% DF on weapons", cast_scope: "self_or_group", calculator_relevant: true, calculator_tags: ["weapon_support"] }),
    spell({ id: 1606, circle: "Paladin", name: "Dauntless", effect_text: "+10 AS and maneuver defense", cast_scope: "self_only", modifiers: { as_physical: 10, as_bolt: 10 } }),
    spell({ id: 1608, circle: "Paladin", name: "Defense of the Faithful", effect_text: "+20 enhancive armor ranks", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["armor_support"] }),
    spell({ id: 1609, circle: "Paladin", name: "Divine Shield", effect_text: "+15 melee DS, +10% block chance (shield), aura", cast_scope: "self_or_group", modifiers: { non_bolt_ds: 15 } }),
    spell({ id: 1610, circle: "Paladin", name: "Higher Vision", effect_text: "+10 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 10, bolt_ds: 10 }, scaling_notes: ["Paladin Base ranks add +1 DS per 2 ranks above 10, up to +55 total DS at 100 ranks. Religion Lore adds +1 DS by seed 5 summation."] }),
    spell({ id: 1611, circle: "Paladin", name: "Patron's Blessing", effect_text: "+10 effective CMAN ranks", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["cman_support"] }),
    spell({ id: 1612, circle: "Paladin", name: "Faith's Clarity", effect_text: "Armor hindrance reduction", cast_scope: "self_only", stack_mode: "not_stackable", calculator_relevant: true, calculator_tags: ["armor_support"] }),
    spell({ id: 1616, circle: "Paladin", name: "Vigor", effect_text: "+4 CON", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["stat_support"] }),
    spell({ id: 1617, circle: "Paladin", name: "Zealot", effect_text: "+30 AS, aura", cast_scope: "self_or_group", modifiers: { as_physical: 30 }, scaling_notes: ["Religion Lore adds +1 AS by seed 1 summation."] }),
    spell({ id: 1618, circle: "Paladin", name: "Fervor", effect_text: "Damage weighting/flaring aura", cast_scope: "self_or_group" }),
    spell({ id: 1619, circle: "Paladin", name: "Faith Shield", effect_text: "+50 spiritual TD, 30s duration", cast_scope: "self_only", stack_mode: "cooldown", modifiers: { td_spiritual: 50 }, scaling_notes: ["Religion Lore adds +3 spiritual TD by seed 5 summation, up to +74 total spiritual TD."] }),

    // Arcane
    spell({ id: 1701, circle: "Arcane", name: "Arcane Decoy", effect_text: "Dispel decoy spell", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["special_defense"] }),
    spell({
      id: 1705,
      circle: "Arcane",
      name: "Martial Prowess",
      effect_text: "Combat maneuver utility",
      cast_scope: "self_only",
      notes: ["Often delivered by a solid moonstone cube."],
      calculator_relevant: true,
      calculator_tags: ["cman_support"],
    }),
    spell({
      id: 1706,
      circle: "Arcane",
      name: "Flaming Aura",
      effect_text: "Weapon flare utility",
      cast_scope: "self_only",
      notes: ["Often delivered by a granite triangle."],
      calculator_relevant: true,
      calculator_tags: ["special_offense"],
    }),
    spell({
      id: 1711,
      circle: "Arcane",
      name: "Mystic Focus",
      effect_text: "CS bonus scales by level (minimum +10)",
      cast_scope: "self_only",
      modifiers: {},
      notes: [
        "Base calculator value is max(10, 30 - level) to the displayed spell types on this page.",
        "Heavy quartz orbs commonly provide this spell.",
        "Magic-item and scroll casts can add further Elemental/Sorcerer sphere bonus from MIU or AS, and that bonus does not stack with Elemental Targeting (425). That extra source-specific bonus is not included in totals yet.",
      ],
    }),
    spell({
      id: 1712,
      circle: "Arcane",
      name: "Spirit Guard",
      effect_text: "+25 DS",
      cast_scope: "self_only",
      modifiers: { non_bolt_ds: 25, bolt_ds: 25 },
      notes: ["Often delivered by a small statue."],
    }),
    spell({ id: 1720, circle: "Arcane", name: "Arcane Barrier", effect_text: "Cancels low-level offensive spells", cast_scope: "self_only", calculator_relevant: true, calculator_tags: ["special_defense"] }),
  ];

  const SELF_CAST_DYNAMIC_BY_ID = {
    307: {
      factors: ["cleric_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "cleric_spell_ranks",
          threshold: 7,
          divisor: 2,
          maxExtra: 10,
          cap_factor: "level",
          modifierKeys: ["as_physical", "as_bolt", "non_bolt_ds", "bolt_ds"],
          note: "+1 physical AS, +1 bolt AS, and +1 DS (all) per 2 Cleric ranks above 7, capped by level",
        },
        {
          type: "ranks_above_threshold",
          factor: "cleric_spell_ranks",
          threshold: 27,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["as_bolt"],
          note: "+1 additional bolt AS per 2 Cleric ranks above 27, capped by level",
        },
      ],
    },
    310: {
      factors: ["cleric_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "cleric_spell_ranks",
          threshold: 10,
          divisor: 1,
          maxExtra: 10,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds", "td_spiritual", "td_elemental", "td_mental"],
          note: "+1 DS (all) and +1 TD per Cleric rank above 10, capped by level, max +20 total",
        },
      ],
    },
    313: {
      factors: ["cleric_spell_ranks"],
      rules: [
        {
          type: "base_plus_ranks_above_threshold",
          factor: "cleric_spell_ranks",
          threshold: 35,
          base_value: 10,
          minimum_rank: 35,
          divisor: 1,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+10 DS (all) at 35 Cleric ranks, then +1 DS (all) per Cleric rank above 35",
        },
      ],
    },
    425: {
      factors: ["minor_elemental_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "minor_elemental_ranks",
          threshold: 25,
          divisor: 2,
          maxExtra: 25,
          cap_factor: "level",
          modifierKeys: ["as_physical", "as_bolt", "cs_elemental", "cs_bard"],
          note: "+1 physical AS, +1 bolt AS, +1 elemental CS, and +1 bard CS per 2 Minor Elemental ranks above 25, capped by level",
        },
        {
          type: "ranks_above_threshold",
          factor: "minor_elemental_ranks",
          threshold: 25,
          divisor: 4,
          maxExtra: 12,
          cap_factor: "level",
          modifierKeys: ["cs_sorcerer"],
          note: "+1 sorcerer CS per 4 Minor Elemental ranks above 25, capped by level",
        },
      ],
    },
    430: {
      factors: ["minor_elemental_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "minor_elemental_ranks",
          threshold: 30,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds", "td_elemental"],
          note: "+1 DS (all) and +1 elemental TD per 2 Minor Elemental ranks above 30, capped by level",
        },
      ],
    },
    509: {
      factors: ["elemental_lore_earth_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "elemental_lore_earth_ranks",
          seed: 4,
          maxExtra: 15,
          modifierKeys: ["strength_bonus"],
          note: "Earth Lore adds flat strength bonus by seed 4 summation",
        },
      ],
    },
    503: {
      factors: ["major_elemental_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "major_elemental_ranks",
          threshold: 3,
          divisor: 4,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 4 Major Elemental ranks above 3",
        },
      ],
    },
    507: {
      factors: ["major_elemental_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "major_elemental_ranks",
          threshold: 7,
          divisor: 2,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 2 Major Elemental ranks above 7",
        },
      ],
    },
    120: {
      factors: ["minor_spiritual_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "minor_spiritual_ranks",
          threshold: 20,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 2 Minor Spiritual ranks above 20, capped by level",
        },
      ],
    },
    202: {
      factors: ["major_spiritual_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "major_spiritual_ranks",
          threshold: 2,
          divisor: 3,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 3 Major Spiritual ranks above 2, capped by level",
        },
      ],
    },
    215: {
      factors: ["spiritual_lore_blessings_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "spiritual_lore_blessings_ranks",
          threshold: 0,
          divisor: 10,
          maxExtra: 35,
          modifierKeys: ["as_physical", "as_bolt"],
          note: "Blessings Lore adds +1 physical and bolt AS per 10 ranks, up to +60 total",
        },
      ],
    },
    303: {
      factors: ["cleric_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "cleric_spell_ranks",
          threshold: 3,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 2 Cleric ranks above 3, capped by level",
        },
      ],
    },
    905: {
      factors: ["wizard_spell_ranks", "elemental_lore_earth_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "wizard_spell_ranks",
          threshold: 5,
          divisor: 4,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 4 Wizard ranks above 5",
        },
        {
          type: "seed_sum",
          factor: "elemental_lore_earth_ranks",
          seed: 5,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "Earth Lore adds +1 DS (all) by seed 5 summation",
        },
      ],
    },
    513: {
      factors: ["major_elemental_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "major_elemental_ranks",
          threshold: 13,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["as_bolt"],
          note: "+1 bolt AS per 2 Major Elemental ranks above 13, capped by level",
        },
      ],
    },
    601: {
      factors: ["spiritual_lore_blessings_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "spiritual_lore_blessings_ranks",
          seed: 5,
          maxExtra: 9,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "Blessings Lore adds flat DS (all) by seed 5 summation",
        },
      ],
    },
    602: {
      factors: ["spiritual_lore_blessings_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "spiritual_lore_blessings_ranks",
          seed: 5,
          maxExtra: 9,
          modifierKeys: ["bolt_ds"],
          note: "Blessings Lore adds flat bolt DS by seed 5 summation",
        },
      ],
    },
    625: {
      factors: ["ranger_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "ranger_spell_ranks",
          threshold: 27,
          divisor: 2,
          maxExtra: 11,
          modifierKeys: ["td_spiritual"],
          note: "+1 spiritual TD per 2 Ranger ranks above 27, max +12 total",
        },
      ],
    },
    613: {
      factors: ["ranger_spell_ranks", "spiritual_lore_blessings_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "ranger_spell_ranks",
          threshold: 13,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds"],
          note: "+1 melee DS per 2 Ranger ranks above 13, capped by level",
        },
        {
          type: "seed_sum",
          factor: "spiritual_lore_blessings_ranks",
          seed: 5,
          modifierKeys: ["td_spiritual"],
          note: "Blessings Lore adds spiritual TD by seed 5 summation",
        },
      ],
    },
    618: {
      factors: ["ranger_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "ranger_spell_ranks",
          threshold: 18,
          cap_factor: "level",
          modifierKeys: ["dodge_ranks"],
          note: "+1 dodge rank per Ranger rank above 18, capped by level",
        },
      ],
    },
    1007: {
      factors: ["bard_spell_ranks", "mental_lore_telepathy_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "bard_spell_ranks",
          threshold: 7,
          divisor: 1,
          maxExtra: 10,
          cap_factor: "level",
          modifierKeys: ["as_physical", "as_bolt"],
          note: "+1 physical and bolt AS per Bard rank above 7, capped by level",
        },
        {
          type: "seed_sum",
          factor: "mental_lore_telepathy_ranks",
          seed: 3,
          maxExtra: 11,
          modifierKeys: ["as_physical", "as_bolt"],
          note: "Telepathy Lore adds flat physical and bolt AS by seed 3 summation",
        },
      ],
    },
    1010: {
      factors: ["bard_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "bard_spell_ranks",
          threshold: 10,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 2 Bard ranks above 10, capped by level",
        },
      ],
    },
    712: {
      factors: ["sorcerer_spell_ranks", "level"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "sorcerer_spell_ranks",
          threshold: 12,
          divisor: 1,
          cap_factor: "level",
          maxExtra: 88,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per Sorcerer rank above 12, capped by level",
        },
        {
          type: "ranks_above_threshold",
          factor: "sorcerer_spell_ranks",
          threshold: 12,
          divisor: 10,
          cap_factor: "level",
          maxExtra: 8,
          modifierKeys: ["td_spiritual", "td_elemental", "td_mental"],
          note: "+1 TD per 10 Sorcerer ranks above 12, capped by level",
        },
      ],
    },
    715: {
      factors: ["sorcerer_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "sorcerer_spell_ranks",
          threshold: 15,
          divisor: 3,
          cap_factor: "level",
          modifierKeys: ["as_bolt"],
          note: "+1 bolt AS per 3 Sorcerer ranks above 15, capped by level (applies after cursed target dies)",
        },
      ],
    },
    1019: {
      factors: ["bard_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "bard_spell_ranks",
          threshold: 19,
          divisor: 2,
          modifierKeys: ["dodge_ranks"],
          note: "+1 Dodge rank per 2 Bard ranks above 19",
        },
      ],
    },
    1035: {
      factors: ["elemental_lore_air_ranks"],
      rules: [
        {
          type: "threshold_table",
          factor: "elemental_lore_air_ranks",
          thresholds: [1, 2, 3, 5, 8, 10, 14, 17, 21, 26, 31, 36, 42, 49, 55, 63, 70, 78, 87, 96],
          modifierKeys: ["dodge_ranks"],
          note: "Air Lore adds threshold-based Dodge ranks, up to +20 over base",
        },
      ],
    },
    1119: {
      factors: ["empath_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "empath_spell_ranks",
          threshold: 19,
          divisor: 3,
          maxExtra: 13,
          modifierKeys: ["td_spiritual", "non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) and +1 spiritual TD per 3 Empath ranks above 19, up to +25 total",
        },
      ],
    },
    1130: {
      factors: ["empath_spell_ranks", "level"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "empath_spell_ranks",
          threshold: 30,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["as_physical", "as_bolt", "non_bolt_ds", "bolt_ds"],
          note: "+1 AS (physical and bolt) and +1 DS (all) per 2 Empath ranks above 30, capped by level",
        },
      ],
    },
    1601: {
      factors: ["spiritual_lore_blessings_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "spiritual_lore_blessings_ranks",
          seed: 2,
          modifierKeys: ["non_bolt_ds", "bolt_ds", "td_spiritual"],
          note: "Self-cast only: Blessings Lore adds +1 DS (all) and +1 spiritual TD by seed 2 summation",
        },
      ],
    },
    1609: {
      factors: ["paladin_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "paladin_spell_ranks",
          threshold: 18,
          divisor: 5,
          maxExtra: 5,
          modifierKeys: ["non_bolt_ds"],
          note: "+1 melee DS per 5 Paladin ranks above 18, max +5",
        },
      ],
    },
    1610: {
      factors: ["paladin_spell_ranks", "spiritual_lore_religion_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "paladin_spell_ranks",
          threshold: 10,
          divisor: 2,
          maxExtra: 45,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 2 Paladin ranks above 10, up to +55 total",
        },
        {
          type: "seed_sum",
          factor: "spiritual_lore_religion_ranks",
          seed: 5,
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "Religion Lore adds +1 DS (all) by seed 5 summation",
        },
      ],
    },
    1617: {
      factors: ["spiritual_lore_religion_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "spiritual_lore_religion_ranks",
          seed: 1,
          modifierKeys: ["as_physical"],
          note: "Religion Lore adds +1 AS by seed 1 summation",
        },
      ],
    },
    1619: {
      factors: ["spiritual_lore_religion_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "spiritual_lore_religion_ranks",
          seed: 5,
          maxExtra: 8,
          amount_per_step: 3,
          modifierKeys: ["td_spiritual"],
          note: "Religion Lore adds +3 spiritual TD by seed 5 summation",
        },
      ],
    },
    913: {
      factors: ["wizard_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "wizard_spell_ranks",
          threshold: 13,
          divisor: 1,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per Wizard rank above 13, capped by level",
        },
        {
          type: "ranks_above_threshold",
          factor: "wizard_spell_ranks",
          threshold: 13,
          divisor: 3,
          modifierKeys: ["td_elemental"],
          note: "+1 elemental TD per 3 Wizard ranks above 13",
        },
      ],
    },
    911: {
      factors: ["elemental_lore_air_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "elemental_lore_air_ranks",
          seed: 1,
          modifierKeys: ["dodge_ranks"],
          note: "Air Lore adds +1 Dodge rank by seed 1 summation to the caster only",
        },
      ],
    },
    1109: {
      factors: ["empath_spell_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "empath_spell_ranks",
          threshold: 9,
          divisor: 2,
          cap_factor: "level",
          modifierKeys: ["non_bolt_ds", "bolt_ds"],
          note: "+1 DS (all) per 2 Empath ranks above 9, capped by level",
        },
      ],
    },
    1208: {
      factors: ["minor_mental_ranks"],
      rules: [
        {
          type: "ranks_above_threshold",
          factor: "minor_mental_ranks",
          threshold: 8,
          divisor: 2,
          maxExtra: 20,
          modifierKeys: ["td_mental"],
          note: "+1 mental TD per 2 Minor Mental ranks above 8, max +40 self total",
        },
      ],
    },
    1209: {
      factors: ["mental_lore_transformation_ranks"],
      rules: [
        {
          type: "seed_sum",
          factor: "mental_lore_transformation_ranks",
          seed: 1,
          maxExtra: 24,
          modifierKeys: ["uaf"],
          note: "Transformation Lore adds +1 UAF by seed 1 summation",
        },
      ],
    },
    1711: {
      factors: ["level"],
      rules: [
        {
          type: "minimum_of_base_minus_factor",
          factor: "level",
          base_value: 30,
          minimum: 10,
          modifierKeys: ["cs_spiritual", "cs_elemental", "cs_mental", "cs_sorcerer", "cs_bard"],
          note: "CS bonus is max(10, 30 - level) to the displayed spell types",
        },
      ],
    },
  };

  const buff_spells_with_dynamic = buff_spells.map((entry) => ({
    ...entry,
    self_cast_dynamic: SELF_CAST_DYNAMIC_BY_ID[entry.id] || null,
  }));

  const spell_by_key = new Map(buff_spells_with_dynamic.map((entry) => [entry.key, entry]));

  function normalize_spell_key(value) {
    if (typeof value === "string") return value;
    return String(value?.key || "");
  }

  function empty_modifier_totals() {
    return zeroModifiers();
  }

  globalThis.GS4_SPELLS_DATA = {
    source_url: "https://gswiki.play.net/Buff_spells",
    source_oldid: 227737,
    modifier_keys: MODIFIER_KEYS,
    td_keys: TD_KEYS,
    cs_keys: CS_KEYS,
    factor_definitions: FACTOR_DEFINITIONS,
    profession_circle_by_name: PROFESSION_CIRCLE_BY_NAME,
    quick_select_presets: QUICK_SELECT_PRESETS,
    buff_spells: buff_spells_with_dynamic,
    spell_by_key,
    normalize_spell_key,
    empty_modifier_totals,
  };
})();
