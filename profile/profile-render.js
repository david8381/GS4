(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileRender = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function refreshProfileSelect({ profileSelect, profiles }) {
    if (!profileSelect) return;
    profileSelect.innerHTML = "<option value=\"\">Select a profile</option>";
    (profiles || []).forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });
  }

  function updateEnhanciveImportStatusMessages({
    enhanciveListImport,
    enhanciveTotalsImport,
    enhanciveDetailsImport,
    enhanciveListImportStatus,
    enhanciveTotalsImportStatus,
    enhanciveDetailsImportStatus,
    currentEnhanciveEquipment,
  }) {
    if (enhanciveListImportStatus) {
      const count = currentEnhanciveEquipment?.importedSnapshot?.summary?.itemCount || 0;
      enhanciveListImportStatus.textContent = enhanciveListImport?.value?.trim()
        ? `Loaded enhancive item list: ${count} item(s).`
        : "Paste INV ENHANCIVE LIST to load worn enhancive item names.";
      enhanciveListImportStatus.style.color = "";
    }
    if (enhanciveTotalsImportStatus) {
      enhanciveTotalsImportStatus.textContent = enhanciveTotalsImport?.value?.trim()
        ? "Stored INV ENHANCIVE TOTALS as raw fallback text."
        : "Optional fallback aggregate block.";
      enhanciveTotalsImportStatus.style.color = "";
    }
    if (enhanciveDetailsImportStatus) {
      const knownItems = currentEnhanciveEquipment?.importedSnapshot?.items?.filter((item) => item.effects?.length).length || 0;
      const unresolved = currentEnhanciveEquipment?.importedSnapshot?.unresolved?.length || 0;
      enhanciveDetailsImportStatus.textContent = enhanciveDetailsImport?.value?.trim()
        ? `Loaded enhancive details: ${knownItems} known item source(s), ${unresolved} unresolved effect(s).`
        : "Paste INV ENHANCIVE TOTALS DETAILS to load active enhancive contributions.";
      enhanciveDetailsImportStatus.style.color = "";
    }
  }

  function updateTrainingPointEstimateDisplay({
    tpExpPtp,
    tpExpMtp,
    tpSpentPtp,
    tpSpentMtp,
    tpLeftPtp,
    tpLeftMtp,
    tpConvertedPhyToMnt,
    tpConvertedMntToPhy,
    tpShortfallRow,
    tpShortfallPtp,
    tpShortfallMtp,
    profession,
    experience,
    level,
    currentSkills,
    estimateTotalTrainingPointsFromExperience,
    estimateSpentTrainingPointsFromRanks,
    summarizeTrainingPointConversion,
  }) {
    if (!tpExpPtp || !tpExpMtp || !tpSpentPtp || !tpSpentMtp || !tpLeftPtp || !tpLeftMtp) return;
    if (!profession) {
      tpExpPtp.textContent = "—";
      tpExpMtp.textContent = "—";
      tpSpentPtp.textContent = "—";
      tpSpentMtp.textContent = "—";
      tpLeftPtp.textContent = "—";
      tpLeftMtp.textContent = "—";
      if (tpConvertedPhyToMnt) tpConvertedPhyToMnt.textContent = "—";
      if (tpConvertedMntToPhy) tpConvertedMntToPhy.textContent = "—";
      if (tpShortfallRow) tpShortfallRow.hidden = true;
      return;
    }

    const totalTp = estimateTotalTrainingPointsFromExperience(experience, profession);
    const spentTp = estimateSpentTrainingPointsFromRanks(currentSkills, profession, level);
    const conversion = summarizeTrainingPointConversion(totalTp, spentTp);

    tpExpPtp.textContent = String(totalTp.ptp);
    tpExpMtp.textContent = String(totalTp.mtp);
    tpSpentPtp.textContent = String(spentTp.ptp);
    tpSpentMtp.textContent = String(spentTp.mtp);
    tpLeftPtp.textContent = String(conversion.pointsLeftPtp);
    tpLeftMtp.textContent = String(conversion.pointsLeftMtp);
    if (tpConvertedPhyToMnt) tpConvertedPhyToMnt.textContent = String(conversion.phyToMnt);
    if (tpConvertedMntToPhy) tpConvertedMntToPhy.textContent = String(conversion.mntToPhy);

    const hasShortfall = conversion.remainingDeficitPtp > 0 || conversion.remainingDeficitMtp > 0;
    if (tpShortfallRow) {
      tpShortfallRow.hidden = !hasShortfall;
      tpShortfallRow.style.color = hasShortfall ? "#b42318" : "";
    }
    if (tpShortfallPtp) tpShortfallPtp.textContent = String(conversion.remainingDeficitPtp);
    if (tpShortfallMtp) tpShortfallMtp.textContent = String(conversion.remainingDeficitMtp);
    if (tpLeftPtp) tpLeftPtp.style.color = hasShortfall ? "#b42318" : "";
    if (tpLeftMtp) tpLeftMtp.style.color = hasShortfall ? "#b42318" : "";
    if (tpSpentPtp) tpSpentPtp.style.color = hasShortfall ? "#b42318" : "";
    if (tpSpentMtp) tpSpentMtp.style.color = hasShortfall ? "#b42318" : "";
    if (tpExpPtp) tpExpPtp.style.color = "";
    if (tpExpMtp) tpExpMtp.style.color = "";
    if (tpConvertedPhyToMnt) tpConvertedPhyToMnt.style.color = "";
    if (tpConvertedMntToPhy) tpConvertedMntToPhy.style.color = "";
    if (!hasShortfall) {
      if (tpLeftPtp) tpLeftPtp.style.color = "";
      if (tpLeftMtp) tpLeftMtp.style.color = "";
      if (tpSpentPtp) tpSpentPtp.style.color = "";
      if (tpSpentMtp) tpSpentMtp.style.color = "";
    }
  }

  function updateAscensionPointEstimateDisplay({ atpEstimateStatus, currentAscensionExperience, currentAscensionMilestones, estimateTotalAscensionPoints }) {
    if (!atpEstimateStatus) return;
    const atp = estimateTotalAscensionPoints(currentAscensionExperience, currentAscensionMilestones);
    atpEstimateStatus.textContent = `Total ATP from milestones + asc exp: ${atp.totalAtp} (${atp.milestones} milestones + ${atp.expAtp} from asc exp)`;
  }

  function updateStatDerivedDisplay({ stats, statGrid, currentLevel0Stats, currentBaseStats, clamp, getDerivedStatRows, formatBonus }) {
    const rows = getDerivedStatRows();
    stats.forEach((stat) => {
      const row = rows[stat.key];
      const level0Input = statGrid.querySelector(`input[data-stat="${stat.key}"][data-field="level0"]`);
      const level0Value = clamp(Number(currentLevel0Stats?.[stat.key] ?? currentBaseStats[stat.key] ?? 50), 1, 100);
      if (level0Input && document.activeElement !== level0Input) level0Input.value = String(level0Value);
      const fields = {
        "base-stat": row.baseStat,
        "base-bonus": formatBonus(row.baseBonus),
        "final-stat": row.finalStat,
        "final-bonus": formatBonus(row.finalBonus),
      };
      Object.entries(fields).forEach(([field, value]) => {
        const output = statGrid.querySelector(`[data-stat="${stat.key}"][data-field="${field}"]`);
        if (output) output.textContent = String(value);
      });
    });
  }

  function updateEnhanciveDisplay({
    enhStatTable,
    enhSkillTable,
    enhResourceTable,
    stats,
    currentSkills,
    enhanciveState,
    getDerivedStatRows,
    getEquipmentEnhanciveTotals,
    skillKey,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
  }) {
    if (!enhStatTable || !enhSkillTable || !enhResourceTable) return;
    const statRows = getDerivedStatRows();
    const equipmentTotals = getEquipmentEnhanciveTotals();

    enhStatTable.querySelectorAll("tr").forEach((row) => {
      const statCell = row.firstElementChild;
      if (!statCell) return;
      const stat = stats.find((entry) => entry.abbr === statCell.textContent?.trim());
      if (!stat) return;
      const values = statRows[stat.key];
      if (!values) return;
      row.style.color = values.enhValid ? "#1f4e42" : "#b42318";
      const totalEnhStatCell = row.querySelector(`[data-enh-stat-total="${stat.key}"]`);
      if (totalEnhStatCell) {
        const totalEnhStat = Math.max(0, Math.trunc(Number(enhanciveState.stats?.[stat.key]?.stat) || 0))
          + Math.max(0, Math.trunc(Number(equipmentTotals.stats?.[stat.key]) || 0));
        totalEnhStatCell.textContent = String(totalEnhStat);
      }
      const totalEnhBonusCell = row.querySelector(`[data-enh-bonus-total="${stat.key}"]`);
      if (totalEnhBonusCell) {
        totalEnhBonusCell.textContent = String(Math.max(0, Math.trunc(Number(enhanciveState.stats?.[stat.key]?.bonus) || 0)));
      }
      const effCell = row.querySelector(`[data-enh-effective="${stat.key}"]`);
      if (effCell) effCell.textContent = `${values.enhEffective}/20`;
    });

    enhResourceTable.querySelectorAll("tr").forEach((row) => {
      const cell = row.querySelector("[data-enh-resource-total]");
      if (!cell) return;
      const key = cell.dataset.enhResourceTotal;
      cell.textContent = String(Math.max(0, Math.trunc(Number(equipmentTotals.resources?.[key]) || 0)));
    });

    enhSkillTable.querySelectorAll("tr").forEach((row) => {
      const skillCell = row.firstElementChild;
      if (!skillCell) return;
      const key = skillKey(skillCell.textContent);
      const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
      if (!skill) return;
      const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
      const effectiveEnh = getEffectiveSkillEnhancive(key);
      const enhRank = effectiveEnh.rank;
      const enhBonus = effectiveEnh.bonus;
      const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
      const effective = rankBonusGain + enhBonus;
      const valid = enhRank <= 50 && enhBonus <= 50 && effective <= 50;
      row.style.color = valid ? "#1f4e42" : "#b42318";
      const rankCell = row.querySelector(`[data-enh-skill-rank-total="${key}"]`);
      if (rankCell) {
        const totalEnhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0))
          + Math.max(0, Math.trunc(Number(equipmentTotals.skillRanks?.[key]) || 0));
        rankCell.textContent = String(totalEnhRank);
      }
      const bonusCell = row.querySelector(`[data-enh-skill-bonus-total="${key}"]`);
      if (bonusCell) {
        const totalEnhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0))
          + Math.max(0, Math.trunc(Number(equipmentTotals.skillBonuses?.[key]) || 0));
        bonusCell.textContent = String(totalEnhBonus);
      }
      const effCell = row.querySelector(`[data-enh-skill-effective="${key}"]`);
      if (effCell) effCell.textContent = `${effective}/50`;
    });
  }

  function updateEnhStatus({ enhStatus, getDerivedStatRows, currentSkills, skillKey, getEffectiveSkillEnhancive, skillBonusFromRanks }) {
    if (!enhStatus) return;
    const statRows = getDerivedStatRows();
    const statInvalid = Object.values(statRows).some((row) => !row.enhValid);
    const skillInvalid = currentSkills.some((skill) => {
      const key = skillKey(skill.name);
      const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
      const effectiveEnh = getEffectiveSkillEnhancive(key);
      const enhRank = effectiveEnh.rank;
      const enhBonus = effectiveEnh.bonus;
      const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
      return enhRank > 50 || enhBonus > 50 || rankBonusGain + enhBonus > 50;
    });
    if (statInvalid || skillInvalid) {
      enhStatus.textContent = "Invalid enhancive rows: stat limit is 40 stat / 20 bonus with 20 effective; skill limit is 50 effective.";
      enhStatus.style.color = "#b42318";
    } else {
      enhStatus.textContent = "Effective bonus is calculated per row and is capped by the shown limit.";
      enhStatus.style.color = "";
    }
  }

  function renderAscensionTables({
    ascAbilityGroups,
    ascShowTrainedOnly,
    currentAscensionAbilities,
    getAscensionDisplayGroup,
    ascensionPointsForRanks,
    getNextAscensionCostDisplay,
    getMaxAllowedAscensionRanks,
  }) {
    if (!ascAbilityGroups) return;
    ascAbilityGroups.innerHTML = "";
    const showNonZeroOnly = Boolean(ascShowTrainedOnly?.checked);
    const visibleAbilities = showNonZeroOnly
      ? currentAscensionAbilities.filter((ability) => Math.max(0, Math.trunc(Number(ability.ranks) || 0)) > 0)
      : currentAscensionAbilities;
    const groups = [
      { key: "stat", label: "Regular Stats", open: true },
      { key: "skill", label: "Skills", open: true },
      { key: "resist", label: "Resistances", open: false },
      { key: "regen", label: "Regeneration", open: false },
      { key: "other", label: "Other", open: false },
    ];

    groups.forEach((group) => {
      const entries = visibleAbilities.filter((ability) => getAscensionDisplayGroup(ability) === group.key);
      if (!entries.length) return;

      const wrapper = document.createElement("details");
      wrapper.className = "asc-group";
      if (group.open) wrapper.open = true;
      wrapper.innerHTML = `
        <summary>${group.label}</summary>
        <div class="asc-group-body">
          <table>
            <thead>
              <tr>
                <th>Ability</th>
                <th>Ranks</th>
                <th>Cap</th>
                <th>ATP Cost</th>
                <th>Next ATP</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      `;
      const body = wrapper.querySelector("tbody");
      entries.forEach((ability) => {
        const row = document.createElement("tr");
        row.dataset.ascRow = "1";
        const cost = ascensionPointsForRanks(ability.ranks, ability);
        const nextCost = getNextAscensionCostDisplay(ability, currentAscensionAbilities);
        const maxByGate = getMaxAllowedAscensionRanks(ability, currentAscensionAbilities);
        row.innerHTML = `
          <td>${ability.name}</td>
          <td><input type="number" min="0" max="${Math.max(maxByGate, ability.ranks)}" step="1" data-asc-ability="${ability.mnemonic}" value="${ability.ranks}" /></td>
          <td>${ability.cap}</td>
          <td>${cost}</td>
          <td data-asc-field="next-cost">${nextCost.display}</td>
        `;
        if (nextCost.gateReason) row.title = nextCost.gateReason;
        body?.appendChild(row);
      });
      ascAbilityGroups.appendChild(wrapper);
    });

    if (!ascAbilityGroups.children.length) {
      const empty = document.createElement("div");
      empty.className = "helper";
      empty.textContent = "No ascension abilities to display.";
      ascAbilityGroups.appendChild(empty);
    }
  }

  function renderImportedEnhanciveTables({
    enhImportedSummary,
    enhImportedItemsTable,
    enhImportedUnresolvedTable,
    enhManualResolutionTable,
    currentEnhanciveEquipment,
    getActiveEnhanciveEquipmentItems,
    getManualEffectsLinkedToImportedItem,
    normalizeEnhanciveEffectForUse,
    effectDisplayType,
    effectDisplayTarget,
    buildEnhanciveTargetOptions,
    ENHANCIVE_TYPE_OPTIONS,
  }) {
    if (!enhImportedSummary || !enhImportedItemsTable || !enhImportedUnresolvedTable || !enhManualResolutionTable) return;

    const importedItems = currentEnhanciveEquipment.importedSnapshot.items;
    const unresolvedEntries = currentEnhanciveEquipment.importedSnapshot.unresolved.filter(
      (entry) => !currentEnhanciveEquipment.manualResolutions.resolvedFromImported.includes(entry.id),
    );
    const manualItems = currentEnhanciveEquipment.manualResolutions.items;
    const activeCount = getActiveEnhanciveEquipmentItems().length;

    enhImportedSummary.textContent = `Imported snapshot: ${currentEnhanciveEquipment.importedSnapshot.summary.itemCount || importedItems.length} item(s), `
      + `${currentEnhanciveEquipment.importedSnapshot.summary.propertyCount || 0} properties, `
      + `${currentEnhanciveEquipment.importedSnapshot.summary.totalAmount || 0} total amount`
      + ` | Itemized active sources: ${activeCount}`;

    enhImportedItemsTable.innerHTML = "";
    if (!importedItems.length) {
      const row = document.createElement("tr");
      row.innerHTML = "<td colspan=\"4\">No imported enhancive items loaded.</td>";
      enhImportedItemsTable.appendChild(row);
    } else {
      importedItems.forEach((item) => {
        const linkedManualItems = getManualEffectsLinkedToImportedItem(item.name);
        const displayedEffects = item.effects.concat(linkedManualItems.flatMap((manualItem) => manualItem.effects || []));
        const effects = displayedEffects.length
          ? displayedEffects.map((effect) => {
            const normalizedEffect = normalizeEnhanciveEffectForUse(effect);
            return `${effectDisplayType(normalizedEffect)} ${effectDisplayTarget(normalizedEffect)} +${normalizedEffect.value}`;
          }).join(", ")
          : "No itemized effects yet";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.source}</td>
          <td><input type="checkbox" data-imported-enh-active="${item.id}" ${item.active !== false ? "checked" : ""} /></td>
          <td>${effects}</td>
        `;
        enhImportedItemsTable.appendChild(row);
      });
    }

    enhImportedUnresolvedTable.innerHTML = "";
    if (!unresolvedEntries.length) {
      const row = document.createElement("tr");
      row.innerHTML = "<td colspan=\"5\">No unresolved imported effects.</td>";
      enhImportedUnresolvedTable.appendChild(row);
    } else {
      unresolvedEntries.forEach((entry) => {
        const normalizedEffect = normalizeEnhanciveEffectForUse(entry);
        const resolveOptions = importedItems.length
          ? `${importedItems.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}<option value="">Manual Enhancive</option>`
          : '<option value="">Manual Enhancive</option>';
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${entry.category || "Unknown"}</td>
          <td>${effectDisplayTarget(normalizedEffect)}</td>
          <td>${entry.value}/${entry.limit || "—"}</td>
          <td>${entry.note || "Unknown source"}</td>
          <td>
            <select data-resolve-enh-target="${entry.id}">
              ${resolveOptions}
            </select>
            <button class="btn ghost" type="button" data-resolve-enh-imported="${entry.id}">Resolve</button>
          </td>
        `;
        enhImportedUnresolvedTable.appendChild(row);
      });
    }

    enhManualResolutionTable.innerHTML = "";
    if (!manualItems.length) {
      const row = document.createElement("tr");
      row.innerHTML = "<td colspan=\"6\">No manual enhancive resolutions yet.</td>";
      enhManualResolutionTable.appendChild(row);
    } else {
      manualItems.forEach((item) => {
        const effect = normalizeEnhanciveEffectForUse(item.effects[0] || {});
        const targetOptions = buildEnhanciveTargetOptions(effect.type);
        const linkNote = item.linkedImportedName
          ? `<div class="helper helper-inline">linked to ${item.linkedImportedName}</div>`
          : "";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="text" data-manual-enh-name="${item.id}" value="${item.name.replace(/"/g, "&quot;")}" />${linkNote}</td>
          <td><input type="checkbox" data-manual-enh-active="${item.id}" ${item.active !== false ? "checked" : ""} /></td>
          <td>
            <select data-manual-enh-type="${item.id}">
              ${ENHANCIVE_TYPE_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === effect.type ? "selected" : ""}>${option.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select data-manual-enh-target="${item.id}">
              ${targetOptions.map((option) => `<option value="${option.value}" ${option.value === effect.target ? "selected" : ""}>${option.label}</option>`).join("")}
            </select>
          </td>
          <td><input type="number" min="0" step="1" data-manual-enh-value="${item.id}" value="${effect.value}" /></td>
          <td><button class="btn ghost" type="button" data-delete-manual-enh="${item.id}">Delete</button></td>
        `;
        enhManualResolutionTable.appendChild(row);
      });
    }
  }

  function updateAscensionStatus({
    ascStatus,
    ascAbilityGroups,
    totalAscensionPointsAvailable,
    calculateAscensionPointsUsed,
    currentAscensionAbilities,
    getAscensionAbilityGate,
  }) {
    if (!ascStatus || !ascAbilityGroups) return;
    const available = totalAscensionPointsAvailable();
    const used = calculateAscensionPointsUsed();
    const remaining = available - used;
    const porter = currentAscensionAbilities.find((ability) => ability.mnemonic === "porter");
    const transcend = currentAscensionAbilities.find((ability) => ability.mnemonic === "trandest");
    const porterGate = getAscensionAbilityGate(porter);
    const transcendGate = getAscensionAbilityGate(transcend);
    const invalid = remaining < 0;

    ascAbilityGroups.querySelectorAll("tr[data-asc-row]").forEach((row) => {
      row.style.color = invalid ? "#b42318" : "";
    });

    if (invalid) {
      ascStatus.textContent = `Ascension over budget: ${used}/${available} ATP used.`;
      ascStatus.style.color = "#b42318";
    } else {
      const notes = [];
      if (!porterGate.allowed && Math.max(0, Math.trunc(Number(porter?.ranks) || 0)) === 0) notes.push("Porter locked");
      if (!transcendGate.allowed && Math.max(0, Math.trunc(Number(transcend?.ranks) || 0)) === 0) notes.push("Transcend Destiny locked");
      const lockSuffix = notes.length ? ` | ${notes.join(", ")}` : "";
      ascStatus.textContent = `Ascension ATP: ${used}/${available} used, ${remaining} remaining.${lockSuffix}`;
      ascStatus.style.color = "";
    }
  }

  function renderEnhanciveTables({
    enhStatTable,
    enhSkillTable,
    enhResourceTable,
    stats,
    currentSkills,
    enhanciveState,
    getDerivedStatRows,
    getEquipmentEnhanciveTotals,
    ENHANCIVE_RESOURCE_OPTIONS,
    skillKey,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
  }) {
    if (!enhStatTable || !enhSkillTable || !enhResourceTable) return;
    enhStatTable.innerHTML = "";
    const rows = getDerivedStatRows();
    const equipmentTotals = getEquipmentEnhanciveTotals();
    stats.forEach((stat) => {
      const statRow = rows[stat.key];
      const manualEnhStat = Math.max(0, Math.trunc(Number(enhanciveState.stats?.[stat.key]?.stat) || 0));
      const manualEnhBonus = Math.max(0, Math.trunc(Number(enhanciveState.stats?.[stat.key]?.bonus) || 0));
      const importedEnhStat = Math.max(0, Math.trunc(Number(equipmentTotals.stats?.[stat.key]) || 0));
      const totalEnhStat = manualEnhStat + importedEnhStat;
      const row = document.createElement("tr");
      row.style.color = statRow.enhValid ? "#1f4e42" : "#b42318";
      row.innerHTML = `
        <td>${stat.abbr}</td>
        <td data-enh-stat-total="${stat.key}">${totalEnhStat}</td>
        <td data-enh-bonus-total="${stat.key}">${manualEnhBonus}</td>
        <td data-enh-effective="${stat.key}">${statRow.enhEffective}/20</td>
      `;
      enhStatTable.appendChild(row);
    });

    enhResourceTable.innerHTML = "";
    ENHANCIVE_RESOURCE_OPTIONS.forEach((resource) => {
      const value = Math.max(0, Math.trunc(Number(equipmentTotals.resources?.[resource.value]) || 0));
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${resource.label}</td>
        <td data-enh-resource-total="${resource.value}">${value}</td>
      `;
      enhResourceTable.appendChild(row);
    });

    enhSkillTable.innerHTML = "";
    currentSkills.forEach((skill) => {
      const key = skillKey(skill.name);
      const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
      const effectiveEnh = getEffectiveSkillEnhancive(key);
      const enhRank = effectiveEnh.rank;
      const enhBonus = effectiveEnh.bonus;
      const manualEnhRank = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.rank) || 0));
      const manualEnhBonus = Math.max(0, Math.trunc(Number(enhanciveState.skills?.[key]?.bonus) || 0));
      const importedEnhRank = Math.max(0, Math.trunc(Number(equipmentTotals.skillRanks?.[key]) || 0));
      const importedEnhBonus = Math.max(0, Math.trunc(Number(equipmentTotals.skillBonuses?.[key]) || 0));
      const totalEnhRank = manualEnhRank + importedEnhRank;
      const totalEnhBonus = manualEnhBonus + importedEnhBonus;
      const rankBonusGain = skillBonusFromRanks(baseRanks + enhRank) - skillBonusFromRanks(baseRanks);
      const effective = rankBonusGain + enhBonus;
      const valid = enhRank <= 50 && enhBonus <= 50 && effective <= 50;
      const row = document.createElement("tr");
      row.style.color = valid ? "#1f4e42" : "#b42318";
      row.innerHTML = `
        <td>${skill.name}</td>
        <td data-enh-skill-rank-total="${key}">${totalEnhRank}</td>
        <td data-enh-skill-bonus-total="${key}">${totalEnhBonus}</td>
        <td data-enh-skill-effective="${key}">${effective}/50</td>
      `;
      enhSkillTable.appendChild(row);
    });
  }

  function renderSkillsTable({
    skillsTable,
    visibleSkills,
    displaySkillCategoryOrder,
    getDisplaySkillCategory,
    capsBySkill,
    renderedPoolHeaders,
    formatPoolHeaderText,
    getNextRankCostDisplay,
    skillKey,
    spellCircles,
    ascensionState,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
    skillsImportUnmatchedKeys,
    skillsImportOffProfessionKeys,
  }) {
    skillsTable.innerHTML = "";
    if (!visibleSkills.length) {
      const row = document.createElement("tr");
      row.innerHTML = "<td colspan=\"7\">No skills loaded yet.</td>";
      skillsTable.appendChild(row);
      return;
    }

    const grouped = new Map();
    displaySkillCategoryOrder.forEach((category) => grouped.set(category, []));
    visibleSkills.forEach((skill) => {
      const category = getDisplaySkillCategory(skill.name);
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(skill);
    });

    displaySkillCategoryOrder.forEach((category) => {
      const items = grouped.get(category) || [];
      if (!items.length) return;

      const groupRow = document.createElement("tr");
      groupRow.className = "skills-group-row";
      groupRow.innerHTML = `<td colspan="7">${category}</td>`;
      skillsTable.appendChild(groupRow);

      items.forEach((skill) => {
        const key = skillKey(skill.name);
        const isCircle = spellCircles.has(skill.name);
        const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
        const ascBonus = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
        const effectiveEnh = getEffectiveSkillEnhancive(key);
        const enhRank = effectiveEnh.rank;
        const enhBonus = effectiveEnh.bonus;
        const baseBonus = skillBonusFromRanks(baseRanks);
        const finalRanks = Math.max(0, baseRanks + enhRank);
        const finalBonus = skillBonusFromRanks(finalRanks) + ascBonus + enhBonus;
        const baseBonusDisplay = isCircle ? "—" : String(baseBonus);
        const finalBonusDisplay = isCircle ? "—" : String(finalBonus);
        const nextCostDisplay = getNextRankCostDisplay(skill);
        const cap = capsBySkill.get(key);
        const maxRanksDisplay = cap ? (cap.pooled ? "—" : String(cap.maxRanks)) : "—";
        const rankInputMax = cap ? Math.max(cap.maxRanks, baseRanks) : 500;

        if (cap?.pooled && !renderedPoolHeaders.has(cap.poolKey)) {
          const poolRow = document.createElement("tr");
          poolRow.className = "skills-group-row";
          poolRow.dataset.poolKey = cap.poolKey;
          poolRow.dataset.poolLabel = cap.poolLabel;
          poolRow.innerHTML = `<td colspan="7">${formatPoolHeaderText(cap.poolLabel, cap.poolUsed, cap.poolMax)}</td>`;
          skillsTable.appendChild(poolRow);
          renderedPoolHeaders.add(cap.poolKey);
        }

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${skill.name}</td>
          <td><input type="number" min="0" max="${rankInputMax}" step="1" data-skill-rank="${key}" value="${baseRanks}" /></td>
          <td data-skill-field="base-bonus">${baseBonusDisplay}</td>
          <td data-skill-field="next-cost">${nextCostDisplay}</td>
          <td data-skill-field="max-ranks">${maxRanksDisplay}</td>
          <td data-skill-field="final-ranks">${finalRanks}</td>
          <td data-skill-field="final-bonus">${finalBonusDisplay}</td>
        `;
        row.dataset.skillKey = key;
        row.dataset.isCircle = isCircle ? "1" : "0";
        if (skillsImportUnmatchedKeys.has(key) || skillsImportOffProfessionKeys.has(key)) {
          row.style.color = "#b42318";
        }
        skillsTable.appendChild(row);
      });
    });
  }

  function updateSkillsDerivedDisplay({
    skillsTable,
    currentSkills,
    skillKey,
    ascensionState,
    getEffectiveSkillEnhancive,
    skillBonusFromRanks,
    capsByPool,
    getCapForKey,
    formatPoolHeaderText,
    getNextRankCostDisplay,
  }) {
    if (!skillsTable) return;
    skillsTable.querySelectorAll("tr[data-pool-key]").forEach((row) => {
      const poolKey = row.dataset.poolKey;
      const poolLabel = row.dataset.poolLabel || "Pool";
      const pool = capsByPool.get(poolKey);
      const cell = row.firstElementChild;
      if (pool && cell) {
        cell.textContent = formatPoolHeaderText(poolLabel, pool.poolUsed, pool.poolMax);
      }
    });

    skillsTable.querySelectorAll("tr[data-skill-key]").forEach((row) => {
      const key = row.dataset.skillKey;
      const isCircle = row.dataset.isCircle === "1";
      const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
      if (!skill) return;
      const baseRanks = Math.max(0, Math.trunc(Number(skill.ranks) || 0));
      const ascBonus = Math.max(0, Math.trunc(Number(ascensionState.skills?.[key]?.bonus) || 0));
      const effectiveEnh = getEffectiveSkillEnhancive(key);
      const enhRank = effectiveEnh.rank;
      const enhBonus = effectiveEnh.bonus;
      const baseBonus = skillBonusFromRanks(baseRanks);
      const finalRanks = Math.max(0, baseRanks + enhRank);
      const finalBonus = skillBonusFromRanks(finalRanks) + ascBonus + enhBonus;
      const cap = getCapForKey ? getCapForKey(key) : null;
      const baseBonusCell = row.querySelector('[data-skill-field="base-bonus"]');
      const nextCostCell = row.querySelector('[data-skill-field="next-cost"]');
      const maxRanksCell = row.querySelector('[data-skill-field="max-ranks"]');
      const finalRanksCell = row.querySelector('[data-skill-field="final-ranks"]');
      const finalBonusCell = row.querySelector('[data-skill-field="final-bonus"]');
      if (baseBonusCell) baseBonusCell.textContent = isCircle ? "—" : String(baseBonus);
      if (nextCostCell) nextCostCell.textContent = getNextRankCostDisplay(skill);
      if (maxRanksCell) maxRanksCell.textContent = cap ? (cap.pooled ? "—" : String(cap.maxRanks)) : "—";
      if (finalRanksCell) finalRanksCell.textContent = String(finalRanks);
      if (finalBonusCell) finalBonusCell.textContent = isCircle ? "—" : String(finalBonus);
    });
  }

  return {
    refreshProfileSelect,
    updateEnhanciveImportStatusMessages,
    updateTrainingPointEstimateDisplay,
    updateAscensionPointEstimateDisplay,
    updateStatDerivedDisplay,
    updateEnhanciveDisplay,
    updateEnhStatus,
    updateAscensionStatus,
    renderEnhanciveTables,
    renderAscensionTables,
    renderImportedEnhanciveTables,
    renderSkillsTable,
    updateSkillsDerivedDisplay,
  };
});
