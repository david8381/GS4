(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GS4_COL_DATA = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return {
    society: "Council of Light",
    progression_key: "col_rank",
    max_rank: 20,
    notes: [
      "Council of Light sign data from the published sign table and sign pages.",
      "combat_relevant marks whether an ability should be offered in DS/AS/TD/CS/UAF calculators later.",
      "Combat sign durations are modeled as seconds per Council rank from the sign pages.",
    ],
    abilities: [
      { id: "sign_of_recognition", name: "Sign of Recognition", rank_required: 1, type: "utility", combat_relevant: false, resource_cost: { mana: 0, spirit: 0 }, duration: { type: "immediate" }, effect_summary: "Identify other Council members and relative ranks.", modifiers: {} },
      { id: "signal", name: "Signal", rank_required: 2, type: "utility", combat_relevant: false, resource_cost: { mana: 0, spirit: 0 }, duration: { type: "immediate" }, effect_summary: "Use sign language to communicate with other society members in the room.", modifiers: {} },
      { id: "sign_of_warding", name: "Sign of Warding", rank_required: 3, type: "activated_buff", combat_relevant: true, calculator_tags: ["ds"], resource_cost: { mana: 1, spirit: 0, paid: "invoked" }, duration: { seconds_per_rank: 10 }, effect_summary: "+5 DS.", modifiers: { non_bolt_ds: 5 } },
      { id: "sign_of_striking", name: "Sign of Striking", rank_required: 4, type: "activated_buff", combat_relevant: true, calculator_tags: ["as"], resource_cost: { mana: 1, spirit: 0, paid: "invoked" }, duration: { seconds_per_rank: 10 }, effect_summary: "+5 AS.", modifiers: { as_physical: 5 } },
      { id: "sign_of_clotting", name: "Sign of Clotting", rank_required: 5, type: "utility", combat_relevant: false, resource_cost: { mana: 1, spirit: 0, paid: "invoked" }, duration: { seconds_per_rank: 10 }, effect_summary: "Stops all bleeding.", modifiers: {} },
      { id: "sign_of_thought", name: "Sign of Thought", rank_required: 6, type: "utility", combat_relevant: false, resource_cost: { mana: 1, spirit: 0, paid: "invoked" }, duration: { base_minutes: 10, seconds_per_rank: 6 }, effect_summary: "Crystal amulet-style thought network effect.", modifiers: {} },
      { id: "sign_of_defending", name: "Sign of Defending", rank_required: 7, type: "activated_buff", combat_relevant: true, calculator_tags: ["ds"], resource_cost: { mana: 2, spirit: 0, paid: "invoked" }, duration: { seconds_per_rank: 10 }, effect_summary: "+10 DS.", modifiers: { non_bolt_ds: 10 } },
      { id: "sign_of_smiting", name: "Sign of Smiting", rank_required: 8, type: "activated_buff", combat_relevant: true, calculator_tags: ["as"], resource_cost: { mana: 2, spirit: 0, paid: "invoked" }, duration: { seconds_per_rank: 10 }, effect_summary: "+10 AS.", modifiers: { as_physical: 10 } },
      { id: "sign_of_staunching", name: "Sign of Staunching", rank_required: 9, type: "utility", combat_relevant: false, resource_cost: { mana: 1, spirit: 0, paid: "invoked" }, duration: { seconds_per_rank: 20 }, effect_summary: "Stops all bleeding with longer duration than Clotting.", modifiers: {} },
      { id: "sign_of_deflection", name: "Sign of Deflection", rank_required: 10, type: "activated_buff", combat_relevant: true, calculator_tags: ["bolt_ds"], resource_cost: { mana: 3, spirit: 0, paid: "invoked" }, duration: { seconds_per_rank: 10 }, effect_summary: "+20 bolt DS.", modifiers: { bolt_ds: 20 } },
      { id: "sign_of_hypnosis", name: "Sign of Hypnosis", rank_required: 11, type: "attack", combat_relevant: false, resource_cost: { mana: 0, spirit: 1, paid: "invoked" }, duration: { type: "variable" }, effect_summary: "Calms a random target with a hidden warding check.", modifiers: {} },
      { id: "sign_of_swords", name: "Sign of Swords", rank_required: 12, type: "activated_buff", combat_relevant: true, calculator_tags: ["as"], resource_cost: { mana: 0, spirit: 1, paid: "dissipates" }, duration: { seconds_per_rank: 10 }, effect_summary: "+20 AS.", modifiers: { as_physical: 20 } },
      { id: "sign_of_shields", name: "Sign of Shields", rank_required: 13, type: "activated_buff", combat_relevant: true, calculator_tags: ["ds"], resource_cost: { mana: 0, spirit: 1, paid: "dissipates" }, duration: { seconds_per_rank: 10 }, effect_summary: "+20 DS.", modifiers: { non_bolt_ds: 20 } },
      { id: "sign_of_dissipation", name: "Sign of Dissipation", rank_required: 14, type: "activated_buff", combat_relevant: true, calculator_tags: ["td"], resource_cost: { mana: 0, spirit: 1, paid: "dissipates" }, duration: { seconds_per_rank: 10 }, effect_summary: "+15 TD.", modifiers: { td_spiritual: 15, td_elemental: 15, td_mental: 15 } },
      { id: "sign_of_healing", name: "Sign of Healing", rank_required: 15, type: "utility", combat_relevant: false, resource_cost: { mana: 0, spirit: 2, paid: "invoked" }, duration: { type: "instant" }, effect_summary: "Fully regenerates all hit points.", modifiers: {} },
      { id: "sign_of_madness", name: "Sign of Madness", rank_required: 16, type: "activated_buff", combat_relevant: true, calculator_tags: ["as", "ds"], resource_cost: { mana: 0, spirit: 3, paid: "dissipates" }, duration: { seconds: 15 }, effect_summary: "+50 AS, -50 DS.", modifiers: { as_physical: 50, non_bolt_ds: -50 } },
      { id: "sign_of_possession", name: "Sign of Possession", rank_required: 17, type: "attack", combat_relevant: false, resource_cost: { mana: 0, spirit: 4, paid: "invoked" }, duration: { type: "variable" }, effect_summary: "Mass calms the room with a hidden warding check.", modifiers: {} },
      { id: "sign_of_wracking", name: "Sign of Wracking", rank_required: 18, type: "utility", combat_relevant: false, resource_cost: { mana: 0, spirit: 5, paid: "invoked" }, duration: { type: "instant" }, effect_summary: "Fully regenerates all mana.", modifiers: {} },
      { id: "sign_of_darkness", name: "Sign of Darkness", rank_required: 19, type: "utility", combat_relevant: false, resource_cost: { mana: 0, spirit: 6, paid: "invoked" }, duration: { type: "instant" }, effect_summary: "Teleports the user to a safe point or nearest Council chapter.", modifiers: {} },
      { id: "sign_of_hopelessness", name: "Sign of Hopelessness", rank_required: 20, type: "utility", combat_relevant: false, resource_cost: { mana: 0, spirit: 0, paid: "n/a" }, duration: { type: "n/a" }, effect_summary: "Causes you to decay while dead.", modifiers: {} },
    ],
  };
});
