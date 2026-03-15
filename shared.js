(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    const shared = factory();
    root.GS4Storage = shared.GS4Storage;
    root.GS4Util = shared.GS4Util;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PROFILE_KEY = "gs4.characterProfiles";
  const SELECTED_PROFILE_KEY = "gs4.selectedProfileId";
  const THEME_KEY = "gs4.theme";

  function loadProfiles() {
    try {
      const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
      if (Array.isArray(stored)) return stored;
    } catch (_error) {
      return [];
    }
    return [];
  }

  function saveProfiles(profiles) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(Array.isArray(profiles) ? profiles : []));
  }

  function findProfile(profiles, idOrName) {
    const entries = Array.isArray(profiles) ? profiles : [];
    return entries.find((entry) => entry?.id === idOrName || entry?.name === idOrName) || null;
  }

  function clamp(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(Math.max(number, min), max);
  }

  function toInt(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.trunc(number) : fallback;
  }

  function normalizeRaceForModifierLookup(raw) {
    const text = String(raw || "");
    if (!text) return "";
    const cleaned = text.toLowerCase().replace(/[^a-z]/g, "");
    if (cleaned === "aelotoi") return "Aelotoi";
    if (cleaned === "burghalgnome" || cleaned === "bgnome") return "Burghal Gnome";
    if (cleaned === "darkelf") return "Dark Elf";
    if (cleaned === "dwarf") return "Dwarf";
    if (cleaned === "elf") return "Elf";
    if (cleaned === "erithian") return "Erithian";
    if (cleaned === "forestgnome" || cleaned === "fgnome") return "Forest Gnome";
    if (cleaned === "giantman") return "Giantman";
    if (cleaned === "halfelf") return "Half-Elf";
    if (cleaned === "halfkrolvin") return "Half-Krolvin";
    if (cleaned === "halfling") return "Halfling";
    if (cleaned === "human") return "Human";
    if (cleaned === "sylvan" || cleaned === "sylvankind") return "Sylvankind";
    return text;
  }

  function stateEquals(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return {
    GS4Storage: {
      PROFILE_KEY,
      SELECTED_PROFILE_KEY,
      THEME_KEY,
      loadProfiles,
      saveProfiles,
      findProfile,
    },
    GS4Util: {
      clamp,
      toInt,
      normalizeRaceForModifierLookup,
      stateEquals,
    },
  };
});

// Apply saved theme immediately to prevent flash of wrong theme.
(function () {
  if (typeof localStorage === "undefined" || typeof document === "undefined") return;
  var saved = localStorage.getItem("gs4.theme");
  var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
})();
