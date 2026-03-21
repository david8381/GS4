(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CsTdSection = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  function init({ gs4Data, csTdData, logic }) {
    const csOutputBody = document.getElementById("cstdCSBody");
    const tdOutputBody = document.getElementById("cstdTDBody");
    const inputTableBody = document.getElementById("cstdInputBody");
    const cstdSection = document.getElementById("cstdSection");

    if (!csOutputBody || !tdOutputBody) return;

    const races = gs4Data?.races || [];
    const professionCircleMap = gs4Data?.professionSpellCircleMap || {};
    const armorAsgList = gs4Data?.armorAsg || [];
    const raceStatBonusModifiers = gs4Data?.raceStatBonusModifiers || {};

    const normalizeRace = (typeof GS4Util !== "undefined" && GS4Util.normalizeRaceForModifierLookup)
      ? GS4Util.normalizeRaceForModifierLookup
      : (r) => String(r || "");

    const STAT_LABELS = {
      str: "Strength", con: "Constitution", dex: "Dexterity", agi: "Agility", dis: "Discipline",
      aur: "Aura", log: "Logic", int: "Intuition", wis: "Wisdom", inf: "Influence",
    };

    let raceOverride = "";
    let armorOverride = "";
    let whatIfStatOverrides = {};
    let lastProfile = null;
    let lastSpellBuffTotals = {};
    let lastWhatIfSpellBuffTotals = {};
    let lastCrossoverApplied = false;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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

    function getProfessionCircles(profile) {
      const prof = profile?.profession || "";
      const titleCase = String(prof || "").split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      return professionCircleMap[titleCase] || new Set();
    }

    function getRelevantStats(circles) {
      const needed = new Set();
      circles.forEach((circle) => {
        const mapping = csTdData.csStatByCircle[circle];
        if (mapping?.stats) mapping.stats.forEach((s) => needed.add(s));
      });
      Object.values(csTdData.tdStatBySphere).forEach((s) => needed.add(s));
      return needed;
    }

    function getStatAffects(statKey, circles) {
      const affects = [];
      circles.forEach((circle) => {
        const mapping = csTdData.csStatByCircle[circle];
        if (mapping?.stats?.includes(statKey)) affects.push(`${circle} CS`);
      });
      Object.entries(csTdData.tdStatBySphere).forEach(([sphere, sKey]) => {
        if (sKey === statKey) {
          affects.push(`${sphere.charAt(0).toUpperCase() + sphere.slice(1)} TD`);
        }
      });
      return affects.join(", ");
    }

    function getArmorCvA(profile) {
      const asgKey = profile?.defaults?.armorAsg || "none";
      const entry = armorAsgList.find((a) => a.key === asgKey);
      return entry ? entry.cva : 25;
    }

    function buildStatBonuses(profile, raceName, circles, overrides) {
      const bonuses = {};
      getRelevantStats(circles).forEach((statKey) => {
        const overrideKey = `stat_${statKey}`;
        if (overrides && overrides[overrideKey] !== undefined) {
          bonuses[statKey] = Math.floor(Number(overrides[overrideKey]) || 0);
        } else {
          bonuses[statKey] = computeStatBonus(statKey, profile, raceName);
        }
      });
      return bonuses;
    }

    function buildProfileObj(profile, circles) {
      const level = Math.max(0, Math.floor(Number(profile?.level) || 0));
      const statMap = {};
      Object.keys(STAT_LABELS).forEach((key) => {
        const val = Number(profile?.stats?.[key]?.enhanced || profile?.stats?.[key]?.base || 0);
        statMap[key] = { base: val, enhanced: val };
      });
      const skills = [];
      circles.forEach((circle) => {
        if (!profile?.skills) return;
        const skill = profile.skills.find((s) => s.name === circle);
        const ranks = Math.max(0, Math.floor(Number(skill?.finalRanks || skill?.ranks || 0)));
        skills.push({ name: circle, ranks, finalRanks: ranks });
      });
      return { level, stats: statMap, skills, race: profile?.race || "", profession: profile?.profession || "" };
    }

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
          const anyBase = baseResults[0];
          td = anyBase ? anyBase.level : 0;
          racialMod = 0;
        }
        const final_ = td - cva;
        const effective = final_ + racialMod;
        return { label: def.label, td, cva, final: final_, racialMod, effective };
      });
    }

    // --- Rendering ---

    function renderInputTable(profile) {
      if (!inputTableBody) return;
      inputTableBody.innerHTML = "";
      const circles = getProfessionCircles(profile);
      const relevantStats = getRelevantStats(circles);
      const currentRace = profile?.race || "";

      // Race row
      inputTableBody.appendChild(makeRaceRow(currentRace || "—"));

      // Armor row
      const currentAsgKey = profile?.defaults?.armorAsg || "none";
      const currentArmor = armorAsgList.find((a) => a.key === currentAsgKey);
      inputTableBody.appendChild(makeArmorRow(currentArmor));

      // Stat bonus rows
      relevantStats.forEach((statKey) => {
        const label = `${STAT_LABELS[statKey] || statKey.toUpperCase()} Bonus`;
        const currentBonus = computeStatBonus(statKey, profile, currentRace);
        const affects = getStatAffects(statKey, circles);
        const overrideKey = `stat_${statKey}`;
        inputTableBody.appendChild(makeInputRow(
          label, currentBonus,
          whatIfStatOverrides[overrideKey] !== undefined ? whatIfStatOverrides[overrideKey] : "",
          overrideKey, affects
        ));
      });
    }

    function makeInputRow(label, currentValue, whatIfValue, inputKey, affects) {
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
      input.placeholder = currentValue;
      input.addEventListener("mousedown", () => {
        if (input.value === "") input.value = currentValue;
      });
      input.addEventListener("change", () => {
        const val = input.value.trim();
        if (val === "" || Number(val) === currentValue) {
          input.value = "";
          delete whatIfStatOverrides[inputKey];
        } else {
          whatIfStatOverrides[inputKey] = Number(val) || 0;
        }
        renderOutputs(lastProfile, lastSpellBuffTotals, lastWhatIfSpellBuffTotals);
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
        renderOutputs(lastProfile, lastSpellBuffTotals, lastWhatIfSpellBuffTotals);
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
      select.value = armorOverride || "";
      select.addEventListener("change", () => {
        armorOverride = select.value;
        renderOutputs(lastProfile, lastSpellBuffTotals, lastWhatIfSpellBuffTotals);
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

    function renderCSTable(currentResults, whatIfResults) {
      if (!csOutputBody) return;
      csOutputBody.innerHTML = "";
      if (currentResults.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.textContent = "Load a profile to see CS breakdown.";
        td.className = "cs-td-empty";
        tr.appendChild(td);
        csOutputBody.appendChild(tr);
        return;
      }
      currentResults.forEach((cur, i) => {
        const wi = whatIfResults?.[i];
        const tr = document.createElement("tr");
        addCell(tr, cur.circle);
        addNumCell(tr, cur.level);
        addNumCell(tr, cur.primaryCS);
        addNumCell(tr, cur.secondaryCS);
        addCompareCell(tr, cur.statBonus, wi?.statBonus, false);
        addCompareCell(tr, cur.spellBuffCS, wi?.spellBuffCS, false);
        addCompareCell(tr, cur.total, wi?.total, true);
        csOutputBody.appendChild(tr);
      });
    }

    function renderTDTable(currentRows, whatIfRows) {
      if (!tdOutputBody) return;
      tdOutputBody.innerHTML = "";
      if (currentRows.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.textContent = "Load a profile to see TD breakdown.";
        td.className = "cs-td-empty";
        tr.appendChild(td);
        tdOutputBody.appendChild(tr);
        return;
      }

      currentRows.forEach((cur, i) => {
        const wi = whatIfRows?.[i];
        const tr = document.createElement("tr");
        addCell(tr, cur.label);
        addCompareCell(tr, cur.td, wi?.td, false);
        addCompareCell(tr, cur.cva, wi?.cva, false);
        addCompareCell(tr, cur.final, wi?.final, true);
        addCompareCell(tr, cur.racialMod, wi?.racialMod, false);
        addCompareCell(tr, cur.effective, wi?.effective, true);
        tdOutputBody.appendChild(tr);
      });

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

    function addNumCell(tr, value) {
      const td = document.createElement("td");
      td.className = "cs-td-num";
      td.textContent = formatNum(value);
      tr.appendChild(td);
    }

    function addCompareCell(tr, curValue, wiValue, isTotal) {
      const td = document.createElement("td");
      td.className = isTotal ? "cs-td-num cs-td-total" : "cs-td-num";
      const curText = formatNum(curValue);
      td.textContent = curText;
      const wiNum = Number.isFinite(wiValue) ? wiValue : curValue;
      if (Number.isFinite(wiNum) && Number.isFinite(curValue) && wiNum !== curValue) {
        const span = document.createElement("span");
        span.className = "cs-td-whatif-val " + (wiNum > curValue ? "cs-td-up" : "cs-td-down");
        span.textContent = formatNum(wiNum);
        td.appendChild(span);
      }
      tr.appendChild(td);
    }

    function formatNum(n) {
      return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : "0";
    }

    function hasAnyWhatIf() {
      return raceOverride !== "" || armorOverride !== "" ||
        Object.keys(whatIfStatOverrides).length > 0 ||
        !buffTotalsEqual(lastSpellBuffTotals, lastWhatIfSpellBuffTotals);
    }

    function buffTotalsEqual(a, b) {
      if (a === b) return true;
      const keysA = Object.keys(a || {});
      const keysB = Object.keys(b || {});
      if (keysA.length !== keysB.length) return false;
      return keysA.every((k) => a[k] === b[k]);
    }

    function renderOutputs(profile, spellBuffTotals, whatIfSpellBuffTotals) {
      const circles = getProfessionCircles(profile);
      const profileObj = buildProfileObj(profile, circles);
      const currentRace = profile?.race || "";

      // Current: no local overrides, current spell buffs
      const currentStatBonuses = buildStatBonuses(profile, currentRace, circles, {});
      const currentResults = logic.calculateAll({
        profile: profileObj,
        professionCircles: circles,
        csTdData,
        spellBuffTotals: spellBuffTotals || {},
        statBonuses: currentStatBonuses,
        crossoverApplied: lastCrossoverApplied,
      });
      const currentCvA = getArmorCvA(profile);

      // What-if: with local overrides + what-if spell buffs
      const effectiveRace = raceOverride || currentRace;
      const whatIfStatBonuses = buildStatBonuses(profile, effectiveRace, circles, whatIfStatOverrides);
      const whatIfResults = logic.calculateAll({
        profile: profileObj,
        professionCircles: circles,
        csTdData,
        spellBuffTotals: whatIfSpellBuffTotals || spellBuffTotals || {},
        raceOverride: effectiveRace !== currentRace ? effectiveRace : undefined,
        statBonuses: whatIfStatBonuses,
        crossoverApplied: lastCrossoverApplied,
      });
      const whatIfCvA = armorOverride
        ? (armorAsgList.find((a) => a.key === armorOverride)?.cva ?? 25)
        : currentCvA;

      const showWhatIf = hasAnyWhatIf();
      const currentTDRows = buildAllTDRows(currentResults.tdResults, currentCvA, currentRace, spellBuffTotals);
      const whatIfTDRows = showWhatIf
        ? buildAllTDRows(whatIfResults.tdResults, whatIfCvA, effectiveRace, whatIfSpellBuffTotals || spellBuffTotals)
        : null;

      renderCSTable(currentResults.csResults, showWhatIf ? whatIfResults.csResults : null);
      renderTDTable(currentTDRows, whatIfTDRows);
    }

    // --- Public API ---

    function update({ profile, spellBuffTotals, whatIfSpellBuffTotals, crossoverApplied }) {
      lastProfile = profile;
      lastSpellBuffTotals = spellBuffTotals || {};
      lastWhatIfSpellBuffTotals = whatIfSpellBuffTotals || spellBuffTotals || {};
      lastCrossoverApplied = Boolean(crossoverApplied);

      // Re-render inputs when profile changes
      renderInputTable(profile);
      renderOutputs(profile, lastSpellBuffTotals, lastWhatIfSpellBuffTotals);
    }

    // Initial empty render
    renderOutputs(null, {}, {});

    // Expose update on the exported object
    exported.update = update;
  }

  const exported = { init };
  return exported;
});
