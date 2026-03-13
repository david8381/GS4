(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileGstools = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function decodeBase64UrlUtf8(input) {
    if (!input) return "";
    const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  async function importGstoolsPayloadFromHash({
    windowObject,
    stripMarkupTags,
    infoImport,
    skillsImport,
    expImport,
    societyImport,
    ascImport,
    ascMilestonesImport,
    enhanciveListImport,
    enhanciveTotalsImport,
    enhanciveDetailsImport,
    profileName,
    handleProfileSave,
    importStatus,
  }) {
    const rawHash = String(windowObject.location.hash || "").replace(/^#/, "");
    if (!rawHash) {
      try {
        const pendingNotice = String(windowObject.sessionStorage?.getItem("gs4toolsImportNotice") || "");
        if (pendingNotice && importStatus) {
          importStatus.textContent = pendingNotice;
          importStatus.style.color = "";
          windowObject.sessionStorage.removeItem("gs4toolsImportNotice");
        }
      } catch (error) {
        // Ignore sessionStorage failures and leave the default status text alone.
      }
      return;
    }

    let encoded = "";
    let nextTarget = "";
    if (rawHash.includes("=")) {
      const hashParams = new URLSearchParams(rawHash);
      encoded = hashParams.get("gstools") || "";
      nextTarget = String(hashParams.get("next") || "").trim().toLowerCase();
    } else {
      return;
    }
    if (!encoded) return;

    try {
      const jsonText = decodeBase64UrlUtf8(encoded);
      const payload = JSON.parse(jsonText);
      const blocks = payload?.blocks || {};
      const payloadCharacterName = stripMarkupTags(payload?.character || "");

      dispatchIfText(infoImport, blocks.infoStart);
      dispatchIfText(skillsImport, blocks.skills);
      dispatchIfText(expImport, blocks.exp);
      dispatchIfText(societyImport, blocks.society);
      dispatchIfText(ascImport, blocks.ascList);
      dispatchIfText(ascMilestonesImport, blocks.ascMilestones);
      dispatchIfText(enhanciveListImport, blocks.enhanciveList, true);
      dispatchIfText(enhanciveTotalsImport, blocks.enhanciveTotals, true);
      dispatchIfText(enhanciveDetailsImport, blocks.enhanciveTotalsDetails, true);

      if (payloadCharacterName) {
        profileName.value = payloadCharacterName;
      }

      let saveError = null;
      let savedProfile = null;
      try {
        savedProfile = handleProfileSave({ preserveUnsyncedFromExisting: true });
      } catch (error) {
        saveError = error;
        console.error("gstools hash import auto-save failed", error);
      }

      if (saveError) {
        const stackLine = String(saveError.stack || "").split("\n")[1]?.trim() || "";
        importStatus.textContent = `Imported quick-start blocks from gstools payload, but profile auto-save failed: ${saveError.message || "unknown error"}${stackLine ? ` (${stackLine})` : ""}.`;
        importStatus.style.color = "#b42318";
        return;
      }

      if (!savedProfile) {
        importStatus.textContent = `Imported quick-start blocks from gstools payload, but could not save profile: enter a profile name.`;
        importStatus.style.color = "#b42318";
        return;
      }

      const successMessage = `Imported quick-start blocks and automatically updated profile${payloadCharacterName ? `: ${payloadCharacterName}` : ""}.`;
      importStatus.textContent = successMessage;
      importStatus.style.color = "";
      const nextPageByKey = {
        profile: "",
        home: "../index.html",
        encumbrance: "../encumbrance.html",
        calculator: "../calculator.html",
        spells: "../spells.html",
        badge: "../badge.html",
        resources: "../profession-services/resources.html",
        "stat-optimizer": "../stat-optimizer/stat-optimizer.html",
        lumnis: "../lumnis.html",
        "violet-orb": "../violet-orb.html",
      };
      const redirectUrl = nextPageByKey[nextTarget] || "";
      if (redirectUrl) {
        windowObject.location.assign(redirectUrl);
        return;
      }
      const cleanUrl = `${windowObject.location.pathname}${windowObject.location.search}`;
      try {
        windowObject.sessionStorage?.setItem("gs4toolsImportNotice", successMessage);
      } catch (error) {
        // Ignore sessionStorage failures and fall back to the current page state.
      }
      windowObject.location.replace(cleanUrl);
    } catch (error) {
      console.error("gstools hash import failed", error);
      importStatus.textContent = `Could not import gstools payload from URL hash: ${error?.message || "unknown error"}.`;
      importStatus.style.color = "#b42318";
    }
  }

  function dispatchIfText(element, text, allowEmptyString = false) {
    if (!element) return;
    if (typeof text !== "string") return;
    if (!allowEmptyString && !text.trim()) return;
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return {
    decodeBase64UrlUtf8,
    importGstoolsPayloadFromHash,
  };
});
