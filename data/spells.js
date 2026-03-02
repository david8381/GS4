(() => {
  // Source: https://gswiki.play.net/Buff_spells (oldid=227737)
  // Goal: canonical spell-effect schema with no "*_all" shortcuts.
  // Notes:
  // - If Buff_spells does not provide a numeric effect, modifiers are left at 0.
  // - Some spells have scaling in their dedicated pages; this file captures base values from Buff_spells only.

  const TD_KEYS = ["td_spiritual", "td_elemental", "td_mental"];
  const CS_KEYS = [
    "cs_arcane",
    "cs_spiritual",
    "cs_elemental",
    "cs_mental",
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

  function zeroModifiers() {
    const out = {};
    MODIFIER_KEYS.forEach((key) => {
      out[key] = 0;
    });
    return out;
  }

  function spell({ id, circle, name, effect_text, cast_scope = "sharable", stack_mode = "stackable", modifiers = {}, notes = [] }) {
    return {
      id,
      key: `${circle}:${id}`,
      circle,
      name,
      effect_text,
      cast_scope,
      stack_mode,
      modifiers: { ...zeroModifiers(), ...modifiers },
      notes,
    };
  }

  const buff_spells = [
    // Minor Spiritual
    spell({ id: 101, circle: "Minor Spiritual", name: "Spirit Warding I", effect_text: "+10 spiritual TD, +10 bolt DS", modifiers: { bolt_ds: 10, td_spiritual: 10 } }),
    spell({ id: 102, circle: "Minor Spiritual", name: "Spirit Barrier", effect_text: "+20 DS, -20 AS to melee/ranged/unarmed", cast_scope: "self_limited", modifiers: { non_bolt_ds: 20, as_physical: -20 } }),
    spell({ id: 103, circle: "Minor Spiritual", name: "Spirit Defense", effect_text: "+10 DS", modifiers: { non_bolt_ds: 10 } }),
    spell({ id: 104, circle: "Minor Spiritual", name: "Disease Resistance", effect_text: "Additional warding against disease" }),
    spell({ id: 105, circle: "Minor Spiritual", name: "Poison Resistance", effect_text: "Additional warding against poison" }),
    spell({ id: 107, circle: "Minor Spiritual", name: "Spirit Warding II", effect_text: "+15 spiritual TD, +25 bolt DS", modifiers: { bolt_ds: 25, td_spiritual: 15 } }),
    spell({ id: 112, circle: "Minor Spiritual", name: "Water Walking", effect_text: "Walk on water, marsh utility" }),
    spell({ id: 115, circle: "Minor Spiritual", name: "Fasthr's Reward", effect_text: "Second chance vs failed warding", cast_scope: "self_only" }),
    spell({ id: 117, circle: "Minor Spiritual", name: "Spirit Strike", effect_text: "+75 AS (single strike / short duration)", stack_mode: "not_stackable", modifiers: { as_physical: 75 } }),
    spell({ id: 120, circle: "Minor Spiritual", name: "Lesser Shroud", effect_text: "+15 DS, +20 spiritual TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 15, td_spiritual: 20 } }),
    spell({ id: 140, circle: "Minor Spiritual", name: "Wall of Force", effect_text: "+100 DS, short duration", stack_mode: "refreshable", modifiers: { non_bolt_ds: 100 } }),

    // Major Spiritual
    spell({ id: 202, circle: "Major Spiritual", name: "Spirit Shield", effect_text: "+10 DS", modifiers: { non_bolt_ds: 10 } }),
    spell({ id: 204, circle: "Major Spiritual", name: "Unpresence", effect_text: "Anti-detection utility" }),
    spell({ id: 207, circle: "Major Spiritual", name: "Purify Air", effect_text: "Implosion/gas defense utility" }),
    spell({ id: 209, circle: "Major Spiritual", name: "Untrammel", effect_text: "Second attempt vs web", cast_scope: "self_limited" }),
    spell({ id: 211, circle: "Major Spiritual", name: "Bravery", effect_text: "+15 AS", cast_scope: "self_limited", modifiers: { as_physical: 15 } }),
    spell({ id: 215, circle: "Major Spiritual", name: "Heroism", effect_text: "+25 AS", cast_scope: "self_limited", modifiers: { as_physical: 25 } }),
    spell({ id: 219, circle: "Major Spiritual", name: "Spell Shield", effect_text: "+30 bolt DS, +30 spiritual TD", cast_scope: "self_limited", modifiers: { bolt_ds: 30, td_spiritual: 30 } }),

    // Cleric Base
    spell({ id: 303, circle: "Cleric", name: "Prayer of Protection", effect_text: "+10 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 10 } }),
    spell({ id: 307, circle: "Cleric", name: "Benediction", effect_text: "+5 AS, +5 non-bolt DS", cast_scope: "self_or_group", modifiers: { as_physical: 5, non_bolt_ds: 5 } }),
    spell({ id: 310, circle: "Cleric", name: "Warding Sphere", effect_text: "+10 DS, +10 TD", cast_scope: "self_or_group", modifiers: { non_bolt_ds: 10, td_spiritual: 10, td_elemental: 10, td_mental: 10 } }),
    spell({ id: 313, circle: "Cleric", name: "Prayer", effect_text: "+10 DS, +10 spiritual TD, maneuver defense", cast_scope: "self_only", modifiers: { non_bolt_ds: 10, td_spiritual: 10 } }),
    spell({ id: 314, circle: "Cleric", name: "Relieve Burden", effect_text: "Reduces silver encumbrance", cast_scope: "self_limited" }),
    spell({ id: 319, circle: "Cleric", name: "Soul Ward", effect_text: "Defensive flares" }),

    // Minor Elemental
    spell({ id: 401, circle: "Minor Elemental", name: "Elemental Defense I", effect_text: "+5 DS, +5 elemental TD", modifiers: { non_bolt_ds: 5, td_elemental: 5 } }),
    spell({ id: 402, circle: "Minor Elemental", name: "Presence", effect_text: "Perception utility", cast_scope: "self_only", stack_mode: "not_stackable" }),
    spell({ id: 403, circle: "Minor Elemental", name: "Lock Pick Enhancement", effect_text: "Lockpicking enhancement" }),
    spell({ id: 404, circle: "Minor Elemental", name: "Disarm Enhancement", effect_text: "Disarm/aim enhancement" }),
    spell({ id: 406, circle: "Minor Elemental", name: "Elemental Defense II", effect_text: "+10 DS, +10 elemental TD", modifiers: { non_bolt_ds: 10, td_elemental: 10 } }),
    spell({ id: 414, circle: "Minor Elemental", name: "Elemental Defense III", effect_text: "+20 DS, +15 elemental TD", modifiers: { non_bolt_ds: 20, td_elemental: 15 } }),
    spell({ id: 419, circle: "Minor Elemental", name: "Mass Elemental Defense", effect_text: "+20 DS, +15 elemental TD (same effect as 414)", modifiers: { non_bolt_ds: 20, td_elemental: 15 } }),
    spell({
      id: 425,
      circle: "Minor Elemental",
      name: "Elemental Targeting",
      effect_text: "+25 AS, +25 CS",
      cast_scope: "self_only",
      modifiers: {
        as_physical: 25,
        cs_spiritual: 25,
        cs_elemental: 25,
        cs_mental: 25,
        cs_arcane: 25,
      },
    }),
    spell({ id: 430, circle: "Minor Elemental", name: "Elemental Barrier", effect_text: "+15 DS, +15 elemental TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 15, td_elemental: 15 } }),

    // Major Elemental
    spell({ id: 503, circle: "Major Elemental", name: "Thurfel's Ward", effect_text: "+20 DS", cast_scope: "self_or_target", modifiers: { non_bolt_ds: 20 } }),
    spell({ id: 507, circle: "Major Elemental", name: "Elemental Deflection", effect_text: "+20 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 20 } }),
    spell({ id: 508, circle: "Major Elemental", name: "Elemental Bias", effect_text: "+20 elemental TD", cast_scope: "self_only", modifiers: { td_elemental: 20 } }),
    spell({ id: 509, circle: "Major Elemental", name: "Strength", effect_text: "+15 strength bonus (+15 AS, reduced encumbrance)", cast_scope: "self_or_target", modifiers: { strength_bonus: 15, as_physical: 15 } }),
    spell({ id: 513, circle: "Major Elemental", name: "Elemental Focus", effect_text: "+20 bolt AS", cast_scope: "self_only", modifiers: { as_bolt: 20 } }),
    spell({ id: 520, circle: "Major Elemental", name: "Stone Skin", effect_text: "Armor-like defenses" }),
    spell({ id: 540, circle: "Major Elemental", name: "Temporal Reversion", effect_text: "Additional physical defense chance" }),

    // Ranger Base
    spell({ id: 601, circle: "Ranger", name: "Natural Colors", effect_text: "+10 DS with hiding bonus", cast_scope: "self_or_group", modifiers: { non_bolt_ds: 10 } }),
    spell({ id: 602, circle: "Ranger", name: "Resist Elements", effect_text: "+15 DS (against fire/ice/bolt)", cast_scope: "self_or_target", modifiers: { non_bolt_ds: 15, bolt_ds: 15 }, notes: ["Generic section also lists +10 DS; class section lists +15 situational DS."] }),
    spell({ id: 604, circle: "Ranger", name: "Nature's Bounty", effect_text: "Skinning/foraging bonus" }),
    spell({ id: 605, circle: "Ranger", name: "Barkskin", effect_text: "Chance to block, non-stackable", stack_mode: "not_stackable" }),
    spell({ id: 606, circle: "Ranger", name: "Phoen's Strength", effect_text: "+10 AS, +10 strength bonus", modifiers: { as_physical: 10, strength_bonus: 10 } }),
    spell({ id: 608, circle: "Ranger", name: "Camouflage", effect_text: "+30 AS while hidden", modifiers: { as_physical: 30 } }),
    spell({ id: 612, circle: "Ranger", name: "Breeze", effect_text: "Roundtime flare utility" }),
    spell({ id: 613, circle: "Ranger", name: "Self Control", effect_text: "+20 DS, +20 TD", modifiers: { non_bolt_ds: 20, td_spiritual: 20, td_elemental: 20, td_mental: 20 } }),
    spell({ id: 617, circle: "Ranger", name: "Sneaking", effect_text: "Stalking/hiding movement style" }),
    spell({ id: 618, circle: "Ranger", name: "Mobility", effect_text: "+20 dodge ranks", cast_scope: "self_or_target", modifiers: { dodge_ranks: 20 } }),
    spell({ id: 620, circle: "Ranger", name: "Resist Nature", effect_text: "Element resistance utility", cast_scope: "self_or_group" }),
    spell({ id: 625, circle: "Ranger", name: "Nature's Touch", effect_text: "+1 TD up to +12 (scales with Ranger ranks)", modifiers: { td_spiritual: 1, td_elemental: 1, td_mental: 1 }, notes: ["Minimum listed base +1 TD; scales by spell ranks."] }),
    spell({ id: 640, circle: "Ranger", name: "Wall of Thorns", effect_text: "+20 DS and block chance", modifiers: { non_bolt_ds: 20 } }),
    spell({ id: 650, circle: "Ranger", name: "Assume Aspect", effect_text: "Aspect-dependent buffs" }),

    // Sorcerer Base
    spell({ id: 704, circle: "Sorcerer", name: "Phase", effect_text: "SMR defense utility", cast_scope: "self_only" }),
    spell({ id: 712, circle: "Sorcerer", name: "Cloak of Shadows", effect_text: "+25 DS, +20 TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 25, td_spiritual: 20, td_elemental: 20, td_mental: 20 } }),
    spell({ id: 716, circle: "Sorcerer", name: "Pestilence", effect_text: "+25% chance to disease attacker", cast_scope: "self_only" }),
    spell({ id: 735, circle: "Sorcerer", name: "Ensorcell", effect_text: "Life channeling flares", cast_scope: "self_only" }),
    spell({ id: 703, circle: "Sorcerer", name: "Star Curse", effect_text: "+10 bolt AS after cursed targets die", cast_scope: "self_only", modifiers: { as_bolt: 10 } }),

    // Wizard Base
    spell({ id: 902, circle: "Wizard", name: "Minor Elemental Edge", effect_text: "+10 enhancive skill bonus to weapon" }),
    spell({ id: 905, circle: "Wizard", name: "Prismatic Guard", effect_text: "+5 physical DS, +20 bolt DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 5, bolt_ds: 20 } }),
    spell({ id: 909, circle: "Wizard", name: "Tremors", effect_text: "Charge/STOMP utility" }),
    spell({ id: 911, circle: "Wizard", name: "Mass Blur", effect_text: "+20 dodge ranks", cast_scope: "self_or_group", modifiers: { dodge_ranks: 20 } }),
    spell({ id: 913, circle: "Wizard", name: "Melgorehn's Aura", effect_text: "+10 DS, +20 elemental TD", cast_scope: "self_only", modifiers: { non_bolt_ds: 10, td_elemental: 20 } }),
    spell({ id: 919, circle: "Wizard", name: "Wizard's Shield", effect_text: "+50 DS, 60s, not stackable", cast_scope: "self_only", stack_mode: "not_stackable", modifiers: { non_bolt_ds: 50 } }),

    // Bard Base
    spell({ id: 1003, circle: "Bard", name: "Fortitude Song", effect_text: "+10 DS against melee/ranged/bolt", cast_scope: "self_only", stack_mode: "song_not_stackable", modifiers: { non_bolt_ds: 10, bolt_ds: 10 } }),
    spell({ id: 1006, circle: "Bard", name: "Song of Luck", effect_text: "Luck/maneuver utility", cast_scope: "self_or_group", stack_mode: "song_not_stackable" }),
    spell({ id: 1007, circle: "Bard", name: "Kai's Triumph Song", effect_text: "+10 AS", cast_scope: "self_or_group", stack_mode: "song_not_stackable", modifiers: { as_physical: 10 } }),
    spell({ id: 1010, circle: "Bard", name: "Song of Valor", effect_text: "+10 DS against melee/ranged/bolt", cast_scope: "self_only", stack_mode: "song_not_stackable", modifiers: { non_bolt_ds: 10, bolt_ds: 10 } }),
    spell({ id: 1019, circle: "Bard", name: "Song of Mirrors", effect_text: "+20 dodge", cast_scope: "self_only", stack_mode: "song_not_stackable", modifiers: { dodge_ranks: 20 } }),
    spell({ id: 1035, circle: "Bard", name: "Song of Tonis", effect_text: "+20 dodge ranks, -1s RT, 60s refreshable", cast_scope: "self_or_group", stack_mode: "refreshable", modifiers: { dodge_ranks: 20 } }),

    // Empath Base
    spell({ id: 1109, circle: "Empath", name: "Empathic Focus", effect_text: "+15 spiritual TD, +25 DS, +15 physical AS", cast_scope: "self_only", modifiers: { td_spiritual: 15, non_bolt_ds: 25, as_physical: 15 } }),
    spell({ id: 1119, circle: "Empath", name: "Strength of Will", effect_text: "+12 spiritual TD, +12 DS", cast_scope: "self_only", modifiers: { td_spiritual: 12, non_bolt_ds: 12 } }),
    spell({ id: 1125, circle: "Empath", name: "Troll's Blood", effect_text: "Healing/regen utility", cast_scope: "self_or_group" }),
    spell({ id: 1130, circle: "Empath", name: "Intensity", effect_text: "+20 AS, +20 DS", cast_scope: "self_only", modifiers: { as_physical: 20, non_bolt_ds: 20 } }),
    spell({ id: 1150, circle: "Empath", name: "Regeneration", effect_text: "Heal + crit reduction, 30s, not stackable", cast_scope: "self_only", stack_mode: "not_stackable" }),

    // Minor Mental
    spell({ id: 1202, circle: "Minor Mental", name: "Iron Skin", effect_text: "Armor-like defense", cast_scope: "self_only" }),
    spell({ id: 1204, circle: "Minor Mental", name: "Foresight", effect_text: "+10 DS", cast_scope: "self_or_target", modifiers: { non_bolt_ds: 10 } }),
    spell({ id: 1208, circle: "Minor Mental", name: "Mindward", effect_text: "+20 mental TD", cast_scope: "self_or_target", modifiers: { td_mental: 20 } }),
    spell({ id: 1209, circle: "Minor Mental", name: "Dragonclaw", effect_text: "+10 UAF", cast_scope: "self_only", modifiers: { uaf: 10 } }),
    spell({ id: 1213, circle: "Minor Mental", name: "Mind over Body", effect_text: "Stamina-cost utility, focus spell", cast_scope: "self_or_group", stack_mode: "focus_not_stackable" }),
    spell({ id: 1214, circle: "Minor Mental", name: "Brace", effect_text: "Parry enhancement", cast_scope: "self_only" }),
    spell({ id: 1215, circle: "Minor Mental", name: "Blink", effect_text: "Second chance vs physical/bolt attacks", cast_scope: "self_limited" }),
    spell({ id: 1216, circle: "Minor Mental", name: "Focus Barrier", effect_text: "+30 DS, group, focus spell", cast_scope: "self_or_group", stack_mode: "focus_not_stackable", modifiers: { non_bolt_ds: 30 } }),
    spell({ id: 1220, circle: "Minor Mental", name: "Premonition", effect_text: "+20 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 20 } }),

    // Paladin Base
    spell({ id: 1601, circle: "Paladin", name: "Mantle of Faith", effect_text: "+5 DS, +5 spiritual TD", stack_mode: "not_stackable", modifiers: { non_bolt_ds: 5, td_spiritual: 5 } }),
    spell({ id: 1605, circle: "Paladin", name: "Arm of the Arkati", effect_text: "+10% DF on weapons", cast_scope: "self_or_group" }),
    spell({ id: 1606, circle: "Paladin", name: "Dauntless", effect_text: "+10 AS and maneuver defense", cast_scope: "self_only", modifiers: { as_physical: 10 } }),
    spell({ id: 1608, circle: "Paladin", name: "Defense of the Faithful", effect_text: "+20 enhancive armor ranks", cast_scope: "self_only" }),
    spell({ id: 1609, circle: "Paladin", name: "Divine Shield", effect_text: "+15 melee DS, +10% block chance (shield), aura", cast_scope: "self_or_group", modifiers: { non_bolt_ds: 15 } }),
    spell({ id: 1610, circle: "Paladin", name: "Higher Vision", effect_text: "+10 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 10 } }),
    spell({ id: 1611, circle: "Paladin", name: "Patron's Blessing", effect_text: "+10 effective CMAN ranks", cast_scope: "self_only" }),
    spell({ id: 1612, circle: "Paladin", name: "Faith's Clarity", effect_text: "Armor hindrance reduction", cast_scope: "self_only", stack_mode: "not_stackable" }),
    spell({ id: 1616, circle: "Paladin", name: "Vigor", effect_text: "+4 CON", cast_scope: "self_only" }),
    spell({ id: 1617, circle: "Paladin", name: "Zealot", effect_text: "+30 AS, aura", cast_scope: "self_or_group", modifiers: { as_physical: 30 } }),
    spell({ id: 1618, circle: "Paladin", name: "Fervor", effect_text: "Damage weighting/flaring aura", cast_scope: "self_or_group" }),
    spell({ id: 1619, circle: "Paladin", name: "Faith Shield", effect_text: "+50 spiritual TD, 30s duration", cast_scope: "self_only", stack_mode: "cooldown", modifiers: { td_spiritual: 50 } }),

    // Arcane
    spell({ id: 1701, circle: "Arcane", name: "Arcane Decoy", effect_text: "Dispel decoy spell", cast_scope: "self_only" }),
    spell({
      id: 1711,
      circle: "Arcane",
      name: "Mystic Focus",
      effect_text: "+10 CS",
      cast_scope: "self_only",
      modifiers: {
        cs_spiritual: 10,
        cs_elemental: 10,
        cs_mental: 10,
        cs_arcane: 10,
      },
    }),
    spell({ id: 1712, circle: "Arcane", name: "Spirit Guard", effect_text: "+25 DS", cast_scope: "self_only", modifiers: { non_bolt_ds: 25 } }),
    spell({ id: 1720, circle: "Arcane", name: "Arcane Barrier", effect_text: "Cancels low-level offensive spells", cast_scope: "self_only" }),
  ];

  const spell_by_key = new Map(buff_spells.map((entry) => [entry.key, entry]));

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
    buff_spells,
    spell_by_key,
    normalize_spell_key,
    empty_modifier_totals,
  };
})();
