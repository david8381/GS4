(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileEvents = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function bindTextParsingEvents(element, handler) {
    if (!element || typeof handler !== "function") return;
    element.addEventListener("input", handler);
    element.addEventListener("change", handler);
    element.addEventListener("paste", () => {
      setTimeout(handler, 0);
    });
  }

  function reportImportError(statusElement, label, error) {
    if (!statusElement) return;
    const message = error && error.message ? error.message : String(error || "Unknown error");
    statusElement.textContent = `${label} error: ${message}`;
    statusElement.style.color = "#b42318";
  }

  function bindSkillRankInputs({
    skillsTable,
    currentSkills,
    skillKey,
    buildSkillRankCapContext,
    updateSkillsImportFlags,
    updateSkillsStatusMessage,
    updateDerivedDisplays,
  }) {
    skillsTable?.querySelectorAll('input[data-skill-rank]').forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.skillRank;
        const skill = currentSkills.find((entry) => skillKey(entry.name) === key);
        if (!skill) return;
        const requested = Math.max(0, Math.trunc(Number(input.value) || 0));
        const cap = buildSkillRankCapContext(currentSkills).bySkill.get(key);
        const capped = cap ? Math.min(requested, cap.maxRanks) : requested;
        skill.ranks = capped;
        if (String(capped) !== String(input.value)) input.value = String(capped);
        updateSkillsImportFlags();
        updateSkillsStatusMessage();
        updateDerivedDisplays({ skipSkillsRender: true, skipStatsRender: true, skipAscRender: true, skipEnhRender: true });
      });
    });
  }

  function bindStatLevel0Inputs({
    statGrid,
    clamp,
    stats,
    getCurrentLevel0Stats,
    setCurrentLevel0Stats,
    getCurrentBaseStats,
    recalcFromLevel0,
  }) {
    statGrid?.querySelectorAll('input[data-field="level0"]').forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.stat;
        const value = clamp(Number(input.value), 1, 100);
        let currentLevel0Stats = getCurrentLevel0Stats();
        if (!currentLevel0Stats) {
          currentLevel0Stats = {};
          const currentBaseStats = getCurrentBaseStats() || {};
          (stats || []).forEach((stat) => {
            currentLevel0Stats[stat.key] = clamp(Number(currentBaseStats[stat.key] ?? 50), 1, 100);
          });
        }
        currentLevel0Stats[key] = value;
        setCurrentLevel0Stats(currentLevel0Stats);
        recalcFromLevel0();
      });
    });
  }

  function bindAscensionInputs({
    ascAbilityGroups,
    currentAscensionAbilities,
    clamp,
    getMaxAllowedAscensionRanks,
    totalAscensionPointsAvailable,
    calculateAscensionPointsUsed,
    syncAscensionStateFromAbilities,
    updateDerivedDisplays,
  }) {
    ascAbilityGroups?.querySelectorAll("input[data-asc-ability]").forEach((input) => {
      const handleAscensionInput = (options = {}) => {
        const { rerender = false } = options;
        const mnemonic = String(input.dataset.ascAbility || "");
        const ability = currentAscensionAbilities.find((entry) => entry.mnemonic === mnemonic);
        if (!ability) return;

        const desired = clamp(Math.trunc(Number(input.value) || 0), 0, ability.cap);
        const maxByGate = getMaxAllowedAscensionRanks(ability, currentAscensionAbilities);
        const available = totalAscensionPointsAvailable();

        ability.ranks = Math.min(desired, maxByGate);
        let used = calculateAscensionPointsUsed();
        if (used > available) {
          let affordable = ability.ranks;
          while (affordable > 0) {
            affordable -= 1;
            ability.ranks = affordable;
            used = calculateAscensionPointsUsed();
            if (used <= available) break;
          }
        }
        input.value = String(ability.ranks);
        syncAscensionStateFromAbilities();
        updateDerivedDisplays({
          skipSkillsRender: true,
          skipEnhRender: true,
          skipAscRender: !rerender,
        });
      };

      input.addEventListener("input", () => handleAscensionInput({ rerender: false }));
      input.addEventListener("change", () => handleAscensionInput({ rerender: true }));
      input.addEventListener("blur", () => handleAscensionInput({ rerender: true }));
    });
  }

  function bindImportedEnhanciveInputs({
    enhImportedItemsTable,
    enhImportedUnresolvedTable,
    enhManualResolutionTable,
    currentEnhanciveEquipment,
    normalizeEnhanciveEffectForUse,
    guessEnhanciveEffectType,
    createManualEnhanciveItem,
    buildEnhanciveTargetOptions,
    updateDerivedDisplays,
    updateProfileActionState,
    getApplyingProfile,
  }) {
    enhImportedItemsTable?.querySelectorAll("[data-imported-enh-active]").forEach((input) => {
      input.addEventListener("change", () => {
        const item = currentEnhanciveEquipment.importedSnapshot.items.find((entry) => entry.id === input.dataset.importedEnhActive);
        if (!item) return;
        item.active = input.checked;
        updateDerivedDisplays({ skipAscRender: true });
      });
    });

    enhImportedUnresolvedTable?.querySelectorAll("[data-resolve-enh-imported]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = currentEnhanciveEquipment.importedSnapshot.unresolved.find((item) => item.id === button.dataset.resolveEnhImported);
        if (!entry) return;
        const targetSelect = enhImportedUnresolvedTable.querySelector(`[data-resolve-enh-target="${entry.id}"]`);
        const selectedItem = currentEnhanciveEquipment.importedSnapshot.items.find((item) => item.id === targetSelect?.value);
        const resolvedEffect = normalizeEnhanciveEffectForUse({
          category: entry.category,
          type: guessEnhanciveEffectType(entry.category, entry.label),
          label: entry.label,
          target: entry.target,
          value: entry.value,
          limit: entry.limit,
          knownSource: true,
        });
        if (selectedItem) {
          const existingStandalone = currentEnhanciveEquipment.manualResolutions.items.find((item) => {
            const effect = item?.effects?.[0] || {};
            return !String(item?.linkedImportedName || "").trim()
              && String(item?.name || "").trim() === String(selectedItem.name || "").trim()
              && String(effect.type || "") === String(resolvedEffect.type || "")
              && String(effect.target || "") === String(resolvedEffect.target || "")
              && Math.trunc(Number(effect.value) || 0) === Math.trunc(Number(resolvedEffect.value) || 0)
              && Math.trunc(Number(effect.limit) || 0) === Math.trunc(Number(resolvedEffect.limit) || 0);
          });

          if (existingStandalone) {
            existingStandalone.linkedImportedName = selectedItem.name;
            existingStandalone.active = true;
          } else {
            currentEnhanciveEquipment.manualResolutions.items.push(createManualEnhanciveItem({
              name: selectedItem.name,
              linkedImportedName: selectedItem.name,
              category: entry.category,
              type: resolvedEffect.type,
              label: resolvedEffect.label,
              target: resolvedEffect.target,
              value: resolvedEffect.value,
              limit: resolvedEffect.limit,
              active: true,
            }));
          }
        } else {
          currentEnhanciveEquipment.manualResolutions.items.push(createManualEnhanciveItem({
            name: "Resolved Enhancive",
            category: entry.category,
            type: resolvedEffect.type,
            label: resolvedEffect.label,
            target: resolvedEffect.target,
            value: resolvedEffect.value,
            limit: resolvedEffect.limit,
          }));
        }
        currentEnhanciveEquipment.manualResolutions.resolvedFromImported.push(entry.id);
        updateDerivedDisplays({ skipAscRender: true });
      });
    });

    enhManualResolutionTable?.querySelectorAll("[data-manual-enh-name]").forEach((input) => {
      input.addEventListener("input", () => {
        const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === input.dataset.manualEnhName);
        if (!item) return;
        item.name = input.value.trim() || "Manual Enhancive";
        if (!getApplyingProfile()) updateProfileActionState();
      });
    });

    enhManualResolutionTable?.querySelectorAll("[data-manual-enh-active]").forEach((input) => {
      input.addEventListener("change", () => {
        const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === input.dataset.manualEnhActive);
        if (!item) return;
        item.active = input.checked;
        updateDerivedDisplays({ skipAscRender: true });
      });
    });

    enhManualResolutionTable?.querySelectorAll("[data-manual-enh-type]").forEach((select) => {
      inputOrChange(select, "change", () => {
        const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === select.dataset.manualEnhType);
        if (!item || !item.effects[0]) return;
        item.effects[0].type = select.value;
        item.effects[0].target = buildEnhanciveTargetOptions(select.value)[0]?.value || "";
        updateDerivedDisplays({ skipAscRender: true });
      });
    });

    enhManualResolutionTable?.querySelectorAll("[data-manual-enh-target]").forEach((select) => {
      inputOrChange(select, "change", () => {
        const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === select.dataset.manualEnhTarget);
        if (!item || !item.effects[0]) return;
        item.effects[0].target = select.value;
        updateDerivedDisplays({ skipAscRender: true });
      });
    });

    enhManualResolutionTable?.querySelectorAll("[data-manual-enh-value]").forEach((input) => {
      input.addEventListener("input", () => {
        const item = currentEnhanciveEquipment.manualResolutions.items.find((entry) => entry.id === input.dataset.manualEnhValue);
        if (!item || !item.effects[0]) return;
        item.effects[0].value = Math.max(0, Math.trunc(Number(input.value) || 0));
        updateDerivedDisplays({ skipAscRender: true });
      });
    });

    enhManualResolutionTable?.querySelectorAll("[data-delete-manual-enh]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.deleteManualEnh;
        currentEnhanciveEquipment.manualResolutions.items = currentEnhanciveEquipment.manualResolutions.items.filter((item) => item.id !== targetId);
        updateDerivedDisplays({ skipAscRender: true });
      });
    });
  }

  function bindSaveButtons({ saveProfileButtons, handleProfileSave }) {
    saveProfileButtons.forEach((button) => {
      button.addEventListener("click", handleProfileSave);
    });
  }

  function bindInfoImportEvents({
    infoImport,
    parseInfoStartBlock,
    handleInfoStartParse,
    parseInfoBlock,
    importStatus,
    profileName,
    races,
    profileRace,
    stats,
    clamp,
    currentBaseStats,
    setCurrentLevel0Stats,
    initAdjustmentState,
    updateDerivedDisplays,
  }) {
    const handleInfoImport = () => {
      try {
        const parsedStart = parseInfoStartBlock(infoImport.value);
        if (parsedStart) {
          handleInfoStartParse();
          return;
        }

        const parsed = parseInfoBlock(infoImport.value);
        if (!parsed) {
          importStatus.textContent = "Run INFO START. Paste full output.";
          importStatus.style.color = "";
          return;
        }

        importStatus.textContent = `Parsed ${parsed.name} (${parsed.race}). Enter a profile name, then create or update the profile.`;
        importStatus.style.color = "";
        profileName.value = parsed.name;
        const parsedRaceName = String(parsed.race || "").trim();
        const raceOption = parsedRaceName
          ? races.find((race) => String(race.name || "").toLowerCase() === parsedRaceName.toLowerCase())
          : null;
        if (raceOption) profileRace.value = raceOption.key;
        setCurrentLevel0Stats(null);
        Object.keys(currentBaseStats).forEach((key) => delete currentBaseStats[key]);
        initAdjustmentState();
        stats.forEach((stat) => {
          const row = parsed.stats[stat.key];
          const baseStat = clamp(Number(row?.base ?? 50), 1, 200);
          currentBaseStats[stat.key] = baseStat;
        });
        updateDerivedDisplays();
      } catch (error) {
        reportImportError(importStatus, "INFO import", error);
      }
    };

    bindTextParsingEvents(infoImport, handleInfoImport);
  }

  function bindExperienceEvents({
    expImport,
    parseExpBlock,
    expImportStatus,
    setSyncingLevelExperience,
    profileExperience,
    profileLevel,
    setCurrentAscensionExperience,
    profileAscensionExperience,
    recalcFromLevel0,
    hasCurrentLevel0Stats,
    renderSkillsTable,
    getCurrentSkills,
    profileAscensionMilestones,
    setCurrentAscensionMilestones,
    updateDerivedDisplays,
    clamp,
    getSyncingLevelExperience,
    levelFromExperience,
  }) {
    bindTextParsingEvents(expImport, () => {
      try {
        const parsed = parseExpBlock(expImport.value);
        if (!parsed) {
          expImportStatus.textContent = "Paste EXP to load level and experience.";
          expImportStatus.style.color = "";
          return;
        }
        setSyncingLevelExperience(true);
        profileExperience.value = String(parsed.experience);
        profileLevel.value = String(parsed.level);
        setSyncingLevelExperience(false);
        setCurrentAscensionExperience(parsed.ascensionExperience);
        if (profileAscensionExperience) profileAscensionExperience.value = String(parsed.ascensionExperience);
        expImportStatus.textContent = `Parsed EXP: level ${parsed.level}, experience ${parsed.experience}, asc exp ${parsed.ascensionExperience}.`;
        expImportStatus.style.color = "";
        if (hasCurrentLevel0Stats()) recalcFromLevel0();
        else renderSkillsTable(getCurrentSkills());
      } catch (error) {
        reportImportError(expImportStatus, "EXP import", error);
      }
    });

    profileAscensionExperience?.addEventListener("input", () => {
      const value = Math.max(0, Math.trunc(Number(profileAscensionExperience.value) || 0));
      profileAscensionExperience.value = String(value);
      setCurrentAscensionExperience(value);
      updateDerivedDisplays();
    });

    profileAscensionMilestones?.addEventListener("input", () => {
      const value = clamp(Math.trunc(Number(profileAscensionMilestones.value) || 0), 0, 10);
      profileAscensionMilestones.value = String(value);
      setCurrentAscensionMilestones(value);
      updateDerivedDisplays();
    });
  }

  function bindSkillsImportEvents({
    skillsImport,
    parseSkillsBlock,
    setSkillsImportUnmatchedKeys,
    setSkillsImportOffProfessionKeys,
    updateSkillsStatusMessage,
    canonicalSkillName,
    skillKey,
    skillCatalog,
    setCurrentSkills,
    mergeSkillsWithCatalog,
    updateSkillsImportFlags,
    syncSkillAdjustmentState,
    updateDerivedDisplays,
    parseSkillsLevel,
    setSyncingLevelExperience,
    profileLevel,
    setExperienceFromLevel,
    hasCurrentLevel0Stats,
    recalcFromLevel0,
  }) {
    bindTextParsingEvents(skillsImport, () => {
      try {
        const parsed = parseSkillsBlock(skillsImport.value);
        if (!parsed.length) {
          setSkillsImportUnmatchedKeys(new Set());
          setSkillsImportOffProfessionKeys(new Set());
          updateSkillsStatusMessage();
          return;
        }
        const unmatched = new Set();
        const importedSkills = parsed.map((skill) => {
          const canonical = canonicalSkillName(skill.name);
          const canonicalKey = skillKey(canonical || skill.name);
          const matched = skillCatalog.some((entry) => skillKey(entry) === canonicalKey);
          if (!matched) unmatched.add(canonicalKey);
          return {
            name: canonical || skill.name,
            ranks: Math.max(0, Math.trunc(Number(skill.ranks) || 0)),
          };
        });
        setSkillsImportUnmatchedKeys(unmatched);
        setCurrentSkills(mergeSkillsWithCatalog(importedSkills));
        updateSkillsImportFlags();
        updateSkillsStatusMessage(`Parsed ${parsed.length} skills.`);
        syncSkillAdjustmentState();
        updateDerivedDisplays();

        const level = parseSkillsLevel(skillsImport.value);
        if (level != null) {
          setSyncingLevelExperience(true);
          profileLevel.value = String(level);
          setExperienceFromLevel(level);
          setSyncingLevelExperience(false);
          if (hasCurrentLevel0Stats()) recalcFromLevel0();
        }
      } catch (error) {
        updateSkillsStatusMessage(`Skills import error: ${error.message || error}`);
      }
    });
  }

  function bindArmorAndCoreFieldEvents({
    armorAsgSelect,
    updateArmorWeight,
    useCustomArmorBaseInput,
    armorBaseWeightInput,
    armorBaseDetails,
    armorAsg,
    profileLevel,
    clamp,
    getSyncingLevelExperience,
    setSyncingLevelExperience,
    setExperienceFromLevel,
    hasCurrentLevel0Stats,
    recalcFromLevel0,
    renderSkillsTable,
    getCurrentSkills,
    profileExperience,
    levelFromExperience,
    profileProfession,
    updateSkillsImportFlags,
    updateSkillsStatusMessage,
    profileRaceSelect,
    updateDerivedDisplays,
  }) {
    armorAsgSelect.addEventListener("change", updateArmorWeight);
    useCustomArmorBaseInput?.addEventListener("change", () => {
      if (armorBaseWeightInput) armorBaseWeightInput.disabled = !useCustomArmorBaseInput.checked;
      if (armorBaseDetails) armorBaseDetails.open = useCustomArmorBaseInput.checked;
      if (!useCustomArmorBaseInput.checked) {
        const selected = armorAsg.find((item) => item.key === armorAsgSelect.value);
        if (selected && armorBaseWeightInput) armorBaseWeightInput.value = String(selected.standardWeight);
      }
    });

    profileLevel.addEventListener("input", () => {
      const level = clamp(Number(profileLevel.value), 0, 100);
      if (!getSyncingLevelExperience()) {
        setSyncingLevelExperience(true);
        profileLevel.value = String(level);
        setExperienceFromLevel(level);
        setSyncingLevelExperience(false);
      }
      if (hasCurrentLevel0Stats()) {
        recalcFromLevel0();
        return;
      }
      renderSkillsTable(getCurrentSkills());
    });

    profileExperience.addEventListener("input", () => {
      if (getSyncingLevelExperience()) return;
      const experience = Math.max(0, Math.trunc(Number(profileExperience.value) || 0));
      const derivedLevel = levelFromExperience(experience);
      setSyncingLevelExperience(true);
      profileExperience.value = String(experience);
      profileLevel.value = String(derivedLevel);
      setSyncingLevelExperience(false);
      if (hasCurrentLevel0Stats()) {
        recalcFromLevel0();
        return;
      }
      renderSkillsTable(getCurrentSkills());
    });

    profileProfession.addEventListener("change", () => {
      if (hasCurrentLevel0Stats()) recalcFromLevel0();
      updateSkillsImportFlags();
      updateSkillsStatusMessage();
      renderSkillsTable(getCurrentSkills());
    });

    profileRaceSelect.addEventListener("change", () => {
      updateDerivedDisplays();
      if (hasCurrentLevel0Stats()) recalcFromLevel0();
    });
  }

  function bindAscensionImportEvents({
    ascImport,
    ascImportStatus,
    applyAscList,
    ascMilestonesImport,
    parseAscMilestonesBlock,
    ascMilestonesImportStatus,
    setCurrentAscensionMilestones,
    profileAscensionMilestones,
    updateDerivedDisplays,
    ascShowTrainedOnly,
    renderAscensionTables,
    updateAscensionStatus,
  }) {
    bindTextParsingEvents(ascImport, () => {
      try {
        if (!ascImport.value.trim()) {
          ascImportStatus.textContent = "Paste ASC LIST to load current ascension ranks.";
          ascImportStatus.style.color = "";
          return;
        }
        applyAscList(ascImport.value, { showError: false });
      } catch (error) {
        reportImportError(ascImportStatus, "ASC LIST import", error);
      }
    });

    bindTextParsingEvents(ascMilestonesImport, () => {
      try {
        const text = String(ascMilestonesImport.value || "");
        if (!text.trim()) {
          if (ascMilestonesImportStatus) {
            ascMilestonesImportStatus.textContent = "Paste ASC MILESTONES to load milestones reached.";
            ascMilestonesImportStatus.style.color = "";
          }
          return;
        }

        const reached = parseAscMilestonesBlock(text);
        if (reached == null) {
          if (ascMilestonesImportStatus) {
            ascMilestonesImportStatus.textContent = "Could not parse ASC MILESTONES output.";
            ascMilestonesImportStatus.style.color = "#b42318";
          }
          return;
        }

        setCurrentAscensionMilestones(reached);
        if (profileAscensionMilestones) profileAscensionMilestones.value = String(reached);
        updateDerivedDisplays();
        if (ascMilestonesImportStatus) {
          ascMilestonesImportStatus.textContent = `ASC MILESTONES loaded: ${reached}/10 reached.`;
          ascMilestonesImportStatus.style.color = "";
        }
      } catch (error) {
        reportImportError(ascMilestonesImportStatus, "ASC MILESTONES import", error);
      }
    });
    ascShowTrainedOnly?.addEventListener("change", () => {
      renderAscensionTables();
      updateAscensionStatus();
    });
  }

  function bindEnhanciveImportEvents({
    enhanciveListImport,
    enhanciveTotalsImport,
    enhanciveDetailsImport,
    rebuildImportedEnhanciveState,
    updateDerivedDisplays,
    addManualEnhItem,
    getCurrentEnhanciveEquipment,
    createManualEnhanciveItem,
  }) {
    bindTextParsingEvents(enhanciveListImport, () => {
      try {
        rebuildImportedEnhanciveState();
        updateDerivedDisplays({ skipAscRender: true });
      } catch (error) {
        reportImportError(null, "Enhancive list import", error);
      }
    });
    bindTextParsingEvents(enhanciveTotalsImport, () => {
      try {
        rebuildImportedEnhanciveState();
        updateDerivedDisplays({ skipAscRender: true });
      } catch (error) {
        reportImportError(null, "Enhancive totals import", error);
      }
    });
    bindTextParsingEvents(enhanciveDetailsImport, () => {
      try {
        rebuildImportedEnhanciveState();
        updateDerivedDisplays({ skipAscRender: true });
      } catch (error) {
        reportImportError(null, "Enhancive details import", error);
      }
    });

    addManualEnhItem?.addEventListener("click", () => {
      getCurrentEnhanciveEquipment().manualResolutions.items.push(createManualEnhanciveItem({
        name: "Manual Enhancive",
        type: "stat",
        target: "str",
        label: "Strength",
        value: 0,
      }));
      updateDerivedDisplays({ skipAscRender: true });
    });
  }

  function bindDirtyStateEvents({
    mainCalculator,
    isApplyingProfile,
    updateProfileActionState,
    skillsShowTrainedOnly,
    renderSkillsTable,
    getCurrentSkills,
  }) {
    mainCalculator?.addEventListener("input", () => {
      if (!isApplyingProfile()) updateProfileActionState();
    });
    mainCalculator?.addEventListener("change", () => {
      if (!isApplyingProfile()) updateProfileActionState();
    });

    skillsShowTrainedOnly?.addEventListener("change", () => {
      renderSkillsTable(getCurrentSkills());
    });
  }

  function bindSelectionControls({
    profileApply,
    reloadProfileButtons,
    profileSelect,
    localStorageObject,
    selectedProfileKey,
    resetEditorForNewProfile,
    applySectionDefaultVisibility,
    updateProfileActionState,
    storage,
    getProfiles,
    applyProfile,
    reloadSelectedProfile,
  }) {
    profileApply.addEventListener("click", () => {
      reloadSelectedProfile(true);
    });

    reloadProfileButtons.forEach((button) => {
      button.addEventListener("click", () => {
        reloadSelectedProfile(true);
      });
    });

    profileSelect.addEventListener("change", () => {
      const selected = profileSelect.value;
      if (selected) localStorageObject.setItem(selectedProfileKey, selected);
      else localStorageObject.removeItem(selectedProfileKey);
      if (!selected) {
        resetEditorForNewProfile();
        applySectionDefaultVisibility();
        updateProfileActionState();
        return;
      }
      const profile = storage.findProfile(getProfiles(), selected);
      if (profile) {
        applyProfile(profile);
        applySectionDefaultVisibility();
      }
    });
  }

  function inputOrChange(element, eventName, handler) {
    element.addEventListener(eventName, handler);
  }

  return {
    bindStatLevel0Inputs,
    bindSkillRankInputs,
    bindAscensionInputs,
    bindImportedEnhanciveInputs,
    bindSaveButtons,
    bindInfoImportEvents,
    bindExperienceEvents,
    bindSkillsImportEvents,
    bindArmorAndCoreFieldEvents,
    bindAscensionImportEvents,
    bindEnhanciveImportEvents,
    bindDirtyStateEvents,
    bindSelectionControls,
  };
});
