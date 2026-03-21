(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SpellsUI = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  // Determine the native hybrid sphere pair for a spell circle using cs-td-data.
  // Returns e.g. ["elemental","spiritual"] for Sorcerer, or null for non-hybrid circles.
  function getNativeHybridSpheres(circle) {
    const circleSphere = globalThis.GS4_CS_TD_DATA?.circleSphere;
    if (!circleSphere) return null;
    const sphere = circleSphere[circle];
    if (!sphere || !sphere.startsWith("hybrid:")) return null;
    return sphere.slice(7).split("+"); // e.g. ["elemental","spiritual"]
  }

  // TD buff crossover: each individual spell/society contribution distributes
  // floor(50%) to the other two base spheres. Applied per-source (not on
  // aggregate) to match in-game rounding.
  // Spells that provide TD to multiple spheres do NOT generate crossover —
  // they already cover those spheres directly (confirmed via in-game testing).
  function applyTDCrossoverPerSpell(totals, spellRows, societyRows) {
    if (!totals) return totals;
    const sources = [
      ...(spellRows || []).map((r) => r.totals),
      ...(societyRows || []).map((r) => r.totals),
    ];
    let crossSpr = 0, crossEle = 0, crossMen = 0;
    for (const src of sources) {
      const spr = Number(src?.td_spiritual || 0);
      const ele = Number(src?.td_elemental || 0);
      const men = Number(src?.td_mental || 0);
      // Only single-sphere sources generate crossover
      const sphereCount = (spr ? 1 : 0) + (ele ? 1 : 0) + (men ? 1 : 0);
      if (sphereCount !== 1) continue;
      crossSpr += Math.floor(ele / 2) + Math.floor(men / 2);
      crossEle += Math.floor(spr / 2) + Math.floor(men / 2);
      crossMen += Math.floor(spr / 2) + Math.floor(ele / 2);
    }
    if (crossSpr === 0 && crossEle === 0 && crossMen === 0) return totals;
    totals.td_spiritual = Number(totals.td_spiritual || 0) + crossSpr;
    totals.td_elemental = Number(totals.td_elemental || 0) + crossEle;
    totals.td_mental    = Number(totals.td_mental || 0) + crossMen;
    return totals;
  }

  // Compute per-spell hybrid TD buff contributions.
  // Single-sphere: 75% to matching hybrids, 50% to third-sphere hybrids.
  // Multi-sphere: for the spell's native hybrid ceil(all/2), else floor(matching/2).
  // Confirmed via in-game incremental testing with 712 (Sorcerer = Ele/Spr hybrid).
  function computeHybridTDSpellBuffs(spellRows, societyRows) {
    const allRows = [
      ...(spellRows || []).map((r) => ({ totals: r.totals, circle: r.spell?.circle })),
      ...(societyRows || []).map((r) => ({ totals: r.totals, circle: null })),
    ];
    let hES = 0, hMS = 0, hME = 0;
    for (const row of allRows) {
      const spr = Number(row.totals?.td_spiritual || 0);
      const ele = Number(row.totals?.td_elemental || 0);
      const men = Number(row.totals?.td_mental || 0);
      if (!spr && !ele && !men) continue;
      const sphereCount = (spr ? 1 : 0) + (ele ? 1 : 0) + (men ? 1 : 0);
      if (sphereCount === 1) {
        // Single-sphere: 75% to hybrids containing this sphere, 50% to the other hybrid
        hES += Math.floor(spr * 0.75) + Math.floor(ele * 0.75) + Math.floor(men * 0.5);
        hMS += Math.floor(spr * 0.75) + Math.floor(men * 0.75) + Math.floor(ele * 0.5);
        hME += Math.floor(ele * 0.75) + Math.floor(men * 0.75) + Math.floor(spr * 0.5);
      } else {
        // Multi-sphere: check if spell's circle has a native hybrid
        const native = getNativeHybridSpheres(row.circle);
        const isNativeES = native && native.includes("elemental") && native.includes("spiritual");
        const isNativeME = native && native.includes("elemental") && native.includes("mental");
        // Ele/Spr
        hES += isNativeES ? Math.ceil((spr + ele + men) / 2) : Math.floor((spr + ele) / 2);
        // Men/Spr
        hMS += Math.floor((spr + men) / 2);
        // Men/Ele
        hME += isNativeME ? Math.ceil((spr + ele + men) / 2) : Math.floor((ele + men) / 2);
      }
    }
    return { td_hybrid_ele_spr: hES, td_hybrid_men_spr: hMS, td_hybrid_men_ele: hME };
  }

  const METRIC_LABELS = {
    non_bolt_ds: "Non-Bolt DS",
    bolt_ds: "Bolt DS",
    as_physical: "Physical AS",
    as_bolt: "Bolt AS",
    td_spiritual: "Spiritual TD",
    td_elemental: "Elemental TD",
    td_mental: "Mental TD",
    cs_spiritual: "Spiritual CS",
    cs_elemental: "Elemental CS",
    cs_mental: "Mental CS",
    cs_sorcerer: "Sorcerer CS",
    cs_bard: "Bard CS",
  };

  const OTHER_LABELS = {
    dodge_ranks: "Dodge Ranks",
    uaf: "UAF",
    strength_bonus: "Strength Bonus",
  };

  const ALL_LABELS = { ...METRIC_LABELS, ...OTHER_LABELS };

  function init({
    storage,
    spellsData,
    societiesData,
    logic,
    windowObject,
    localStorageObject,
  }) {
    const profileSelect = document.getElementById("profileSelectCalc");
    const profileLoad = document.getElementById("profileLoadCalc");
    const profileReload = document.getElementById("profileReloadCalc");
    const profileStatus = document.getElementById("spellProfileStatus");
    const profileProfession = document.getElementById("spellProfileProfession");
    const profileLevel = document.getElementById("spellProfileLevel");
    const profileSociety = document.getElementById("spellProfileSociety");
    const profileSocietyRank = document.getElementById("spellProfileSocietyRank");
    const profileInputStatus = document.getElementById("profileInputStatus");
    const spellHelperActions = document.getElementById("spellHelperActions");
    const spellHelperStatus = document.getElementById("spellHelperStatus");
    const profileInputCoreTable = document.getElementById("profileInputCoreTable");
    const profileInputSpellRanksTable = document.getElementById("profileInputSpellRanksTable");
    const profileInputLoreTable = document.getElementById("profileInputLoreTable");
    const activeSpellCount = document.getElementById("activeSpellCount");
    const selfCastBin = document.getElementById("selfCastBin");
    const outsideBin = document.getElementById("outsideBin");
    const selfCastItems = document.getElementById("selfCastItems");
    const outsideItems = document.getElementById("outsideItems");
    const spellTable = document.getElementById("spellSelectionTable");
    const showSelectedCheckbox = document.getElementById("spellShowSelected");
    const societyToggle = document.getElementById("societySelectionToggle");
    const societyMetaPanel = document.getElementById("societyMetaPanel");
    const societyRankCurrent = document.getElementById("societyRankCurrent");
    const societyRankWhatIf = document.getElementById("societyRankWhatIf");
    const societyStatus = document.getElementById("societySelectionStatus");
    const societyTable = document.getElementById("societySelectionTable");
    const totalsTable = document.getElementById("spellEffectTable");
    const otherTable = document.getElementById("spellOtherEffectTable");
    const spellEffectStatus = document.getElementById("spellEffectStatus");
    const clearButton = document.getElementById("spellSelectionClear");
    const loadoutSelect = document.getElementById("loadoutSelect");
    const loadoutApply = document.getElementById("loadoutApply");
    const loadoutDelete = document.getElementById("loadoutDelete");
    const loadoutName = document.getElementById("loadoutName");
    const loadoutSave = document.getElementById("loadoutSave");
    const loadoutStatus = document.getElementById("loadoutStatus");

    let profiles = [];
    let selectedProfile = null;
    let castModesByKey = {};
    let factorOverrides = {};
    let baseFactorOverrides = {};
    let professionOverride = "";
    let openCircles = {};
    let activeSocietyKey = "";
    let activeSocietyAbilityKeys = {};
    let societyCurrentRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
    let societyWhatIfRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
    const calculatorSpells = (spellsData.buff_spells || []).filter((spell) => spell.calculator_relevant);
    const societyConfig = {
      col: { label: "Council of Light", rankKey: "col_rank", max: societiesData?.col?.max_rank || 20 },
      voln: { label: "Order of Voln", rankKey: "voln_step", max: societiesData?.voln?.max_rank || 26 },
      sunfist: { label: "Guardians of Sunfist", rankKey: "sunfist_rank", max: societiesData?.sunfist?.max_rank || 20 },
    };

    function normalizeText(value) {
      return String(value || "").trim().toLowerCase();
    }

    function titleCaseProfession(value) {
      const normalized = normalizeText(value);
      if (!normalized) return "";
      return normalized.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    }

    function availableProfessionOptions() {
      const sharedProfessions = Array.isArray(globalThis.GS4_DATA?.professions)
        ? globalThis.GS4_DATA.professions.map((entry) => ({
            value: normalizeText(entry?.name || entry),
            label: entry?.name || titleCaseProfession(entry),
          }))
        : [];
      const values = new Map(sharedProfessions.map((entry) => [entry.value, entry]));
      if (selectedProfile?.profession) {
        const value = normalizeText(selectedProfile.profession);
        if (value) values.set(value, { value, label: selectedProfile.profession });
      }
      return Array.from(values.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    function getEffectiveLevel() {
      if (Object.prototype.hasOwnProperty.call(baseFactorOverrides, "level")) return logic.asInteger(baseFactorOverrides.level, 0);
      return Number.isFinite(Number(selectedProfile?.level)) ? Number(selectedProfile.level) : 0;
    }

    function spellRankIndex(spell) {
      return Number(spell?.id || 0) % 100;
    }

    function getKnownSpellIdsFromProfile() {
      if (!selectedProfile || !Array.isArray(selectedProfile.skills)) return [];
      const level = getEffectiveLevel();
      const known = new Set();
      calculatorSpells.forEach((spell) => {
        const skill = selectedProfile.skills.find((entry) => normalizeText(entry?.name) === normalizeText(spell.circle));
        const trainedRanks = Number(skill?.finalRanks || skill?.ranks || 0);
        const knownRanks = Math.max(0, Math.min(trainedRanks, level));
        if (knownRanks > 0 && spellRankIndex(spell) <= knownRanks) known.add(spell.id);
      });
      return Array.from(known);
    }

    function getNativeProfessionCircle() {
      const profession = professionOverride || normalizeText(selectedProfile?.profession);
      const professionLabel = titleCaseProfession(profession);
      if (calculatorSpells.some((spell) => spell.circle === professionLabel)) return professionLabel;
      if (profession === "monk") return "Minor Mental";
      return "";
    }

    function getProfessionCircleSpellIds() {
      const circle = getNativeProfessionCircle();
      const level = getEffectiveLevel();
      if (!circle) return [];
      return calculatorSpells.filter((spell) => spell.circle === circle && spellRankIndex(spell) <= level).map((spell) => spell.id);
    }

    function getProfessionKnowsSpellIds() {
      const profession = professionOverride || normalizeText(selectedProfile?.profession);
      const professionLabel = titleCaseProfession(profession);
      const circles = globalThis.GS4_DATA?.professionSpellCircleMap?.[professionLabel];
      const level = getEffectiveLevel();
      if (!circles || typeof circles.has !== "function") return [];
      return calculatorSpells.filter((spell) => circles.has(spell.circle) && spellRankIndex(spell) <= level).map((spell) => spell.id);
    }

    function applyHelperPreset(action) {
      const previous = { ...castModesByKey };
      if (action === "clear") {
        castModesByKey = {};
        if (spellHelperStatus) spellHelperStatus.textContent = "Helper selections cleared.";
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "known_spells") {
        const ids = new Set(getKnownSpellIdsFromProfile());
        calculatorSpells.forEach((spell) => {
          if (!ids.has(spell.id) || spell.temporary) return;
          castModesByKey[spell.key] = modeOptionsForSpell(spell).some((o) => o.value === "self") ? "self" : "off";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = ids.size
          ? `Applied self-cast to ${ids.size} known spell entries clipped to current level (temporary spells excluded).`
          : "No known spell entries found from the loaded profile.";
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "profession_circle") {
        const ids = new Set(getProfessionCircleSpellIds());
        calculatorSpells.forEach((spell) => {
          if (!ids.has(spell.id) || spell.temporary) return;
          castModesByKey[spell.key] = modeOptionsForSpell(spell).some((o) => o.value === "self") ? "self" : "off";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = ids.size
          ? `Applied self-cast to ${ids.size} profession-circle spell entries clipped to current level (temporary spells excluded).`
          : "No profession-circle spell entries available for the selected profession and level.";
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "profession_knows") {
        const ids = new Set(getProfessionKnowsSpellIds());
        calculatorSpells.forEach((spell) => {
          if (!ids.has(spell.id) || spell.temporary) return;
          castModesByKey[spell.key] = modeOptionsForSpell(spell).some((o) => o.value === "self") ? "self" : "off";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = ids.size
          ? `Applied self-cast to ${ids.size} profession-accessible spell entries clipped to current level (temporary spells excluded).`
          : "No profession-accessible spell entries available for the selected profession and level.";
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "add_society") {
        if (!activeSocietyKey || !societiesData?.[activeSocietyKey]) {
          if (spellHelperStatus) spellHelperStatus.textContent = "Select a society first.";
          return;
        }
        logic.getCombatRelevantSocietyAbilities(societiesData[activeSocietyKey]).forEach((ability) => {
          activeSocietyAbilityKeys[`${activeSocietyKey}:${ability.id}`] = true;
        });
        if (spellHelperStatus) spellHelperStatus.textContent = `Enabled combat-relevant ${societyConfig[activeSocietyKey].label} abilities.`;
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "dreavening") {
        calculatorSpells.forEach((spell) => {
          const current = castModesByKey[spell.key] || "off";
          if (current !== "off" || spell.temporary) return;
          const options = modeOptionsForSpell(spell).map((option) => option.value);
          if (options.includes("outside")) castModesByKey[spell.key] = "outside";
          else if (options.includes("group")) castModesByKey[spell.key] = "group";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = "Applied Outside/Group to all sharable calculator-relevant spells (temporary spells excluded).";
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "add_temporary") {
        const profession = professionOverride || normalizeText(selectedProfile?.profession);
        const professionLabel = titleCaseProfession(profession);
        const circles = globalThis.GS4_DATA?.professionSpellCircleMap?.[professionLabel];
        if (!circles || typeof circles.has !== "function") {
          if (spellHelperStatus) spellHelperStatus.textContent = "Select a profession to add temporary spells.";
          return;
        }
        let count = 0;
        calculatorSpells.forEach((spell) => {
          if (!spell.temporary || !circles.has(spell.circle)) return;
          const current = castModesByKey[spell.key] || "off";
          if (current !== "off") return;
          castModesByKey[spell.key] = modeOptionsForSpell(spell).some((o) => o.value === "self") ? "self" : "outside";
          count++;
        });
        if (spellHelperStatus) spellHelperStatus.textContent = count
          ? `Added ${count} temporary spells for ${professionLabel}.`
          : "No additional temporary spells available for this profession.";
        renderAll({ renderInputs: false });
        return;
      }
      const preset = spellsData.quick_select_presets?.[action];
      if (!preset) {
        castModesByKey = previous;
        return;
      }
      const ids = new Set((preset.aliasOf ? spellsData.quick_select_presets?.[preset.aliasOf]?.spellIds : preset.spellIds) || []);
      calculatorSpells.forEach((spell) => {
        if (!ids.has(spell.id)) return;
        const options = modeOptionsForSpell(spell).map((option) => option.value);
        if (options.includes(preset.castMode)) castModesByKey[spell.key] = preset.castMode;
      });
      if (spellHelperStatus) spellHelperStatus.textContent = `Applied ${preset.label} preset.`;
      renderAll({ renderInputs: false });
    }

    function setStatus(message, tone = "") {
      if (!profileStatus) return;
      profileStatus.textContent = message;
      profileStatus.style.color = tone === "error" ? "#b42318" : "";
    }

    function renderProfileSummary() {
      if (profileProfession) {
        const currentOptions = availableProfessionOptions();
        profileProfession.innerHTML = '<option value="">Select Profession</option>' + currentOptions
          .map((option) => `<option value="${option.value}">${option.label}</option>`)
          .join("");
        const profileProfessionValue = normalizeText(selectedProfile?.profession);
        const activeValue = professionOverride || profileProfessionValue;
        profileProfession.value = activeValue || "";
      }
      if (profileLevel) {
        const profileLevelValue = Number.isFinite(Number(selectedProfile?.level))
          ? Number(selectedProfile.level)
          : 0;
        const activeLevel = Object.prototype.hasOwnProperty.call(baseFactorOverrides, "level")
          ? logic.asInteger(baseFactorOverrides.level, profileLevelValue)
          : profileLevelValue;
        profileLevel.value = String(activeLevel);
      }
      if (profileSociety) {
        profileSociety.value = activeSocietyKey || "";
      }
      if (profileSocietyRank) {
        const rankKey = activeSocietyKey ? societyConfig[activeSocietyKey]?.rankKey : "";
        profileSocietyRank.value = rankKey ? String(societyCurrentRanks[rankKey] || 0) : "0";
        profileSocietyRank.disabled = !activeSocietyKey;
      }
    }

    function refreshProfileSelect() {
      profiles = storage.loadProfiles();
      profileSelect.innerHTML = '<option value="">Select from Profile</option>';
      profiles.forEach((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        profileSelect.appendChild(option);
      });
      const selectedId = localStorageObject.getItem(storage.SELECTED_PROFILE_KEY) || "";
      if (selectedId && profiles.some((profile) => profile.id === selectedId)) {
        profileSelect.value = selectedId;
      }
    }

    function modeOptionsForSpell(spell) {
      if (spell.cast_scope === "self_only" || spell.cast_scope === "self_limited") {
        return [
          { value: "off", label: "Off" },
          { value: "self", label: "Self" },
        ];
      }
      if (spell.cast_scope === "self_or_group") {
        return [
          { value: "off", label: "Off" },
          { value: "group", label: "Group" },
          { value: "self", label: "Self" },
        ];
      }
      return [
        { value: "off", label: "Off" },
        { value: "outside", label: "Outside" },
        { value: "self", label: "Self" },
      ];
    }

    function getResults() {
      const currentFactorOverrides = {
        ...baseFactorOverrides,
        ...(activeSocietyKey
          ? { [societyConfig[activeSocietyKey].rankKey]: societyCurrentRanks[societyConfig[activeSocietyKey].rankKey] || 0 }
          : {}),
      };
      const whatIfFactorOverrides = {
        ...currentFactorOverrides,
        ...factorOverrides,
        ...(activeSocietyKey
          ? { [societyConfig[activeSocietyKey].rankKey]: societyWhatIfRanks[societyConfig[activeSocietyKey].rankKey] || 0 }
          : {}),
      };
      return logic.calculateTotals({
        spellsData,
        societiesData,
        profile: selectedProfile || {},
        castModesByKey,
        activeSocietyKey,
        activeSocietyAbilityKeys,
        currentFactorOverrides,
        whatIfFactorOverrides,
      });
    }

    function getProfileInputGroups() {
      const definitions = spellsData.factor_definitions || {};
      const entries = Object.entries(definitions).map(([key, definition]) => ({ key, ...definition }));
      return {
        core: entries.filter((factor) => factor.key === "level"),
        spellRanks: entries.filter((factor) => factor.key !== "level" && factor.key.endsWith("_ranks") && !factor.key.includes("lore")),
        lores: entries.filter((factor) => factor.key.includes("lore")),
      };
    }

    function renderProfileInputRows(target, factors, results) {
      if (!target) return;
      target.innerHTML = "";
      factors.forEach((factor) => {
        const row = document.createElement("tr");
        const currentValue = results.currentFactorValues[factor.key]
          ?? logic.getFactorValue(selectedProfile || {}, factor, null);
        const whatIfValue = results.whatIfFactorValues[factor.key] ?? currentValue;
        row.innerHTML = `
          <td>${factor.label}</td>
          <td>${currentValue}</td>
          <td><input type="number" step="1" value="${whatIfValue}" data-factor-key="${factor.key}" /></td>
        `;
        target.appendChild(row);
      });
    }

    function renderProfileInputs(results) {
      const groups = getProfileInputGroups();
      renderProfileInputRows(profileInputCoreTable, groups.core, results);
      renderProfileInputRows(profileInputSpellRanksTable, groups.spellRanks, results);
      renderProfileInputRows(profileInputLoreTable, groups.lores, results);
      profileInputStatus.textContent = selectedProfile
        ? `Loaded from ${selectedProfile.name}. Current values come from the profile; What-If overrides are local to this page.`
        : "No profile selected. Current values default to 0 until you load a profile or use What-If overrides.";
    }

    function formatDynamicTotals(dynamicTotals) {
      const parts = [];
      Object.entries(ALL_LABELS).forEach(([key, label]) => {
        const value = Number(dynamicTotals?.[key] || 0);
        if (!value) return;
        parts.push(`${value >= 0 ? "+" : ""}${value} ${label}`);
      });
      return parts.join(", ") || "—";
    }

    function formatSignedValue(value) {
      const numeric = Number(value || 0);
      return `${numeric >= 0 ? "+" : ""}${numeric}`;
    }

    function getRuleSummaryForMetric(spell, metricKey) {
      const rules = (spell.self_cast_dynamic?.rules || []).filter((rule) => (rule.modifierKeys || []).includes(metricKey));
      if (!rules.length) return { short: "—", full: "", factorKeys: [] };
      const factorKeys = [];
      rules.forEach((rule) => {
        if (rule.factor) factorKeys.push(rule.factor);
        if (rule.cap_factor) factorKeys.push(rule.cap_factor);
      });
      const uniqueFactorKeys = Array.from(new Set(factorKeys));
      const factorLabels = uniqueFactorKeys
        .map((key) => spellsData.factor_definitions?.[key]?.label || key || "")
        .filter(Boolean);
      return {
        short: factorLabels.join(" + ") || "Modeled",
        full: rules.map((rule) => rule.note).filter(Boolean).join("; "),
        factorKeys: uniqueFactorKeys,
      };
    }

    function escapeAttribute(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function renderScalingCell(ruleSummary) {
      return ruleSummary.short;
    }

    function getSpellFactorBlock(spell, results) {
      const allRules = spell.self_cast_dynamic?.rules || [];
      if (!allRules.length) return "";
      const factorKeys = [];
      allRules.forEach((rule) => {
        if (rule.factor) factorKeys.push(rule.factor);
        if (rule.cap_factor) factorKeys.push(rule.cap_factor);
      });
      const uniqueFactorKeys = Array.from(new Set(factorKeys)).sort((a, b) => (a === "level" ? -1 : b === "level" ? 1 : 0));
      if (!uniqueFactorKeys.length) return "";
      const notes = allRules.map((rule) => rule.note).filter(Boolean).join("; ");
      const items = uniqueFactorKeys.map((factorKey) => {
        const definition = spellsData.factor_definitions?.[factorKey];
        const label = definition?.label || factorKey;
        const currentValue = Number(results.currentFactorValues?.[factorKey] || 0);
        const whatIfValue = Number(results.whatIfFactorValues?.[factorKey] ?? currentValue);
        const inlineInputId = `${spell.key}:factors:${factorKey}`;
        return `
          <label class="spell-scaling-factor">
            <span class="spell-scaling-tag" data-tooltip="${escapeAttribute(notes)}">${label}:</span>
            <span class="spell-scaling-factor-current">${currentValue}</span>
            <input
              type="number"
              step="1"
              class="spell-scaling-input"
              value="${whatIfValue}"
              data-inline-factor-key="${factorKey}"
              data-inline-input-id="${inlineInputId}"
              aria-label="${label} What-If"
            />
          </label>
        `;
      }).join("");
      const header = `
        <div class="spell-scaling-factor spell-scaling-factor-header">
          <span></span>
          <span class="spell-scaling-col-label">Current</span>
          <span class="spell-scaling-col-label">What-If</span>
        </div>`;
      return `<div class="spell-scaling-block"><div class="spell-scaling-list">${header}${items}</div></div>`;
    }

    function getSpellMetricRows(spell, selfTotals, selfWhatIfTotals, outsideTotals, outsideAvailable, results) {
      const keys = Object.keys(ALL_LABELS).filter((key) => {
        const base = Number(spell.modifiers?.[key] || 0);
        const selfCurrent = Number(selfTotals?.[key] || 0);
        const selfWhatIf = Number(selfWhatIfTotals?.[key] || 0);
        const outside = Number(outsideTotals?.[key] || 0);
        const hasRule = (spell.self_cast_dynamic?.rules || []).some((rule) => (rule.modifierKeys || []).includes(key));
        return base || selfCurrent || selfWhatIf || outside || hasRule;
      });

      return keys.map((key) => {
        const base = Number(spell.modifiers?.[key] || 0);
        const ruleSummary = getRuleSummaryForMetric(spell, key);
        const hasDynamicRule = ruleSummary.short !== "—";
        const scalingCell = renderScalingCell(ruleSummary);
        const selfWhatIfCell = hasDynamicRule
          ? formatSignedValue(selfWhatIfTotals?.[key] || 0)
          : "N/A";
        return `
          <tr>
            <td>${ALL_LABELS[key]}</td>
            <td>${scalingCell}</td>
            <td class="spell-self-col">${formatSignedValue(selfTotals?.[key] || 0)}</td>
            <td class="spell-self-whatif-col">${selfWhatIfCell}</td>
            <td class="spell-outside-col">${outsideAvailable ? formatSignedValue(outsideTotals?.[key] || 0) : "—"}</td>
          </tr>
        `;
      }).join("");
    }

    function renderSpellTable(results) {
      const nextOpenCircles = {};
      spellTable.querySelectorAll(".spell-circle-section").forEach((details) => {
        const circle = details.dataset.circle;
        if (!circle) return;
        nextOpenCircles[circle] = details.open;
      });
      openCircles = nextOpenCircles;
      spellTable.innerHTML = "";
      const currentRowsByKey = new Map(results.currentSpellRows.map((row) => [row.spell.key, row]));
      const spellsByCircle = new Map();
      calculatorSpells.forEach((spell) => {
        if (!spellsByCircle.has(spell.circle)) spellsByCircle.set(spell.circle, []);
        spellsByCircle.get(spell.circle).push(spell);
      });

      spellsByCircle.forEach((spells, circle) => {
        const details = document.createElement("details");
        details.className = "collapsible-section spell-circle-section";
        details.dataset.circle = circle;
        details.open = Boolean(openCircles[circle]);
        details.addEventListener("toggle", () => {
          openCircles[circle] = details.open;
        });

        const summary = document.createElement("summary");
        summary.textContent = circle;
        details.appendChild(summary);

        const body = document.createElement("div");
        body.className = "collapsible-body";

        const table = document.createElement("table");
        table.innerHTML = `
        <thead>
          <tr>
            <th>Spell</th>
            <th>Details</th>
          </tr>
          </thead>
        `;
        const tbody = document.createElement("tbody");

        spells.forEach((spell) => {
          const row = document.createElement("tr");
          const currentMode = castModesByKey[spell.key] || "off";
          const selfTotals = logic.calculateSpellModifiers(spell, "self", results.currentFactorValues, spellsData);
          const selfWhatIfTotals = logic.calculateSpellModifiers(spell, "self", results.whatIfFactorValues, spellsData);
          const outsideAvailable = !(spell.cast_scope === "self_only" || spell.cast_scope === "self_limited");
          const isGroupSpell = spell.cast_scope === "self_or_group";
          const outsideTotals = outsideAvailable
            ? logic.calculateSpellModifiers(spell, isGroupSpell ? "group" : "outside", results.currentFactorValues, spellsData)
            : null;
          const otherColLabel = isGroupSpell ? "Group" : "Outside";
          const factorBlock = getSpellFactorBlock(spell, results);
          const detailsTable = `
            ${factorBlock}
            <table class="spell-metric-table">
              <colgroup>
                <col class="spell-metric-col" />
                <col class="spell-scaling-col" />
                <col class="spell-self-col" />
                <col class="spell-self-whatif-col" />
                <col class="spell-outside-col" />
              </colgroup>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Scaling</th>
                  <th class="spell-self-col">Self</th>
                  <th class="spell-self-whatif-col">(What-If)</th>
                  <th class="spell-outside-col">${otherColLabel}</th>
                </tr>
              </thead>
              <tbody>
                ${getSpellMetricRows(spell, selfTotals, selfWhatIfTotals, outsideTotals, outsideAvailable, results)}
              </tbody>
            </table>
          `;
          row.innerHTML = `
            <td>
              <div class="spell-entry">
                <div class="spell-entry-name"><strong>${spell.id}</strong>: ${spell.name}</div>
                <div class="spell-mode-toggle" role="group" aria-label="${spell.name} cast mode">
                  ${modeOptionsForSpell(spell).map((option) => `
                    <button type="button" tabindex="-1" class="btn tiny ghost${currentMode === option.value ? " is-active" : ""}" data-spell-key="${spell.key}" data-spell-mode="${option.value}">${option.label}</button>
                  `).join("")}
                </div>
                <div class="spell-entry-effect">${spell.effect_text}</div>
              </div>
            </td>
            <td>${detailsTable}</td>
          `;
          const active = currentRowsByKey.get(spell.key);
          if (active && active.castMode !== "off") row.classList.add("is-selected");
          tbody.appendChild(row);
        });

        table.appendChild(tbody);
        body.appendChild(table);
        details.appendChild(body);
        spellTable.appendChild(details);
      });
      applySelectedFilter();
    }

    function applySelectedFilter() {
      if (!spellTable) return;
      const filterOn = showSelectedCheckbox?.checked || false;
      spellTable.classList.toggle("show-selected-only", filterOn);
      spellTable.querySelectorAll(".spell-circle-section").forEach((section) => {
        if (!filterOn) {
          section.hidden = false;
          return;
        }
        const hasSelected = section.querySelector("tr.is-selected") !== null;
        section.hidden = !hasSelected;
        if (hasSelected) section.open = true;
      });
    }

    function renderSocietySelection(results) {
      if (!societyToggle || !societyTable || !societyStatus || !societyMetaPanel || !societyRankCurrent || !societyRankWhatIf) return;

      Array.from(societyToggle.querySelectorAll("[data-society-key]")).forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;
        button.classList.toggle("is-active", (button.dataset.societyKey || "") === activeSocietyKey);
      });

      if (!activeSocietyKey) {
        societyMetaPanel.hidden = true;
        societyTable.innerHTML = "";
        societyStatus.textContent = "Select a society to include combat-relevant society abilities.";
        return;
      }

      const config = societyConfig[activeSocietyKey];
      const societyData = societiesData?.[activeSocietyKey];
      const relevantAbilities = logic.getCombatRelevantSocietyAbilities(societyData);
      societyMetaPanel.hidden = false;
      societyRankCurrent.max = String(config.max);
      societyRankWhatIf.max = String(config.max);
      societyRankCurrent.value = String(societyCurrentRanks[config.rankKey] || 0);
      societyRankWhatIf.value = String(societyWhatIfRanks[config.rankKey] || 0);
      societyStatus.textContent = `${config.label}: combat-relevant abilities only. One society is active at a time.`;

      const currentRowsByKey = new Map((results.currentSocietyRows || []).map((row) => [row.ability.id, row]));
      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>Use</th>
            <th>Ability</th>
            <th>Effect</th>
            <th>Scaling</th>
          </tr>
        </thead>
      `;
      const tbody = document.createElement("tbody");

      relevantAbilities.forEach((ability) => {
        const abilityKey = `${activeSocietyKey}:${ability.id}`;
        const row = document.createElement("tr");
        const enabled = Boolean(activeSocietyAbilityKeys[abilityKey]);
        const dynamicNotes = (ability.dynamic_rules || [])
          .map((rule) => {
            if (rule.metric === "target_debuff") return "";
            if (rule.type === "per_rank") return `+${rule.amount_per_rank || 0} ${rule.metric} per rank`;
            if (rule.type === "per_n_ranks") return `+${rule.amount_per_step || 1} ${rule.metric} per ${rule.divisor || 1} ranks`;
            return "";
          })
          .filter(Boolean)
          .join("; ");
        row.innerHTML = `
          <td>
            <div class="spell-mode-toggle" role="group" aria-label="${ability.name} use">
              <button type="button" class="btn tiny ghost${enabled ? "" : " is-active"}" data-society-ability-key="${abilityKey}" data-society-enabled="off">Off</button>
              <button type="button" class="btn tiny ghost${enabled ? " is-active" : ""}" data-society-ability-key="${abilityKey}" data-society-enabled="on">On</button>
            </div>
          </td>
          <td><strong>${ability.name}</strong></td>
          <td>${ability.effect_summary || "—"}</td>
          <td>${dynamicNotes || "—"}</td>
        `;
        if (currentRowsByKey.has(ability.id)) row.classList.add("is-selected");
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      societyTable.innerHTML = "";
      societyTable.appendChild(table);
    }

    function buildTotalsRows(totalMap, labels) {
      return Object.entries(labels).map(([key, label]) => {
        const value = Number(totalMap?.[key] || 0);
        return { key, label, value };
      });
    }

    const TARGET_LABELS = { undead: "vs Undead" };

    function renderTotalsTable(tableBody, currentTotals, whatIfTotals, labels, currentTargetedTotals, whatIfTargetedTotals) {
      tableBody.innerHTML = "";
      buildTotalsRows(currentTotals, labels).forEach((rowData) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${rowData.label}</td>
          <td>${rowData.value >= 0 ? "+" : ""}${rowData.value}</td>
          <td>${(Number(whatIfTotals?.[rowData.key] || 0)) >= 0 ? "+" : ""}${Number(whatIfTotals?.[rowData.key] || 0)}</td>
        `;
        tableBody.appendChild(row);
      });
      Object.entries(currentTargetedTotals || {}).forEach(([target, targetCurrentTotals]) => {
        const targetWhatIf = whatIfTargetedTotals?.[target] || {};
        const suffix = TARGET_LABELS[target] || target;
        buildTotalsRows(targetCurrentTotals, labels).forEach((rowData) => {
          if (!rowData.value && !Number(targetWhatIf[rowData.key] || 0)) return;
          const combinedCurrent = rowData.value + Number(currentTotals?.[rowData.key] || 0);
          const combinedWhatIf = Number(targetWhatIf[rowData.key] || 0) + Number(whatIfTotals?.[rowData.key] || 0);
          const row = document.createElement("tr");
          row.classList.add("targeted-row");
          row.innerHTML = `
            <td>${rowData.label} (${suffix})</td>
            <td>${combinedCurrent >= 0 ? "+" : ""}${combinedCurrent}</td>
            <td>${combinedWhatIf >= 0 ? "+" : ""}${combinedWhatIf}</td>
          `;
          tableBody.appendChild(row);
        });
      });
    }

    function spellChipLabel(spell) {
      return `${spell.id}`;
    }

    function renderBinItems(container, entries, bin) {
      if (!container) return;
      container.innerHTML = "";
      entries.forEach((entry) => {
        const chip = document.createElement("span");
        chip.className = "spell-chip";
        chip.draggable = true;
        chip.dataset.spellKey = entry.spell.key;
        chip.dataset.bin = bin;
        chip.title = `${entry.spell.id}: ${entry.spell.name}`;
        chip.innerHTML = `${spellChipLabel(entry.spell)}<button type="button" class="spell-chip-remove" tabindex="-1" data-remove-key="${entry.spell.key}" aria-label="Remove ${entry.spell.name}">\u00d7</button>`;
        container.appendChild(chip);
      });
    }

    function renderSocietyChips(container, entries) {
      if (!container) return;
      const enabledEntries = entries.filter((entry) => entry.enabled);
      enabledEntries.forEach((entry) => {
        const chip = document.createElement("span");
        chip.className = "spell-chip society-chip";
        const abilityKey = `${entry.societyKey}:${entry.ability.id}`;
        chip.title = entry.ability.name;
        chip.innerHTML = `${entry.ability.name}<button type="button" class="spell-chip-remove" tabindex="-1" data-remove-ability="${abilityKey}" aria-label="Remove ${entry.ability.name}">\u00d7</button>`;
        container.appendChild(chip);
      });
    }

    function renderSummary(results) {
      const activeEntries = results.activeSpellEntries || [];
      const selfCastEntries = activeEntries.filter((entry) => entry.castMode === "self");
      const outsideEntries = activeEntries.filter((entry) => entry.castMode === "outside" || entry.castMode === "group");
      const activeSociety = (results.activeSocietyEntries || []).filter((entry) => entry.enabled);
      const totalActive = activeEntries.length + activeSociety.length;
      if (activeSpellCount) activeSpellCount.textContent = String(totalActive);
      renderBinItems(selfCastItems, selfCastEntries, "self");
      renderSocietyChips(selfCastItems, results.activeSocietyEntries || []);
      renderBinItems(outsideItems, outsideEntries, "outside");
    }

    function getUniversalSocietyRows(results) {
      return (results.currentSocietyRows || []).filter((r) => !r.ability.target);
    }
    function getWhatIfUniversalSocietyRows(results) {
      return (results.whatIfSocietyRows || []).filter((r) => !r.ability.target);
    }

    function renderComputedSections(results) {
      renderSummary(results);
      renderSpellTable(results);
      renderSocietySelection(results);
      const universalSociety = getUniversalSocietyRows(results);
      const whatIfUniversalSociety = getWhatIfUniversalSocietyRows(results);
      const currentDisplay = applyTDCrossoverPerSpell({ ...results.currentTotals }, results.currentSpellRows, universalSociety);
      const whatIfDisplay = applyTDCrossoverPerSpell({ ...results.whatIfTotals }, results.whatIfSpellRows, whatIfUniversalSociety);
      Object.assign(currentDisplay, computeHybridTDSpellBuffs(results.currentSpellRows, universalSociety));
      Object.assign(whatIfDisplay, computeHybridTDSpellBuffs(results.whatIfSpellRows, whatIfUniversalSociety));
      renderTotalsTable(totalsTable, currentDisplay, whatIfDisplay, METRIC_LABELS, results.currentTargetedTotals, results.whatIfTargetedTotals);
      renderTotalsTable(otherTable, currentDisplay, whatIfDisplay, OTHER_LABELS, results.currentTargetedTotals, results.whatIfTargetedTotals);
      spellEffectStatus.textContent = results.relevantFactors.length
        ? "Current and What-If totals include modeled self-cast spell scaling and active society ability scaling where supported."
        : "Current and What-If totals currently reflect fixed spell and society modifiers only.";
      // Update CS/TD section with already-crossovered totals
      if (typeof globalThis.CsTdSection !== "undefined" && globalThis.CsTdSection.update) {
        globalThis.CsTdSection.update({ profile: selectedProfile, spellBuffTotals: currentDisplay, whatIfSpellBuffTotals: whatIfDisplay, crossoverApplied: true });
      }
    }

    function saveFocusedInput() {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.dataset.inlineInputId) {
        return active.dataset.inlineInputId;
      }
      if (active instanceof HTMLInputElement && active.dataset.factorKey) {
        return `profile:${active.dataset.factorKey}`;
      }
      return null;
    }

    function restoreFocusedInput(savedId) {
      if (!savedId) return;
      let target;
      if (savedId.startsWith("profile:")) {
        const key = savedId.slice(8);
        target = document.querySelector(`[data-factor-key="${key}"]`);
      } else {
        target = document.querySelector(`[data-inline-input-id="${savedId}"]`);
      }
      if (target instanceof HTMLInputElement) target.focus();
    }

    function renderAll(options = {}) {
      const { renderInputs = true, renderSociety = true } = options;
      const focusId = saveFocusedInput();
      const results = getResults();
      if (renderInputs) renderProfileInputs(results);
      if (!renderSociety) {
        renderSummary(results);
        renderSpellTable(results);
        const universalSoc = getUniversalSocietyRows(results);
        const whatIfUniversalSoc = getWhatIfUniversalSocietyRows(results);
        const curDisp = applyTDCrossoverPerSpell({ ...results.currentTotals }, results.currentSpellRows, universalSoc);
        const wiDisp = applyTDCrossoverPerSpell({ ...results.whatIfTotals }, results.whatIfSpellRows, whatIfUniversalSoc);
        Object.assign(curDisp, computeHybridTDSpellBuffs(results.currentSpellRows, universalSoc));
        Object.assign(wiDisp, computeHybridTDSpellBuffs(results.whatIfSpellRows, whatIfUniversalSoc));
        renderTotalsTable(totalsTable, curDisp, wiDisp, METRIC_LABELS);
        renderTotalsTable(otherTable, curDisp, wiDisp, OTHER_LABELS);
        spellEffectStatus.textContent = results.relevantFactors.length
          ? "Current and What-If totals include modeled self-cast spell scaling and active society ability scaling where supported."
          : "Current and What-If totals currently reflect fixed spell and society modifiers only.";
        if (typeof globalThis.CsTdSection !== "undefined" && globalThis.CsTdSection.update) {
          globalThis.CsTdSection.update({ profile: selectedProfile, spellBuffTotals: curDisp, whatIfSpellBuffTotals: wiDisp, crossoverApplied: true });
        }
        restoreFocusedInput(focusId);
        return;
      }
      renderComputedSections(results);
      restoreFocusedInput(focusId);
    }

    function loadSelectedProfile() {
      const selectedId = profileSelect.value || "";
      if (!selectedId) {
        selectedProfile = null;
        activeSocietyKey = "";
        societyCurrentRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
        societyWhatIfRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
        renderProfileSummary();
        renderLoadoutDropdown();
        setStatus("Select a profile to use profile-based spell rank factors.");
        renderAll();
        return;
      }
      selectedProfile = storage.findProfile(profiles, selectedId);
      if (!selectedProfile) {
        renderProfileSummary();
        renderLoadoutDropdown();
        setStatus("Selected profile not found.", "error");
        renderAll();
        return;
      }
      localStorageObject.setItem(storage.SELECTED_PROFILE_KEY, selectedProfile.id);
      factorOverrides = {};
      baseFactorOverrides = {};
      professionOverride = normalizeText(selectedProfile.profession);
      const loadedSocietyKey = String(selectedProfile?.society?.key || "").trim().toLowerCase();
      const loadedSocietyRank = Math.max(0, logic.asInteger(selectedProfile?.society?.rank, 0));
      if (loadedSocietyKey && societyConfig[loadedSocietyKey]) {
        activeSocietyKey = loadedSocietyKey;
        const rankKey = societyConfig[loadedSocietyKey].rankKey;
        societyCurrentRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0, [rankKey]: loadedSocietyRank };
        societyWhatIfRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0, [rankKey]: loadedSocietyRank };
      } else {
        activeSocietyKey = "";
        societyCurrentRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
        societyWhatIfRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
      }
      renderProfileSummary();
      renderLoadoutDropdown();
      setStatus(`Loaded profile: ${selectedProfile.name}`);
      renderAll();
    }

    profileLoad?.addEventListener("click", loadSelectedProfile);
    profileReload?.addEventListener("click", loadSelectedProfile);
    profileSelect?.addEventListener("change", loadSelectedProfile);

    profileProfession?.addEventListener("change", () => {
      professionOverride = normalizeText(profileProfession.value);
      renderProfileSummary();
    });

    function commitTopLevelLevelInput() {
      if (!profileLevel) return;
      baseFactorOverrides.level = logic.asInteger(profileLevel.value, 0);
      renderProfileSummary();
      renderAll();
    }

    profileLevel?.addEventListener("change", commitTopLevelLevelInput);
    profileLevel?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      commitTopLevelLevelInput();
    });

    profileSociety?.addEventListener("change", () => {
      activeSocietyKey = profileSociety.value || "";
      renderProfileSummary();
      renderAll({ renderInputs: false });
    });

    function commitTopLevelSocietyRank() {
      if (!profileSocietyRank || !activeSocietyKey) return;
      const config = societyConfig[activeSocietyKey];
      const clamped = logic.clamp(logic.asInteger(profileSocietyRank.value, 0), 0, config.max);
      societyCurrentRanks[config.rankKey] = clamped;
      profileSocietyRank.value = String(clamped);
      renderAll({ renderInputs: false });
    }

    profileSocietyRank?.addEventListener("change", commitTopLevelSocietyRank);
    profileSocietyRank?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      commitTopLevelSocietyRank();
    });
    clearButton?.addEventListener("click", () => {
      castModesByKey = {};
      factorOverrides = {};
      activeSocietyAbilityKeys = {};
      renderAll();
    });

    spellHelperActions?.addEventListener("click", (event) => {
      const button = event.target;
      if (!(button instanceof HTMLButtonElement)) return;
      const action = button.dataset.helperAction;
      if (!action) return;
      applyHelperPreset(action);
    });

    // Spell bin: remove chips
    [selfCastItems, outsideItems].forEach((bin) => {
      bin?.addEventListener("click", (event) => {
        const spellButton = event.target.closest("[data-remove-key]");
        if (spellButton) {
          const key = spellButton.dataset.removeKey;
          if (key) {
            castModesByKey[key] = "off";
            renderAll({ renderInputs: false });
          }
          return;
        }
        const abilityButton = event.target.closest("[data-remove-ability]");
        if (abilityButton) {
          const abilityKey = abilityButton.dataset.removeAbility;
          if (abilityKey) {
            delete activeSocietyAbilityKeys[abilityKey];
            renderAll({ renderInputs: false });
          }
        }
      });
    });

    // Spell bin: drag-and-drop between self/outside
    let dragSpellKey = null;

    [selfCastItems, outsideItems].forEach((items) => {
      if (!items) return;
      items.addEventListener("dragstart", (event) => {
        const chip = event.target.closest(".spell-chip");
        if (!chip) return;
        dragSpellKey = chip.dataset.spellKey;
        event.dataTransfer.effectAllowed = "move";
      });
    });

    [selfCastBin, outsideBin].forEach((bin) => {
      if (!bin) return;
      const binItems = bin.querySelector(".spell-bin-items");
      const binKey = binItems?.dataset.bin;
      bin.addEventListener("dragover", (event) => {
        if (!dragSpellKey) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        bin.classList.add("spell-bin-dragover");
      });
      bin.addEventListener("dragleave", (event) => {
        if (!bin.contains(event.relatedTarget)) {
          bin.classList.remove("spell-bin-dragover");
        }
      });
      bin.addEventListener("drop", (event) => {
        event.preventDefault();
        bin.classList.remove("spell-bin-dragover");
        if (!dragSpellKey || !binKey) return;
        const spell = calculatorSpells.find((s) => s.key === dragSpellKey);
        const options = spell ? modeOptionsForSpell(spell).map((o) => o.value) : [];
        if (options.includes(binKey)) {
          castModesByKey[dragSpellKey] = binKey;
          renderAll({ renderInputs: false });
        }
        dragSpellKey = null;
      });
    });

    document.addEventListener("dragend", () => {
      dragSpellKey = null;
      selfCastBin?.classList.remove("spell-bin-dragover");
      outsideBin?.classList.remove("spell-bin-dragover");
    });

    function commitProfileFactorInput(input) {
      const key = input.dataset.factorKey;
      if (!key) return;
      factorOverrides[key] = logic.asInteger(input.value, 0);
      renderAll();
    }

    [profileInputCoreTable, profileInputSpellRanksTable, profileInputLoreTable].forEach((table) => {
      table?.addEventListener("change", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;
        commitProfileFactorInput(input);
      });

      table?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;
        commitProfileFactorInput(input);
      });
    });

    showSelectedCheckbox?.addEventListener("change", () => {
      applySelectedFilter();
    });

    spellTable?.addEventListener("click", (event) => {
      const button = event.target;
      if (!(button instanceof HTMLButtonElement)) return;
      const key = button.dataset.spellKey;
      const mode = button.dataset.spellMode;
      if (!key || !mode) return;
      castModesByKey[key] = mode;
      renderAll();
    });

    function commitInlineFactorInput(input) {
      const key = input.dataset.inlineFactorKey;
      if (!key) return;
      factorOverrides[key] = logic.asInteger(input.value, 0);
      renderAll();
    }

    spellTable?.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      commitInlineFactorInput(input);
    });

    spellTable?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      commitInlineFactorInput(input);
    });

    societyToggle?.addEventListener("click", (event) => {
      const button = event.target;
      if (!(button instanceof HTMLButtonElement)) return;
      const societyKey = button.dataset.societyKey ?? "";
      activeSocietyKey = societyKey;
      renderProfileSummary();
      renderAll({ renderInputs: false });
    });

    societyTable?.addEventListener("click", (event) => {
      const button = event.target;
      if (!(button instanceof HTMLButtonElement)) return;
      const key = button.dataset.societyAbilityKey;
      const enabled = button.dataset.societyEnabled;
      if (!key || !enabled) return;
      activeSocietyAbilityKeys[key] = enabled === "on";
      renderAll();
    });

    function updateSocietyRank(input, bucket) {
      if (!input || !activeSocietyKey) return;
      const config = societyConfig[activeSocietyKey];
      const clamped = logic.clamp(logic.asInteger(input.value, 0), 0, config.max);
      bucket[config.rankKey] = clamped;
      input.value = String(clamped);
      if (bucket === societyCurrentRanks && profileSocietyRank) profileSocietyRank.value = String(clamped);
      renderAll({ renderInputs: false, renderSociety: false });
    }

    societyRankCurrent?.addEventListener("input", () => updateSocietyRank(societyRankCurrent, societyCurrentRanks));
    societyRankWhatIf?.addEventListener("input", () => updateSocietyRank(societyRankWhatIf, societyWhatIfRanks));

    function getProfileLoadouts() {
      if (!selectedProfile) return [];
      return Array.isArray(selectedProfile.spellLoadouts) ? selectedProfile.spellLoadouts : [];
    }

    function renderLoadoutDropdown() {
      if (!loadoutSelect) return;
      const loadouts = getProfileLoadouts();
      const currentValue = loadoutSelect.value || "";
      loadoutSelect.innerHTML = '<option value="">Select Loadout</option>';
      loadouts.forEach((loadout) => {
        const option = document.createElement("option");
        option.value = loadout.id;
        option.textContent = loadout.name;
        loadoutSelect.appendChild(option);
      });
      if (currentValue && loadouts.some((l) => l.id === currentValue)) {
        loadoutSelect.value = currentValue;
      }
      if (loadoutApply) loadoutApply.disabled = !loadoutSelect.value;
      if (loadoutDelete) loadoutDelete.disabled = !loadoutSelect.value;
    }

    function saveLoadoutToProfile(loadout) {
      if (!selectedProfile) return;
      const loadouts = getProfileLoadouts();
      const existingIndex = loadouts.findIndex(
        (entry) => String(entry.name || "").trim().toLowerCase() === String(loadout.name || "").trim().toLowerCase()
      );
      if (existingIndex >= 0) {
        loadouts[existingIndex] = loadout;
      } else {
        loadouts.push(loadout);
      }
      selectedProfile.spellLoadouts = loadouts;
      const allProfiles = storage.loadProfiles();
      const profileIndex = allProfiles.findIndex((p) => p.id === selectedProfile.id);
      if (profileIndex >= 0) {
        allProfiles[profileIndex].spellLoadouts = loadouts;
        storage.saveProfiles(allProfiles);
      }
    }

    function deleteLoadoutFromProfile(loadoutId) {
      if (!selectedProfile) return;
      const loadouts = getProfileLoadouts().filter((l) => l.id !== loadoutId);
      selectedProfile.spellLoadouts = loadouts;
      const allProfiles = storage.loadProfiles();
      const profileIndex = allProfiles.findIndex((p) => p.id === selectedProfile.id);
      if (profileIndex >= 0) {
        allProfiles[profileIndex].spellLoadouts = loadouts;
        storage.saveProfiles(allProfiles);
      }
    }

    loadoutSelect?.addEventListener("change", () => {
      if (loadoutApply) loadoutApply.disabled = !loadoutSelect.value;
      if (loadoutDelete) loadoutDelete.disabled = !loadoutSelect.value;
    });

    loadoutApply?.addEventListener("click", () => {
      const loadoutId = loadoutSelect?.value;
      if (!loadoutId) return;
      const loadout = getProfileLoadouts().find((l) => l.id === loadoutId);
      if (!loadout) return;
      const state = logic.applyLoadout(loadout);
      castModesByKey = state.castModesByKey;
      activeSocietyKey = state.activeSocietyKey;
      activeSocietyAbilityKeys = state.activeSocietyAbilityKeys;
      if (activeSocietyKey && societyConfig[activeSocietyKey]) {
        const rankKey = societyConfig[activeSocietyKey].rankKey;
        const profileRank = logic.asInteger(selectedProfile?.society?.rank, 0);
        societyCurrentRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0, [rankKey]: profileRank };
        societyWhatIfRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0, [rankKey]: profileRank };
      }
      renderAll();
      if (loadoutStatus) {
        loadoutStatus.textContent = `Applied loadout: ${loadout.name}`;
        loadoutStatus.style.color = "";
      }
    });

    loadoutSave?.addEventListener("click", () => {
      if (!selectedProfile) {
        if (loadoutStatus) {
          loadoutStatus.textContent = "Select a profile first to save loadouts.";
          loadoutStatus.style.color = "var(--error, #b42318)";
        }
        return;
      }
      const name = (loadoutName?.value || "").trim();
      const loadouts = getProfileLoadouts();
      const error = logic.validateLoadoutName(name, loadouts);
      if (error) {
        if (loadoutStatus) {
          loadoutStatus.textContent = error;
          loadoutStatus.style.color = "var(--error, #b42318)";
        }
        return;
      }
      const existing = loadouts.find(
        (entry) => String(entry.name || "").trim().toLowerCase() === name.toLowerCase()
      );
      const loadout = logic.createLoadout(name, castModesByKey, activeSocietyKey, activeSocietyAbilityKeys);
      if (existing) loadout.id = existing.id;
      saveLoadoutToProfile(loadout);
      renderLoadoutDropdown();
      loadoutSelect.value = loadout.id;
      if (loadoutApply) loadoutApply.disabled = false;
      if (loadoutDelete) loadoutDelete.disabled = false;
      if (loadoutName) loadoutName.value = "";
      if (loadoutStatus) {
        loadoutStatus.textContent = existing
          ? `Updated loadout: ${loadout.name}`
          : `Saved loadout: ${loadout.name}`;
        loadoutStatus.style.color = "";
      }
    });

    loadoutDelete?.addEventListener("click", () => {
      const loadoutId = loadoutSelect?.value;
      if (!loadoutId) return;
      const loadout = getProfileLoadouts().find((l) => l.id === loadoutId);
      if (!loadout) return;
      deleteLoadoutFromProfile(loadoutId);
      renderLoadoutDropdown();
      if (loadoutStatus) {
        loadoutStatus.textContent = `Deleted loadout: ${loadout.name}`;
        loadoutStatus.style.color = "";
      }
    });

    refreshProfileSelect();
    renderProfileSummary();
    loadSelectedProfile();
  }

  return { init };
});
