(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GS4_SUNFIST_DATA = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return {
    society: "Guardians of Sunfist",
    progression_key: "sunfist_rank",
    max_rank: 20,
    notes: [
      "Full first-pass Sunfist sigil table data from the published sigil table and sigil pages.",
      "combat_relevant marks whether a sigil should be offered in DS/AS/TD/CS/UAF calculators later.",
    ],
    abilities: [
      { id: "sigil_of_recognition", name: "Sigil of Recognition", rank_required: 1, points_required: 0, type: "utility", combat_relevant: false, resource_cost: { mana: 0, stamina: 0 }, duration: { type: "immediate" }, effect_summary: "Detects friends and foes of Sunfist in the same room.", modifiers: {} },
      { id: "sigil_of_location", name: "Sigil of Location", rank_required: 2, points_required: 5000, type: "utility", combat_relevant: false, resource_cost: { mana: 0, stamina: 0 }, duration: { type: "immediate" }, effect_summary: "Detects nearby foes of Sunfist. Gives 3 second RT.", modifiers: {} },
      { id: "sigil_of_contact", name: "Sigil of Contact", rank_required: 3, points_required: 6000, type: "utility", combat_relevant: false, resource_cost: { mana: 1, stamina: 0 }, duration: { minutes: 19 }, effect_summary: "Activates the ESP network.", modifiers: {} },
      { id: "sigil_of_resolve", name: "Sigil of Resolve", rank_required: 4, points_required: 7000, type: "utility", combat_relevant: false, resource_cost: { mana: 0, stamina: 5 }, duration: { seconds: 90 }, effect_summary: "Increases Climbing, Swimming, and Survival skill ranks by half of current GoS rank.", modifiers: {} },
      { id: "sigil_of_minor_bane", name: "Sigil of Minor Bane", rank_required: 5, points_required: 8000, type: "activated_buff", combat_relevant: true, calculator_tags: ["as"], resource_cost: { mana: 3, stamina: 3 }, duration: { seconds: 60 }, effect_summary: "+5 AS and heavy damage weighting to melee, ranged, and bolt attacks vs hated foes.", modifiers: { as_physical: 5, as_bolt: 5 } },
      { id: "sigil_of_bandages", name: "Sigil of Bandages", rank_required: 6, points_required: 9000, type: "utility", combat_relevant: false, resource_cost: { mana: 0, stamina: 10 }, duration: { minutes: 5 }, effect_summary: "Allows actions with bandaged wounds that would normally break bandages.", modifiers: {} },
      { id: "sigil_of_defense", name: "Sigil of Defense", rank_required: 7, points_required: 10000, type: "activated_buff", combat_relevant: true, calculator_tags: ["ds"], resource_cost: { mana: 5, stamina: 5 }, duration: { minutes: 5 }, effect_summary: "Provides a bonus to DS equal to current rank.", modifiers: {}, dynamic_rules: [{ type: "per_rank", factor: "sunfist_rank", metric: "non_bolt_ds", amount_per_rank: 1, max_total: 20 }] },
      { id: "sigil_of_offense", name: "Sigil of Offense", rank_required: 8, points_required: 11000, type: "activated_buff", combat_relevant: true, calculator_tags: ["as"], resource_cost: { mana: 5, stamina: 5 }, duration: { minutes: 5 }, effect_summary: "Provides a bonus to AS equal to current rank.", modifiers: {}, dynamic_rules: [{ type: "per_rank", factor: "sunfist_rank", metric: "as_physical", amount_per_rank: 1, max_total: 20 }] },
      { id: "sigil_of_distraction", name: "Sigil of Distraction", rank_required: 9, points_required: 12000, type: "attack", combat_relevant: false, resource_cost: { mana: 5, stamina: 10 }, duration: { type: "unknown" }, effect_summary: "Decreases enemies' chances to evade, parry, and block.", modifiers: {} },
      { id: "sigil_of_minor_protection", name: "Sigil of Minor Protection", rank_required: 10, points_required: 13000, type: "activated_buff", combat_relevant: true, calculator_tags: ["ds"], resource_cost: { mana: 5, stamina: 10 }, duration: { seconds: 60 }, effect_summary: "+5 DS and heavy damage padding.", modifiers: { non_bolt_ds: 5 } },
      { id: "sigil_of_focus", name: "Sigil of Focus", rank_required: 11, points_required: 14000, type: "activated_buff", combat_relevant: true, calculator_tags: ["td"], resource_cost: { mana: 5, stamina: 5 }, duration: { seconds: 60, stackable_to_seconds: 180 }, effect_summary: "Adds a bonus to TD equal to current rank.", modifiers: {}, dynamic_rules: [{ type: "per_rank", factor: "sunfist_rank", metric: "td_spiritual", amount_per_rank: 1, max_total: 20 }, { type: "per_rank", factor: "sunfist_rank", metric: "td_elemental", amount_per_rank: 1, max_total: 20 }, { type: "per_rank", factor: "sunfist_rank", metric: "td_mental", amount_per_rank: 1, max_total: 20 }] },
      { id: "sigil_of_intimidation", name: "Sigil of Intimidation", rank_required: 12, points_required: 15000, type: "attack", combat_relevant: false, resource_cost: { mana: "variable", stamina: "variable" }, duration: { type: "unknown" }, effect_summary: "Decreases enemies' AS and DS by 20.", modifiers: {} },
      { id: "sigil_of_mending", name: "Sigil of Mending", rank_required: 13, points_required: 16000, type: "utility", combat_relevant: false, resource_cost: { mana: 10, stamina: 15 }, duration: { minutes: 10 }, effect_summary: "+15 HP recovery and all healing herbs eat in 3 seconds.", modifiers: {} },
      { id: "sigil_of_concentration", name: "Sigil of Concentration", rank_required: 14, points_required: 17000, type: "utility", combat_relevant: false, resource_cost: { mana: 0, stamina: 30 }, duration: { minutes: 10 }, effect_summary: "+5 mana per pulse.", modifiers: {} },
      { id: "sigil_of_major_bane", name: "Sigil of Major Bane", rank_required: 15, points_required: 18000, type: "activated_buff", combat_relevant: true, calculator_tags: ["as"], resource_cost: { mana: 10, stamina: 10 }, duration: { seconds: 60 }, effect_summary: "+10 AS and heavy crit weighting to melee, ranged, and bolt attacks vs hated foes.", modifiers: { as_physical: 10, as_bolt: 10 } },
      { id: "sigil_of_determination", name: "Sigil of Determination", rank_required: 16, points_required: 19000, type: "utility", combat_relevant: false, resource_cost: { mana: 0, stamina: 30 }, duration: { minutes: 5 }, effect_summary: "Ignores task penalties while the character has minor injuries.", modifiers: {} },
      { id: "sigil_of_health", name: "Sigil of Health", rank_required: 17, points_required: 20000, type: "utility", combat_relevant: false, resource_cost: { mana: 10, stamina: 20 }, duration: { type: "immediate" }, effect_summary: "Instantly recover a minimum of 15 HP or half of lost HP, whichever is greater.", modifiers: {} },
      { id: "sigil_of_power", name: "Sigil of Power", rank_required: 18, points_required: 21000, type: "utility", combat_relevant: false, resource_cost: { mana: 0, stamina: 50 }, duration: { type: "immediate" }, effect_summary: "Converts 50 stamina into 25 mana.", modifiers: {} },
      { id: "sigil_of_major_protection", name: "Sigil of Major Protection", rank_required: 19, points_required: 22000, type: "activated_buff", combat_relevant: true, calculator_tags: ["ds"], resource_cost: { mana: 10, stamina: 15 }, duration: { seconds: 60 }, effect_summary: "+10 DS and heavy critical padding.", modifiers: { non_bolt_ds: 10 } },
      { id: "sigil_of_escape", name: "Sigil of Escape", rank_required: 20, points_required: 23000, type: "utility", combat_relevant: false, resource_cost: { mana: 15, stamina: 75 }, duration: { type: "immediate" }, effect_summary: "Teleports you to a safe location.", modifiers: {} },
    ],
  };
});
