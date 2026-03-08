(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EnhanciveImport = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function asNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function asInteger(value, fallback = 0) {
    return Math.trunc(asNumber(value, fallback));
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function defaultSummary() {
    return {
      itemCount: 0,
      propertyCount: 0,
      totalAmount: 0,
    };
  }

  function defaultEnhanciveEquipmentState() {
    return {
      enhancivesEnabled: true,
      lastImportedAt: "",
      raw: {
        list: "",
        totals: "",
        totalsDetails: "",
      },
      importedSnapshot: {
        items: [],
        unresolved: [],
        summary: defaultSummary(),
      },
      manualResolutions: {
        items: [],
        resolvedFromImported: [],
      },
    };
  }

  function normalizeEffect(effect) {
    if (!effect || typeof effect !== "object") return null;
    const value = asInteger(effect.value, 0);
    const limit = Math.max(0, asInteger(effect.limit, 0));
    return {
      category: String(effect.category || "").trim(),
      type: String(effect.type || "unknown").trim(),
      target: String(effect.target || "").trim(),
      label: String(effect.label || effect.target || "").trim(),
      value,
      limit,
      knownSource: effect.knownSource !== false,
    };
  }

  function normalizeEnhanciveItem(item, fallbackSource = "manual") {
    if (!item || typeof item !== "object") return null;
    const effects = Array.isArray(item.effects)
      ? item.effects.map(normalizeEffect).filter(Boolean)
      : [];
    return {
      id: String(item.id || "").trim() || `enh-item-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      name: String(item.name || "").trim() || "Unnamed Enhancive",
      worn: item.worn !== false,
      active: item.active !== false,
      source: String(item.source || fallbackSource).trim() || fallbackSource,
      effects,
    };
  }

  function normalizeUnresolvedEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    return {
      id: String(entry.id || "").trim() || `enh-unresolved-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      category: String(entry.category || "").trim(),
      type: String(entry.type || "unknown").trim(),
      target: String(entry.target || "").trim(),
      label: String(entry.label || entry.target || "").trim(),
      value: asInteger(entry.value, 0),
      limit: Math.max(0, asInteger(entry.limit, 0)),
      note: String(entry.note || "").trim(),
    };
  }

  function normalizeEnhanciveEquipmentState(raw) {
    const defaults = defaultEnhanciveEquipmentState();
    const incoming = raw && typeof raw === "object" ? raw : {};
    const importedSnapshot = incoming.importedSnapshot && typeof incoming.importedSnapshot === "object"
      ? incoming.importedSnapshot
      : {};
    const manualResolutions = incoming.manualResolutions && typeof incoming.manualResolutions === "object"
      ? incoming.manualResolutions
      : {};
    const summary = importedSnapshot.summary && typeof importedSnapshot.summary === "object"
      ? importedSnapshot.summary
      : {};

    return {
      enhancivesEnabled: incoming.enhancivesEnabled !== false,
      lastImportedAt: String(incoming.lastImportedAt || "").trim(),
      raw: {
        list: String(incoming.raw?.list || "").trim(),
        totals: String(incoming.raw?.totals || "").trim(),
        totalsDetails: String(incoming.raw?.totalsDetails || "").trim(),
      },
      importedSnapshot: {
        items: Array.isArray(importedSnapshot.items)
          ? importedSnapshot.items.map((item) => normalizeEnhanciveItem(item, "import")).filter(Boolean)
          : [],
        unresolved: Array.isArray(importedSnapshot.unresolved)
          ? importedSnapshot.unresolved.map(normalizeUnresolvedEntry).filter(Boolean)
          : [],
        summary: {
          itemCount: Math.max(0, asInteger(summary.itemCount, 0)),
          propertyCount: Math.max(0, asInteger(summary.propertyCount, 0)),
          totalAmount: Math.max(0, asInteger(summary.totalAmount, 0)),
        },
      },
      manualResolutions: {
        items: Array.isArray(manualResolutions.items)
          ? manualResolutions.items.map((item) => normalizeEnhanciveItem(item, "manual")).filter(Boolean)
          : [],
        resolvedFromImported: Array.isArray(manualResolutions.resolvedFromImported)
          ? manualResolutions.resolvedFromImported.map((id) => String(id || "").trim()).filter(Boolean)
          : [],
      },
    };
  }

  function parseEnhanciveListBlock(text) {
    const source = String(text || "");
    const lines = source.split(/\r?\n/);
    const items = [];
    let section = "";
    let itemCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^You are not holding any enhancive items\./i.test(trimmed)) {
        section = "holding";
        return;
      }
      if (/^You are holding the following enhancive items:/i.test(trimmed)) {
        section = "holding";
        return;
      }
      if (/^You are wearing the following enhancive items:/i.test(trimmed)) {
        section = "wearing";
        return;
      }

      const countMatch = trimmed.match(/^\(Items:\s*(\d+)\)$/i);
      if (countMatch) {
        itemCount = asInteger(countMatch[1], 0);
        return;
      }

      if (/^For more information,/i.test(trimmed)) return;

      if (section && /^\S/.test(trimmed)) {
        items.push({
          id: `import-list-${items.length + 1}`,
          name: trimmed,
          worn: section === "wearing",
          active: true,
          source: "import",
          effects: [],
        });
      }
    });

    return {
      items,
      summary: {
        itemCount: itemCount || items.length,
      },
    };
  }

  function parseEnhanciveDetailsBlock(text) {
    const source = String(text || "");
    const lines = source.split(/\r?\n/);
    const knownItems = new Map();
    const unresolved = [];
    const summary = defaultSummary();
    let category = "";
    let currentTarget = null;

    function ensureItem(name) {
      const key = normalizeText(name);
      if (!knownItems.has(key)) {
        knownItems.set(key, {
          id: `import-detail-${knownItems.size + 1}`,
          name: name.trim(),
          worn: true,
          active: true,
          source: "import",
          effects: [],
        });
      }
      return knownItems.get(key);
    }

    lines.forEach((line) => {
      const trimmed = line.trimEnd();
      if (!trimmed.trim()) return;

      const categoryMatch = trimmed.match(/^([A-Za-z][A-Za-z ]+):$/);
      if (categoryMatch) {
        category = categoryMatch[1].trim();
        currentTarget = null;
        return;
      }

      if (category === "Statistics") {
        const statLine = trimmed.trim().match(/^([^:]+):\s+(\d+)$/);
        if (!statLine) return;
        const label = normalizeText(statLine[1]);
        const value = asInteger(statLine[2], 0);
        if (label === "enhancive items") summary.itemCount = value;
        if (label === "enhancive properties") summary.propertyCount = value;
        if (label === "total enhancive amount") summary.totalAmount = value;
        return;
      }

      const targetMatch = trimmed.match(/^\s{2}(.+?):\s+([+-]?\d+)\/(\d+)\s*$/);
      if (targetMatch) {
        currentTarget = {
          category,
          label: targetMatch[1].trim(),
          value: asInteger(targetMatch[2], 0),
          limit: asInteger(targetMatch[3], 0),
        };
        return;
      }

      const contributionMatch = trimmed.match(/^\s{4}([+-]?\d+):\s+(.+?)\s*$/);
      if (contributionMatch && currentTarget) {
        const value = asInteger(contributionMatch[1], 0);
        const sourceName = contributionMatch[2].trim();
        const unresolvedSource = /unknown source|needs loresong/i.test(sourceName);
        if (unresolvedSource) {
          unresolved.push({
            id: `import-unresolved-${unresolved.length + 1}`,
            category: currentTarget.category,
            type: "unknown",
            target: currentTarget.label,
            label: currentTarget.label,
            value,
            limit: currentTarget.limit,
            note: sourceName,
          });
          return;
        }

        const item = ensureItem(sourceName);
        item.effects.push({
          category: currentTarget.category,
          type: "unknown",
          target: currentTarget.label,
          label: currentTarget.label,
          value,
          limit: currentTarget.limit,
          knownSource: true,
        });
      }
    });

    return {
      items: Array.from(knownItems.values()),
      unresolved,
      summary,
    };
  }

  function mergeImportedEnhanciveSnapshot(listText, totalsText, detailsText, importedAt = "") {
    const listParsed = parseEnhanciveListBlock(listText);
    const detailsParsed = parseEnhanciveDetailsBlock(detailsText);
    const itemByName = new Map();

    (listParsed.items || []).forEach((item) => {
      itemByName.set(normalizeText(item.name), normalizeEnhanciveItem(item, "import"));
    });

    (detailsParsed.items || []).forEach((item) => {
      const key = normalizeText(item.name);
      const existing = itemByName.get(key);
      if (existing) {
        existing.effects = existing.effects.concat(item.effects.map(normalizeEffect).filter(Boolean));
      } else {
        itemByName.set(key, normalizeEnhanciveItem(item, "import"));
      }
    });

    return {
      enhancivesEnabled: true,
      lastImportedAt: String(importedAt || "").trim(),
      raw: {
        list: String(listText || ""),
        totals: String(totalsText || ""),
        totalsDetails: String(detailsText || ""),
      },
      importedSnapshot: {
        items: Array.from(itemByName.values()),
        unresolved: detailsParsed.unresolved.map(normalizeUnresolvedEntry).filter(Boolean),
        summary: {
          itemCount: Math.max(detailsParsed.summary.itemCount || 0, listParsed.summary.itemCount || 0, itemByName.size),
          propertyCount: detailsParsed.summary.propertyCount || 0,
          totalAmount: detailsParsed.summary.totalAmount || 0,
        },
      },
      manualResolutions: {
        items: [],
        resolvedFromImported: [],
      },
    };
  }

  return {
    defaultEnhanciveEquipmentState,
    normalizeEnhanciveEquipmentState,
    parseEnhanciveListBlock,
    parseEnhanciveDetailsBlock,
    mergeImportedEnhanciveSnapshot,
  };
});
