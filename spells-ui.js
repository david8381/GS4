(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SpellsUI = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
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
    const selfCastCount = document.getElementById("selfCastCount");
    const scalingCoverage = document.getElementById("scalingCoverage");
    const spellTable = document.getElementById("spellSelectionTable");
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
          if (!ids.has(spell.id)) return;
          castModesByKey[spell.key] = modeOptionsForSpell(spell).some((o) => o.value === "self") ? "self" : "off";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = ids.size
          ? `Applied self-cast to ${ids.size} known spell entries clipped to current level.`
          : "No known spell entries found from the loaded profile.";
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "profession_circle") {
        const ids = new Set(getProfessionCircleSpellIds());
        calculatorSpells.forEach((spell) => {
          if (!ids.has(spell.id)) return;
          castModesByKey[spell.key] = modeOptionsForSpell(spell).some((o) => o.value === "self") ? "self" : "off";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = ids.size
          ? `Applied self-cast to ${ids.size} profession-circle spell entries clipped to current level.`
          : "No profession-circle spell entries available for the selected profession and level.";
        renderAll({ renderInputs: false });
        return;
      }
      if (action === "profession_knows") {
        const ids = new Set(getProfessionKnowsSpellIds());
        calculatorSpells.forEach((spell) => {
          if (!ids.has(spell.id)) return;
          castModesByKey[spell.key] = modeOptionsForSpell(spell).some((o) => o.value === "self") ? "self" : "off";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = ids.size
          ? `Applied self-cast to ${ids.size} profession-accessible spell entries clipped to current level.`
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
          const options = modeOptionsForSpell(spell).map((option) => option.value);
          if (options.includes("outside")) castModesByKey[spell.key] = "outside";
        });
        if (spellHelperStatus) spellHelperStatus.textContent = "Applied Outside to all sharable calculator-relevant spells.";
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

    function renderScalingCell(spell, metricKey, ruleSummary, currentFactorValues, whatIfFactorValues) {
      if (!ruleSummary.factorKeys?.length) return ruleSummary.short;
      const items = ruleSummary.factorKeys.map((factorKey) => {
        const definition = spellsData.factor_definitions?.[factorKey];
        const label = definition?.label || factorKey;
        const currentValue = Number(currentFactorValues?.[factorKey] || 0);
        const whatIfValue = Number(whatIfFactorValues?.[factorKey] ?? currentValue);
        const inlineInputId = `${spell.key}:${metricKey}:${factorKey}`;
        return `
          <label class="spell-scaling-factor">
            <span class="spell-scaling-tag" tabindex="0" data-tooltip="${escapeAttribute(ruleSummary.full)}">${label}:</span>
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
      return `<div class="spell-scaling-list">${items}</div>`;
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
        const scalingCell = hasDynamicRule
          ? renderScalingCell(spell, key, ruleSummary, results.currentFactorValues, results.whatIfFactorValues)
          : ruleSummary.short;
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
          const outsideTotals = outsideAvailable
            ? logic.calculateSpellModifiers(spell, "outside", results.currentFactorValues, spellsData)
            : null;
          const detailsTable = `
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
                  <th>
                    <div class="spell-scaling-head">
                      <span class="spell-scaling-head-label">Scaling</span>
                      <span class="spell-scaling-head-current">Current</span>
                      <span class="spell-scaling-head-whatif">What if</span>
                    </div>
                  </th>
                  <th class="spell-self-col">Self</th>
                  <th class="spell-self-whatif-col">(What-If)</th>
                  <th class="spell-outside-col">Outside</th>
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
                    <button type="button" class="btn tiny ghost${currentMode === option.value ? " is-active" : ""}" data-spell-key="${spell.key}" data-spell-mode="${option.value}">${option.label}</button>
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

    function renderTotalsTable(tableBody, currentTotals, whatIfTotals, labels) {
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
    }

    function renderSummary(results) {
      const activeEntries = results.activeSpellEntries || [];
      const selfCastEntries = activeEntries.filter((entry) => entry.castMode === "self");
      activeSpellCount.textContent = String(activeEntries.length + (results.activeSocietyEntries || []).length);
      selfCastCount.textContent = String(selfCastEntries.length);
      const dynamicSelfCount = selfCastEntries.filter((entry) => Array.isArray(entry.spell.self_cast_dynamic?.rules) && entry.spell.self_cast_dynamic.rules.length).length;
      scalingCoverage.textContent = `${dynamicSelfCount} self-cast spells with modeled scaling`;
    }

    function renderComputedSections(results) {
      renderSummary(results);
      renderSpellTable(results);
      renderSocietySelection(results);
      renderTotalsTable(totalsTable, results.currentTotals, results.whatIfTotals, METRIC_LABELS);
      renderTotalsTable(otherTable, results.currentTotals, results.whatIfTotals, OTHER_LABELS);
      spellEffectStatus.textContent = results.relevantFactors.length
        ? "Current and What-If totals include modeled self-cast spell scaling and active society ability scaling where supported."
        : "Current and What-If totals currently reflect fixed spell and society modifiers only.";
    }

    function renderAll(options = {}) {
      const { renderInputs = true, renderSociety = true } = options;
      const results = getResults();
      if (renderInputs) renderProfileInputs(results);
      if (!renderSociety) {
        renderSummary(results);
        renderSpellTable(results);
        renderTotalsTable(totalsTable, results.currentTotals, results.whatIfTotals, METRIC_LABELS);
        renderTotalsTable(otherTable, results.currentTotals, results.whatIfTotals, OTHER_LABELS);
        spellEffectStatus.textContent = results.relevantFactors.length
          ? "Current and What-If totals include modeled self-cast spell scaling and active society ability scaling where supported."
          : "Current and What-If totals currently reflect fixed spell and society modifiers only.";
        return;
      }
      renderComputedSections(results);
    }

    function loadSelectedProfile() {
      const selectedId = profileSelect.value || "";
      if (!selectedId) {
        selectedProfile = null;
        activeSocietyKey = "";
        societyCurrentRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
        societyWhatIfRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };
        renderProfileSummary();
        setStatus("Select a profile to use profile-based spell rank factors.");
        renderAll();
        return;
      }
      selectedProfile = storage.findProfile(profiles, selectedId);
      if (!selectedProfile) {
        renderProfileSummary();
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

    refreshProfileSelect();
    renderProfileSummary();
    loadSelectedProfile();
  }

  return { init };
});
