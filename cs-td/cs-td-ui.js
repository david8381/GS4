(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CsTdUI = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  function init({ storage, gs4Data, csTdData, logic, spellsData, societiesData, spellsLogic }) {
    const profileSelect = document.getElementById("cstdProfileSelect");
    const profileLoad = document.getElementById("cstdProfileLoad");
    const profileStatus = document.getElementById("cstdProfileStatus");
    const inputTableBody = document.getElementById("cstdInputBody");
    const csOutputBody = document.getElementById("cstdCSBody");
    const tdOutputBody = document.getElementById("cstdTDBody");
    const loadoutSelect = document.getElementById("cstdLoadoutSelect");
    const loadoutApply = document.getElementById("cstdLoadoutApply");
    const targetToggle = document.getElementById("cstdTargetToggle");

    const races = gs4Data?.races || [];
    const professions = gs4Data?.professions || [];
    const professionCircleMap = gs4Data?.professionSpellCircleMap || {};

    let profiles = [];
    let selectedProfile = null;
    let whatIfOverrides = {};
    let raceOverride = "";
    let targetMode = "living";

    // Spell loadout state (read-only from saved loadouts)
    let loadoutCastModes = {};
    let loadoutSocietyKey = "";
    let loadoutSocietyAbilityKeys = {};
    let loadoutSocietyRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0 };

    const STAT_LABELS = {
      str: "Strength", con: "Constitution", dex: "Dexterity", agi: "Agility", dis: "Discipline",
      aur: "Aura", log: "Logic", int: "Intuition", wis: "Wisdom", inf: "Influence",
    };

    const armorAsgList = gs4Data?.armorAsg || [];

    function getArmorCvA(profile) {
      const asgKey = profile?.defaults?.armorAsg || "none";
      const entry = armorAsgList.find((a) => a.key === asgKey);
      if (!entry) return 25; // default to clothing
      return entry.cva;
    }

    const raceStatBonusModifiers = gs4Data?.raceStatBonusModifiers || {};
    const normalizeRace = (typeof GS4Util !== "undefined" && GS4Util.normalizeRaceForModifierLookup)
      ? GS4Util.normalizeRaceForModifierLookup
      : (r) => String(r || "");

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    // Compute the final stat bonus for a stat key, matching the profile page formula:
    //   finalBonus = statToBonus(clamp(baseStat + ascStat + enhStat, 1, 200)) + racial + ascBonus + enhBonus
    function computeStatBonus(statKey, profile, raceName) {
      const baseStat = Number(profile?.stats?.[statKey]?.base || 50);
      const ascStat = Math.max(0, Math.trunc(Number(profile?.ascension?.stats?.[statKey]?.stat) || 0));
      const ascBonus = Math.max(0, Math.trunc(Number(profile?.ascension?.stats?.[statKey]?.bonus) || 0));
      const enhStat = Math.max(0, Math.trunc(Number(profile?.enhancive?.stats?.[statKey]?.stat) || 0));
      const enhBonus = Math.max(0, Math.trunc(Number(profile?.enhancive?.stats?.[statKey]?.bonus) || 0));
      const finalStat = clamp(baseStat + ascStat + enhStat, 1, 200);
      const normalizedRace = normalizeRace(raceName);
      const racial = Number(raceStatBonusModifiers[normalizedRace]?.[statKey] || 0);
      return logic.statToBonus(finalStat) + racial + ascBonus + enhBonus;
    }

    // Build a stat bonus map { aur: 37, wis: 30, dis: 13, ... } for all relevant stats
    function buildStatBonuses(profile, raceName) {
      const bonuses = {};
      const relevantStats = getRelevantStats();
      relevantStats.forEach((statKey) => {
        bonuses[statKey] = computeStatBonus(statKey, profile, raceName);
      });
      return bonuses;
    }

    // Build what-if stat bonuses: use overridden bonus values where provided, else fall back to current bonuses.
    // When a stat is overridden, the user enters the bonus directly (matching what's shown in the current column).
    function buildWhatIfStatBonuses(raceName) {
      const bonuses = {};
      const relevantStats = getRelevantStats();
      relevantStats.forEach((statKey) => {
        const overrideKey = `stat_${statKey}`;
        if (whatIfOverrides[overrideKey] !== undefined) {
          bonuses[statKey] = Math.floor(Number(whatIfOverrides[overrideKey]) || 0);
        } else {
          // No override — use the full profile bonus (with ascension/enhancive) but with what-if race
          bonuses[statKey] = computeStatBonus(statKey, selectedProfile, raceName);
        }
      });
      return bonuses;
    }

    function getEffectiveProfession() {
      return selectedProfile?.profession || "";
    }

    function getProfessionCircles() {
      const prof = getEffectiveProfession();
      const titleCase = String(prof || "").split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      return professionCircleMap[titleCase] || new Set();
    }

    function getEffectiveLevel() {
      if (whatIfOverrides.level !== undefined) return Math.max(0, Math.floor(Number(whatIfOverrides.level) || 0));
      return Math.max(0, Math.floor(Number(selectedProfile?.level) || 0));
    }

    function getEffectiveStatValue(statKey) {
      if (whatIfOverrides[`stat_${statKey}`] !== undefined) {
        return Math.max(0, Math.floor(Number(whatIfOverrides[`stat_${statKey}`]) || 0));
      }
      const stat = selectedProfile?.stats?.[statKey];
      return Number(stat?.enhanced || stat?.base || 0);
    }

    function getEffectiveCircleRanks(circle) {
      const key = `circle_${circle}`;
      if (whatIfOverrides[key] !== undefined) {
        return Math.max(0, Math.floor(Number(whatIfOverrides[key]) || 0));
      }
      if (!selectedProfile?.skills) return 0;
      const skill = selectedProfile.skills.find((s) => s.name === circle);
      return Math.max(0, Math.floor(Number(skill?.finalRanks || skill?.ranks || 0)));
    }

    function getCurrentStatValue(statKey) {
      const stat = selectedProfile?.stats?.[statKey];
      return Number(stat?.enhanced || stat?.base || 0);
    }

    function getCurrentCircleRanks(circle) {
      if (!selectedProfile?.skills) return 0;
      const skill = selectedProfile.skills.find((s) => s.name === circle);
      return Math.max(0, Math.floor(Number(skill?.finalRanks || skill?.ranks || 0)));
    }

    function getCurrentLevel() {
      return Math.max(0, Math.floor(Number(selectedProfile?.level) || 0));
    }

    function getEffectiveRace() {
      if (raceOverride) return raceOverride;
      return selectedProfile?.race || "";
    }

    // Build profile-like object for "current" values
    function buildCurrentProfile() {
      const level = getCurrentLevel();
      const statMap = {};
      Object.keys(STAT_LABELS).forEach((key) => {
        const val = getCurrentStatValue(key);
        statMap[key] = { base: val, enhanced: val };
      });
      const skills = [];
      const circles = getProfessionCircles();
      circles.forEach((circle) => {
        const ranks = getCurrentCircleRanks(circle);
        skills.push({ name: circle, ranks, finalRanks: ranks });
      });
      return { level, stats: statMap, skills, race: selectedProfile?.race || "", profession: getEffectiveProfession() };
    }

    // Build profile-like object for "what-if" values
    function buildWhatIfProfile() {
      const level = getEffectiveLevel();
      const statMap = {};
      Object.keys(STAT_LABELS).forEach((key) => {
        const val = getEffectiveStatValue(key);
        statMap[key] = { base: val, enhanced: val };
      });
      const skills = [];
      const circles = getProfessionCircles();
      circles.forEach((circle) => {
        const ranks = getEffectiveCircleRanks(circle);
        skills.push({ name: circle, ranks, finalRanks: ranks });
      });
      return { level, stats: statMap, skills, race: getEffectiveRace(), profession: getEffectiveProfession() };
    }

    // Compute spell buff totals from loadout if available
    function getNativeHybridSpheres(circle) {
      const circleSphere = csTdData?.circleSphere;
      if (!circleSphere) return null;
      const sphere = circleSphere[circle];
      if (!sphere || !sphere.startsWith("hybrid:")) return null;
      return sphere.slice(7).split("+");
    }

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
          hES += Math.floor(spr * 0.75) + Math.floor(ele * 0.75) + Math.floor(men * 0.5);
          hMS += Math.floor(spr * 0.75) + Math.floor(men * 0.75) + Math.floor(ele * 0.5);
          hME += Math.floor(ele * 0.75) + Math.floor(men * 0.75) + Math.floor(spr * 0.5);
        } else {
          const native = getNativeHybridSpheres(row.circle);
          const isNativeES = native && native.includes("elemental") && native.includes("spiritual");
          const isNativeME = native && native.includes("elemental") && native.includes("mental");
          hES += isNativeES ? Math.ceil((spr + ele + men) / 2) : Math.floor((spr + ele) / 2);
          hMS += Math.floor((spr + men) / 2);
          hME += isNativeME ? Math.ceil((spr + ele + men) / 2) : Math.floor((ele + men) / 2);
        }
      }
      return { td_hybrid_ele_spr: hES, td_hybrid_men_spr: hMS, td_hybrid_men_ele: hME };
    }

    function getSpellBuffTotals(profileObj) {
      if (!spellsLogic || !spellsData) return {};
      const castModesByKey = loadoutCastModes;
      const hasActive = Object.values(castModesByKey).some((m) => m && m !== "off");
      if (!hasActive && !loadoutSocietyKey) return {};

      const result = spellsLogic.calculateTotals({
        spellsData,
        societiesData,
        profile: profileObj,
        castModesByKey,
        activeSocietyKey: loadoutSocietyKey,
        activeSocietyAbilityKeys: loadoutSocietyAbilityKeys,
        currentFactorOverrides: null,
        whatIfFactorOverrides: null,
      });
      const totals = result?.currentTotals || {};
      // Compute per-spell hybrid TD buffs
      const universalSociety = (result?.currentSocietyRows || []).filter((r) => !r.ability?.target);
      const hybridBuffs = computeHybridTDSpellBuffs(result?.currentSpellRows, universalSociety);
      Object.assign(totals, hybridBuffs);
      return totals;
    }

    // Determine which stats are relevant for the current profession
    function getRelevantStats() {
      const circles = getProfessionCircles();
      const needed = new Set();
      circles.forEach((circle) => {
        const mapping = csTdData.csStatByCircle[circle];
        if (mapping?.stats) mapping.stats.forEach((s) => needed.add(s));
      });
      // Always include TD stats
      Object.values(csTdData.tdStatBySphere).forEach((s) => needed.add(s));
      return needed;
    }

    // Describe what a stat affects
    function getStatAffects(statKey) {
      const affects = [];
      const circles = getProfessionCircles();
      circles.forEach((circle) => {
        const mapping = csTdData.csStatByCircle[circle];
        if (mapping?.stats?.includes(statKey)) affects.push(`${circle} CS`);
      });
      Object.entries(csTdData.tdStatBySphere).forEach(([sphere, sKey]) => {
        if (sKey === statKey) {
          const label = sphere.charAt(0).toUpperCase() + sphere.slice(1);
          affects.push(`${label} TD`);
        }
      });
      return affects.join(", ");
    }

    // Describe what a spell circle affects
    function getCircleAffects(circle) {
      return `${circle} CS`;
    }

    function saveFocusedInput() {
      const el = document.activeElement;
      if (el?.dataset?.inputKey) return el.dataset.inputKey;
      return null;
    }

    function restoreFocusedInput(key) {
      if (!key) return;
      const el = document.querySelector(`[data-input-key="${key}"]`);
      if (el) el.focus();
    }

    // --- Rendering ---

    function renderProfileDropdown() {
      profiles = storage.loadProfiles();
      if (!profileSelect) return;
      profileSelect.innerHTML = '<option value="">Select Profile</option>';
      const selectedId = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
      profiles.forEach((p) => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name || p.id;
        profileSelect.appendChild(option);
      });
      if (selectedId) profileSelect.value = selectedId;
    }

    function renderLoadoutDropdown() {
      if (!loadoutSelect) return;
      const loadouts = selectedProfile?.spellLoadouts || [];
      loadoutSelect.innerHTML = '<option value="">No Loadout</option>';
      loadouts.forEach((l) => {
        const option = document.createElement("option");
        option.value = l.id;
        option.textContent = l.name;
        loadoutSelect.appendChild(option);
      });
      if (loadoutApply) loadoutApply.disabled = !loadoutSelect.value;
    }

    function renderInputTable() {
      if (!inputTableBody) return;
      inputTableBody.innerHTML = "";
      const circles = getProfessionCircles();
      const relevantStats = getRelevantStats();
      const currentLevel = getCurrentLevel();

      // Level row
      inputTableBody.appendChild(makeInputRow(
        "Level", currentLevel,
        whatIfOverrides.level !== undefined ? whatIfOverrides.level : "",
        "level", "All CS, All TD"
      ));

      // Race row
      const currentRace = selectedProfile?.race || "";
      inputTableBody.appendChild(makeRaceRow(currentRace || "—"));

      // Armor row
      const currentAsgKey = selectedProfile?.defaults?.armorAsg || "none";
      const currentArmor = armorAsgList.find((a) => a.key === currentAsgKey);
      inputTableBody.appendChild(makeArmorRow(currentArmor));

      // Stat rows — show the computed bonus (not raw stat value)
      relevantStats.forEach((statKey) => {
        const label = `${STAT_LABELS[statKey] || statKey.toUpperCase()} Bonus`;
        const currentBonus = computeStatBonus(statKey, selectedProfile, currentRace);
        const affects = getStatAffects(statKey);
        const overrideKey = `stat_${statKey}`;
        inputTableBody.appendChild(makeInputRow(
          label, currentBonus,
          whatIfOverrides[overrideKey] !== undefined ? whatIfOverrides[overrideKey] : "",
          overrideKey, affects
        ));
      });

      // Spell circle ranks
      circles.forEach((circle) => {
        const ranks = getCurrentCircleRanks(circle);
        const affects = getCircleAffects(circle);
        const overrideKey = `circle_${circle}`;
        inputTableBody.appendChild(makeInputRow(
          `${circle} ranks`, ranks,
          whatIfOverrides[overrideKey] !== undefined ? whatIfOverrides[overrideKey] : "",
          overrideKey, affects
        ));
      });
    }

    function makeInputRow(label, currentValue, whatIfValue, inputKey, affects, placeholder) {
      const tr = document.createElement("tr");
      const tdLabel = document.createElement("td");
      tdLabel.textContent = label;
      const tdCurrent = document.createElement("td");
      tdCurrent.className = "cs-td-current-val";
      tdCurrent.textContent = currentValue;
      const tdWhatIf = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.className = "cs-td-whatif-input";
      input.dataset.inputKey = inputKey;
      input.value = whatIfValue;
      input.placeholder = placeholder || currentValue;
      input.addEventListener("change", () => {
        const val = input.value.trim();
        if (val === "") {
          delete whatIfOverrides[inputKey];
        } else {
          whatIfOverrides[inputKey] = Number(val) || 0;
        }
        renderOutputs();
      });
      tdWhatIf.appendChild(input);
      const tdAffects = document.createElement("td");
      tdAffects.className = "cs-td-affects";
      tdAffects.textContent = affects;
      tr.appendChild(tdLabel);
      tr.appendChild(tdCurrent);
      tr.appendChild(tdWhatIf);
      tr.appendChild(tdAffects);
      return tr;
    }

    function makeRaceRow(currentRace) {
      const tr = document.createElement("tr");
      const tdLabel = document.createElement("td");
      tdLabel.textContent = "Race";
      const tdCurrent = document.createElement("td");
      tdCurrent.className = "cs-td-current-val";
      tdCurrent.textContent = currentRace;
      const tdWhatIf = document.createElement("td");
      const select = document.createElement("select");
      select.className = "cs-td-whatif-input";
      select.dataset.inputKey = "race";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = `(${currentRace})`;
      select.appendChild(defaultOption);
      races.forEach((r) => {
        const option = document.createElement("option");
        option.value = r.name;
        option.textContent = r.name;
        select.appendChild(option);
      });
      select.value = raceOverride || "";
      select.addEventListener("change", () => {
        raceOverride = select.value;
        renderOutputs();
      });
      tdWhatIf.appendChild(select);
      const tdAffects = document.createElement("td");
      tdAffects.className = "cs-td-affects";
      tdAffects.textContent = "Racial TD modifiers";
      tr.appendChild(tdLabel);
      tr.appendChild(tdCurrent);
      tr.appendChild(tdWhatIf);
      tr.appendChild(tdAffects);
      return tr;
    }

    function makeArmorRow(currentArmor) {
      const tr = document.createElement("tr");
      const tdLabel = document.createElement("td");
      tdLabel.textContent = "Armor";
      const tdCurrent = document.createElement("td");
      tdCurrent.className = "cs-td-current-val";
      const displayName = currentArmor ? currentArmor.name : "None";
      const cvaVal = currentArmor ? currentArmor.cva : 25;
      tdCurrent.textContent = `${displayName} (CvA ${cvaVal >= 0 ? "+" : ""}${cvaVal})`;
      const tdWhatIf = document.createElement("td");
      const select = document.createElement("select");
      select.className = "cs-td-whatif-input";
      select.dataset.inputKey = "armorAsg";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = `(${displayName})`;
      select.appendChild(defaultOption);
      armorAsgList.forEach((a) => {
        const option = document.createElement("option");
        option.value = a.key;
        option.textContent = `${a.name} (CvA ${a.cva >= 0 ? "+" : ""}${a.cva})`;
        select.appendChild(option);
      });
      select.value = whatIfOverrides.armorAsg || "";
      select.addEventListener("change", () => {
        if (select.value) {
          whatIfOverrides.armorAsg = select.value;
        } else {
          delete whatIfOverrides.armorAsg;
        }
        renderOutputs();
      });
      tdWhatIf.appendChild(select);
      const tdAffects = document.createElement("td");
      tdAffects.className = "cs-td-affects";
      tdAffects.textContent = "CvA (all spheres)";
      tr.appendChild(tdLabel);
      tr.appendChild(tdCurrent);
      tr.appendChild(tdWhatIf);
      tr.appendChild(tdAffects);
      return tr;
    }

    function renderOutputs() {
      const circles = getProfessionCircles();
      const currentProfile = buildCurrentProfile();
      const whatIfProfile = buildWhatIfProfile();

      const currentBuffs = getSpellBuffTotals(currentProfile);
      const whatIfBuffs = getSpellBuffTotals(whatIfProfile);
      const effectiveRace = getEffectiveRace();
      const currentRace = selectedProfile?.race || "";

      // Compute stat bonuses from the profile (includes racial, ascension, enhancive)
      const currentStatBonuses = buildStatBonuses(selectedProfile, currentRace);
      const whatIfStatBonuses = buildWhatIfStatBonuses(effectiveRace);

      // CS results
      const currentCS = logic.calculateAll({
        profile: currentProfile,
        professionCircles: circles,
        csTdData,
        spellBuffTotals: currentBuffs,
        statBonuses: currentStatBonuses,
      });
      const whatIfCS = logic.calculateAll({
        profile: whatIfProfile,
        professionCircles: circles,
        csTdData,
        spellBuffTotals: whatIfBuffs,
        raceOverride: effectiveRace !== currentRace ? effectiveRace : undefined,
        statBonuses: whatIfStatBonuses,
      });

      const currentCvA = getArmorCvA(selectedProfile);
      // What-if CvA: if armor override exists use it, else same as current
      const whatIfCvA = whatIfOverrides.armorAsg
        ? (armorAsgList.find((a) => a.key === whatIfOverrides.armorAsg)?.cva ?? 25)
        : currentCvA;

      renderCSTable(currentCS.csResults, whatIfCS.csResults);
      renderTDTable(currentCS.tdResults, whatIfCS.tdResults, currentCvA, whatIfCvA, currentBuffs, whatIfBuffs);
    }

    function renderCSTable(currentResults, whatIfResults) {
      if (!csOutputBody) return;
      csOutputBody.innerHTML = "";
      if (currentResults.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 8;
        td.textContent = "Select a profile to see CS breakdown.";
        td.className = "cs-td-empty";
        tr.appendChild(td);
        csOutputBody.appendChild(tr);
        return;
      }
      currentResults.forEach((cur, i) => {
        const wi = whatIfResults[i];
        const tr = document.createElement("tr");
        addCell(tr, cur.circle);
        addNumCell(tr, cur.level, wi.level);
        addNumCell(tr, cur.primaryCS, wi.primaryCS);
        addNumCell(tr, cur.secondaryCS, wi.secondaryCS);
        addNumCell(tr, cur.statBonus, wi.statBonus);
        addNumCell(tr, cur.spellBuffCS, wi.spellBuffCS);
        addTotalCell(tr, cur.total, wi.total);
        csOutputBody.appendChild(tr);
      });
    }

    // Build TD rows for all sphere types (base + hybrid + generic) from base sphere results.
    function buildAllTDRows(baseResults, cva, race, spellBuffTotals) {
      const sphereList = csTdData.tdSphereList || [];
      const baseByKey = {};
      baseResults.forEach((r) => { baseByKey[r.sphere] = r; });

      // racialTDModifiers uses lowercase-hyphen keys (e.g. "dark-elf")
      const raceKey = String(race || "").toLowerCase().replace(/\s+/g, "-");
      const racialMods = csTdData.racialTDModifiers[raceKey] || {};

      return sphereList.map((def) => {
        let td, racialMod;
        if (def.type === "base") {
          const base = baseByKey[def.key];
          td = base ? base.total - base.racialMod : 0;
          racialMod = base ? base.racialMod : 0;
        } else if (def.type === "hybrid") {
          const [a, b] = def.sources;
          const baseA = baseByKey[a];
          const baseB = baseByKey[b];
          // Correct formula: level + ceil(avg of stat bonuses) + per-spell hybrid buff
          const hybridKey = "td_hybrid_" + def.key.replace(/-/g, "_");
          const hybridBuff = Number(spellBuffTotals?.[hybridKey] || 0);
          const levelTD = baseA ? baseA.level : (baseB ? baseB.level : 0);
          const statA = baseA ? baseA.statBonus : 0;
          const statB = baseB ? baseB.statBonus : 0;
          td = levelTD + Math.ceil((statA + statB) / 2) + hybridBuff;
          const racA = Number(racialMods[a] || 0);
          const racB = Number(racialMods[b] || 0);
          racialMod = Math.floor((racA + racB) / 2);
        } else {
          // generic: level × 3 only
          const anyBase = baseResults[0];
          td = anyBase ? anyBase.level : 0;
          racialMod = 0;
        }
        const final_ = td - cva;
        const effective = final_ + racialMod;
        return { label: def.label, td, cva, final: final_, racialMod, effective };
      });
    }

    function renderTDTable(currentResults, whatIfResults, currentCvA, whatIfCvA, currentBuffs, whatIfBuffs) {
      if (!tdOutputBody) return;
      tdOutputBody.innerHTML = "";
      if (currentResults.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.textContent = "Select a profile to see TD breakdown.";
        td.className = "cs-td-empty";
        tr.appendChild(td);
        tdOutputBody.appendChild(tr);
        return;
      }

      const currentRace = selectedProfile?.race || "";
      const effectiveRace = getEffectiveRace();
      const curRows = buildAllTDRows(currentResults, currentCvA, currentRace, currentBuffs);
      const wiRows = buildAllTDRows(whatIfResults, whatIfCvA, effectiveRace, whatIfBuffs);

      const target = targetMode === "undead" ? " (Undead)" : "";
      curRows.forEach((cur, i) => {
        const wi = wiRows[i];
        const tr = document.createElement("tr");
        addCell(tr, cur.label + target);
        addNumCell(tr, cur.td, wi.td);
        addNumCell(tr, cur.cva, wi.cva);
        addTotalCell(tr, cur.final, wi.final);
        addNumCell(tr, cur.racialMod, wi.racialMod);
        addTotalCell(tr, cur.effective, wi.effective);
        tdOutputBody.appendChild(tr);
      });

      // Note about racial modifiers
      const noteRow = document.createElement("tr");
      const noteTd = document.createElement("td");
      noteTd.colSpan = 6;
      noteTd.className = "cs-td-note";
      noteTd.textContent = "COMBAT DEF does not show the Racial modifier. It is applied during spell resolution.";
      noteRow.appendChild(noteTd);
      tdOutputBody.appendChild(noteRow);
    }

    function addCell(tr, text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }

    function addNumCell(tr, current, whatIf) {
      const td = document.createElement("td");
      td.className = "cs-td-num";
      if (current === whatIf || whatIf === undefined) {
        td.textContent = formatNum(current);
      } else {
        td.innerHTML = `${formatNum(current)} <span class="cs-td-whatif-val ${whatIf > current ? "cs-td-up" : whatIf < current ? "cs-td-down" : ""}">${formatNum(whatIf)}</span>`;
      }
      tr.appendChild(td);
    }

    function addTotalCell(tr, current, whatIf) {
      const td = document.createElement("td");
      td.className = "cs-td-num cs-td-total";
      if (current === whatIf || whatIf === undefined) {
        td.textContent = formatNum(current);
      } else {
        const diff = whatIf - current;
        const sign = diff > 0 ? "+" : "";
        td.innerHTML = `${formatNum(current)} <span class="cs-td-whatif-val ${diff > 0 ? "cs-td-up" : diff < 0 ? "cs-td-down" : ""}">${formatNum(whatIf)} (${sign}${formatNum(diff)})</span>`;
      }
      tr.appendChild(td);
    }

    function formatNum(n) {
      return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : "0";
    }

    function renderAll() {
      const focusKey = saveFocusedInput();
      renderInputTable();
      renderOutputs();
      restoreFocusedInput(focusKey);
    }

    // --- Events ---

    function loadSelectedProfile() {
      const id = profileSelect?.value || "";
      if (!id) {
        selectedProfile = null;
        whatIfOverrides = {};
        raceOverride = "";
        loadoutCastModes = {};
        loadoutSocietyKey = "";
        loadoutSocietyAbilityKeys = {};
        if (profileStatus) profileStatus.textContent = "";
        renderLoadoutDropdown();
        renderAll();
        return;
      }
      selectedProfile = storage.findProfile(profiles, id);
      if (!selectedProfile) {
        if (profileStatus) profileStatus.textContent = "Profile not found.";
        renderLoadoutDropdown();
        renderAll();
        return;
      }
      localStorage.setItem(storage.SELECTED_PROFILE_KEY, selectedProfile.id);
      whatIfOverrides = {};
      raceOverride = "";
      loadoutCastModes = {};
      loadoutSocietyKey = "";
      loadoutSocietyAbilityKeys = {};

      // Load society from profile
      const societyKey = String(selectedProfile?.society?.key || "").trim().toLowerCase();
      const societyRank = Math.max(0, Math.floor(Number(selectedProfile?.society?.rank || 0)));
      if (societyKey) {
        loadoutSocietyKey = societyKey;
        const rankKeyMap = { col: "col_rank", voln: "voln_step", sunfist: "sunfist_rank" };
        const rankKey = rankKeyMap[societyKey];
        if (rankKey) loadoutSocietyRanks = { col_rank: 0, voln_step: 0, sunfist_rank: 0, [rankKey]: societyRank };
      }

      if (profileStatus) profileStatus.textContent = `Loaded: ${selectedProfile.name}`;
      renderLoadoutDropdown();
      renderAll();
    }

    function applyLoadout() {
      const loadoutId = loadoutSelect?.value;
      if (!loadoutId || !selectedProfile) return;
      const loadouts = selectedProfile.spellLoadouts || [];
      const loadout = loadouts.find((l) => l.id === loadoutId);
      if (!loadout) return;
      loadoutCastModes = { ...(loadout.castModesByKey || {}) };
      loadoutSocietyKey = String(loadout.activeSocietyKey || "");
      loadoutSocietyAbilityKeys = { ...(loadout.activeSocietyAbilityKeys || {}) };
      renderAll();
    }

    profileSelect?.addEventListener("change", loadSelectedProfile);
    profileLoad?.addEventListener("click", loadSelectedProfile);
    loadoutApply?.addEventListener("click", applyLoadout);
    loadoutSelect?.addEventListener("change", () => {
      if (loadoutApply) loadoutApply.disabled = !loadoutSelect.value;
    });

    targetToggle?.addEventListener("click", () => {
      targetMode = targetMode === "living" ? "undead" : "living";
      targetToggle.textContent = targetMode === "living" ? "Living" : "Undead";
      targetToggle.classList.toggle("cs-td-undead", targetMode === "undead");
      renderOutputs();
    });

    // Listen for profile updates from other pages
    window.addEventListener("storage", (event) => {
      if (event.key === storage.PROFILE_KEY) {
        renderProfileDropdown();
        if (selectedProfile) {
          profiles = storage.loadProfiles();
          selectedProfile = storage.findProfile(profiles, selectedProfile.id);
          renderAll();
        }
      }
    });

    // --- Init ---
    renderProfileDropdown();
    const savedId = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
    if (savedId && profileSelect) {
      profileSelect.value = savedId;
      loadSelectedProfile();
    } else {
      renderAll();
    }
  }

  return { init };
});
