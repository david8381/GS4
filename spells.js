(function () {
  const storage = globalThis.GS4Storage;
  const spellsData = globalThis.GS4_SPELLS_DATA;
  const colData = globalThis.GS4_COL_DATA;
  const volnData = globalThis.GS4_VOLN_DATA;
  const sunfistData = globalThis.GS4_SUNFIST_DATA;
  const logic = globalThis.SpellsLogic;
  const ui = globalThis.SpellsUI;

  if (!storage) throw new Error("GS4Storage is not loaded. Ensure shared.js loads before spells.js.");
  if (!spellsData) throw new Error("GS4_SPELLS_DATA is not loaded. Ensure data/spells.js loads before spells.js.");
  if (!colData) throw new Error("GS4_COL_DATA is not loaded. Ensure data/societies/col.js loads before spells.js.");
  if (!volnData) throw new Error("GS4_VOLN_DATA is not loaded. Ensure data/societies/voln.js loads before spells.js.");
  if (!sunfistData) throw new Error("GS4_SUNFIST_DATA is not loaded. Ensure data/societies/sunfist.js loads before spells.js.");
  if (!logic) throw new Error("SpellsLogic is not loaded. Ensure spells-logic.js loads before spells.js.");
  if (!ui) throw new Error("SpellsUI is not loaded. Ensure spells-ui.js loads before spells.js.");

  ui.init({
    storage,
    spellsData,
    societiesData: { col: colData, voln: volnData, sunfist: sunfistData },
    logic,
    windowObject: window,
    localStorageObject: localStorage,
  });
})();
