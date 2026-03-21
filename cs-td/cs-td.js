(() => {
  const storage = window.GS4Storage;
  const gs4Data = window.GS4_DATA;
  const csTdData = window.GS4_CS_TD_DATA;
  const logic = window.CsTdLogic;
  const spellsData = window.GS4_SPELLS_DATA;
  const spellsLogic = window.SpellsLogic;
  const societiesData = {
    col: window.GS4_COL_DATA,
    voln: window.GS4_VOLN_DATA,
    sunfist: window.GS4_SUNFIST_DATA,
  };

  if (!storage || !gs4Data || !csTdData || !logic) {
    console.error("CS/TD calculator dependencies are missing.");
    return;
  }

  window.CsTdUI.init({
    storage,
    gs4Data,
    csTdData,
    logic,
    spellsData,
    societiesData,
    spellsLogic,
  });
})();
