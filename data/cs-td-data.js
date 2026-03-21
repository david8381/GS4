(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GS4_CS_TD_DATA = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  // Which sphere each spell circle belongs to.
  // Hybrid circles belong to multiple spheres — CS stat is computed differently.
  const circleSphere = {
    "Minor Spiritual": "spiritual",
    "Major Spiritual": "spiritual",
    "Cleric":          "spiritual",
    "Empath":          "spiritual",
    "Ranger":          "spiritual",
    "Paladin":         "spiritual",
    "Minor Elemental": "elemental",
    "Major Elemental": "elemental",
    "Wizard":          "elemental",
    "Minor Mental":    "mental",
    "Major Mental":    "mental",
    "Bard":            "hybrid:elemental+mental",
    "Sorcerer":        "hybrid:elemental+spiritual",
    "Monk":            "spiritual",
  };

  // Stat key(s) used for CS when casting from each sphere.
  // Hybrid circles average two stats.
  const csStatByCircle = {
    "Minor Spiritual": { stats: ["wis"] },
    "Major Spiritual": { stats: ["wis"] },
    "Cleric":          { stats: ["wis"] },
    "Empath":          { stats: ["wis"] },
    "Ranger":          { stats: ["wis"] },
    "Paladin":         { stats: ["wis"] },
    "Minor Elemental": { stats: ["aur"] },
    "Major Elemental": { stats: ["aur"] },
    "Wizard":          { stats: ["aur"] },
    "Minor Mental":    { stats: ["log"] },
    "Major Mental":    { stats: ["inf", "log"] },
    "Bard":            { stats: ["aur"] },
    "Sorcerer":        { stats: ["aur", "wis"] },
    "Monk":            { stats: ["wis"] },
  };

  // Primary circle CS per rank, tiered by how many ranks exceed level.
  // Each tier: { maxOver: ranks above level threshold, perRank: CS gained per rank }
  // Ranks up to level get 1.0 each (handled as the base case).
  const primaryRankTiers = [
    { maxOver: 0,   perRank: 1.0 },
    { maxOver: 20,  perRank: 0.75 },
    { maxOver: 60,  perRank: 0.5 },
    { maxOver: 100, perRank: 0.25 },
    { maxOver: Infinity, perRank: 0.125 },
  ];

  // Secondary circle CS per rank, tiered by fraction of level.
  // Up to 2/3 level: 1/3 per rank; 2/3 to level: 1/9 per rank; above level: 1/20 per rank.
  const secondaryRankTiers = [
    { fractionOfLevel: 2 / 3, perRank: 1 / 3 },
    { fractionOfLevel: 1,     perRank: 1 / 9 },
    { fractionOfLevel: Infinity, perRank: 1 / 20 },
  ];

  // TD stat by sphere type.
  const tdStatBySphere = {
    spiritual: "wis",
    elemental: "aur",
    mental:    "dis",
  };

  // All TD sphere definitions for display. Base spheres use a single stat;
  // hybrid spheres average two base sphere TDs; generic uses no stat.
  const tdSphereList = [
    { key: "generic",     label: "Generic",     type: "generic" },
    { key: "elemental",   label: "Elemental",   type: "base", stat: "aur" },
    { key: "spiritual",   label: "Spiritual",   type: "base", stat: "wis" },
    { key: "mental",      label: "Mental",      type: "base", stat: "dis" },
    { key: "ele-spr",     label: "Ele/Spr",     type: "hybrid", sources: ["elemental", "spiritual"] },
    { key: "men-spr",     label: "Men/Spr",     type: "hybrid", sources: ["mental", "spiritual"] },
    { key: "men-ele",     label: "Men/Ele",     type: "hybrid", sources: ["mental", "elemental"] },
  ];

  // Base spheres used by the logic module.
  const tdSpheres = ["spiritual", "elemental", "mental"];

  // TD sphere labels (kept for backward compat).
  const tdSphereLabels = {
    spiritual: "Spiritual",
    elemental: "Elemental",
    mental:    "Mental",
  };

  // Racial TD modifiers. Keyed by normalized race key (matching GS4Util.normalizeRaceForModifierLookup).
  // Sorcerer TD = average of spiritual and elemental (computed, not stored).
  const racialTDModifiers = {
    "dark-elf":     { spiritual: -5,  elemental: -5,  mental: 0 },
    "dwarf":        { spiritual: 0,   elemental: 30,  mental: 0 },
    "elf":          { spiritual: -5,  elemental: -5,  mental: 0 },
    "giantman":     { spiritual: 5,   elemental: -5,  mental: 0 },
    "half-elf":     { spiritual: -5,  elemental: -5,  mental: 0 },
    "halfling":     { spiritual: 0,   elemental: 40,  mental: 0 },
    "sylvankind":   { spiritual: -5,  elemental: -5,  mental: 0 },
  };
  // Races not listed have all zeros.

  // Which CS modifier key maps to which sphere (for reading spell buff totals).
  const csModifierToSphere = {
    cs_spiritual: "spiritual",
    cs_elemental: "elemental",
    cs_mental:    "mental",
    cs_sorcerer:  "sorcerer",
    cs_bard:      "bard",
  };

  // Which spell buff CS keys apply when casting from a given circle.
  // Elemental circles benefit from cs_elemental.
  // Spiritual circles benefit from cs_spiritual.
  // Sorcerer benefits from cs_sorcerer (and partial from both elemental/spiritual).
  // Bard benefits from cs_bard (and partial from elemental).
  // Mental circles benefit from cs_mental.
  const csBuffKeysByCircle = {
    "Minor Spiritual": ["cs_spiritual"],
    "Major Spiritual": ["cs_spiritual"],
    "Cleric":          ["cs_spiritual"],
    "Empath":          ["cs_spiritual"],
    "Ranger":          ["cs_spiritual"],
    "Paladin":         ["cs_spiritual"],
    "Minor Elemental": ["cs_elemental"],
    "Major Elemental": ["cs_elemental"],
    "Wizard":          ["cs_elemental"],
    "Minor Mental":    ["cs_mental"],
    "Major Mental":    ["cs_mental"],
    "Bard":            ["cs_bard"],
    "Sorcerer":        ["cs_sorcerer"],
    "Monk":            ["cs_spiritual"],
  };

  return {
    circleSphere,
    csStatByCircle,
    primaryRankTiers,
    secondaryRankTiers,
    tdStatBySphere,
    tdSphereList,
    tdSpheres,
    tdSphereLabels,
    racialTDModifiers,
    csModifierToSphere,
    csBuffKeysByCircle,
  };
});
