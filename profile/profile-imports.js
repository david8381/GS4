(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileImports = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function stripMarkupTags(value) {
    return String(value || "").replace(/<[^>]+>/g, "").trim();
  }

  function createParserSet(deps) {
    const {
      stats = [],
      normalizeRaceName = (value) => String(value || ""),
      clamp = (value) => value,
      levelThresholds = [],
    } = deps || {};

    function parseInfoBlock(text) {
      const nameMatch = text.match(/Name:\s*([^\n]+?)\s+Race:\s*([A-Za-z -]+?)(?:\s+Profession:|$)/i);
      if (!nameMatch) return null;

      const result = {
        name: stripMarkupTags(nameMatch[1].trim().split(/\s{2,}/)[0]),
        race: normalizeRaceName(nameMatch[2].trim()),
        stats: {},
      };

      stats.forEach((stat) => {
        const statMatch = text.match(
          new RegExp(
            `${stat.label}\\s*\\(${stat.abbr}\\):\\s*(\\d+)\\s*\\(([-+]?\\d+)\\)\\s*(?:\\.\\.\\.|…)\\s*(\\d+)\\s*\\(([-+]?\\d+)\\)`,
            "i"
          )
        );
        if (statMatch) {
          result.stats[stat.key] = {
            base: Number(statMatch[1]),
            baseBonus: Number(statMatch[2]),
            enhanced: Number(statMatch[3]),
            enhancedBonus: Number(statMatch[4]),
          };
        }
      });

      if (!result.stats.str || !result.stats.con) return null;
      return result;
    }

    function parseInfoStartBlock(text) {
      const cleaned = text.replace(/^s>\s?.*$/gim, "");
      const lines = cleaned.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const headerLine = lines.find((line) => /Level\s+0\s+Stats\s+for/i.test(line));
      const headerMatch = headerLine ? headerLine.match(/Level\s+0\s+Stats\s+for\s+([^,]+),\s+(.+)/i) : null;

      let name = "";
      let race = "";
      let profession = "";
      if (headerMatch) {
        name = stripMarkupTags(headerMatch[1].trim());
        const tail = headerMatch[2].trim().replace(/^[^A-Za-z]*/, "");
        const parts = tail.split(/\s+/);
        if (parts.length >= 2) {
          profession = parts.pop();
          race = normalizeRaceName(parts.join(" "));
        }
      }

      const level0Stats = {};
      let statLineCount = 0;
      let looksLikeInfoBlock = false;
      lines.forEach((line) => {
        if (/\.\.\.|[)]\s*\.\.\.\s*\d+\s*\(/.test(line) || /\(\s*[-+]?\d+\s*\)\s*(?:\.{3}|…)/.test(line)) {
          looksLikeInfoBlock = true;
        }
        const match = line.match(/^([A-Za-z ]+)\s*\(([A-Z]{3})\):\s*(\d+)/i);
        if (!match) return;
        statLineCount += 1;
        const abbr = match[2].toUpperCase();
        const stat = stats.find((entry) => entry.abbr === abbr);
        if (stat) level0Stats[stat.key] = Number(match[3]);
      });

      const required = stats.map((stat) => stat.key);
      const missing = required.filter((key) => level0Stats[key] == null);
      if (looksLikeInfoBlock) return { error: "wrong_block_info" };
      if (missing.length) {
        if (statLineCount > 0) return { error: "partial_level0", missing };
        return { error: "no_level0_stats" };
      }

      return {
        name,
        race,
        profession,
        level0Stats,
      };
    }

    function parseSkillsBlock(text) {
      const lines = text.split(/\r?\n/);
      const parsed = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith("Skill Name")) return;
        if (trimmed.startsWith("Spell Lists")) return;
        if (trimmed.startsWith("Training Points")) return;
        if (!trimmed.includes("|")) return;

        const parts = trimmed.split("|");
        if (parts.length < 2) return;

        const name = parts[0].replace(/\.+$/, "").trim();
        const right = parts[1].trim();
        const numbers = right.match(/-?\d+/g);
        if (!name || !numbers || numbers.length === 0) return;

        const bonus = numbers.length >= 2 ? Number(numbers[0]) : null;
        const ranks = numbers.length >= 2 ? Number(numbers[1]) : Number(numbers[0]);

        parsed.push({ name, bonus, ranks });
      });

      return parsed;
    }

    function parseSkillsLevel(text) {
      const match = text.match(/\(at level\s+(\d+)\)/i);
      if (!match) return null;
      return Number(match[1]);
    }

    function parseAscListBlock(text) {
      const lines = text.split(/\r?\n/);
      const results = [];

      lines.forEach((line) => {
        const trimmed = stripMarkupTags(line).replace(/\t/g, " ").trim();
        if (!trimmed) return;
        if (/^Skill\s+Mnemonic/i.test(trimmed)) return;
        if (/^[-]{5,}/.test(trimmed)) return;
        const match = trimmed.match(/^(.*?)\s{2,}([a-z][a-z0-9-]*)\s{2,}(\d+)\s*\/\s*(40|50|10)\s{2,}(\S+)\s{2,}(\S+)\s{2,}(.+)$/i);
        if (!match) return;
        const name = match[1].trim().replace(/\s{2,}/g, " ");
        const category = match[6].trim();
        const subcategory = match[7].trim();

        if (!name) return;
        results.push({
          name,
          mnemonic: match[2].toLowerCase(),
          ranks: Number(match[3]),
          cap: Number(match[4]),
          category,
          subcategory,
        });
      });

      return results;
    }

    function levelFromExperience(experience) {
      const value = Math.max(0, Math.trunc(Number(experience) || 0));
      let level = 0;
      for (let index = 0; index < levelThresholds.length; index += 1) {
        if (value >= levelThresholds[index]) level = index;
        else break;
      }
      return clamp(level, 0, 100);
    }

    function parseExpBlock(text) {
      const source = String(text || "");
      const expMatch = source.match(/Experience:\s*([0-9,]+)/i);
      if (!expMatch) return null;
      const hintedLevelMatch = source.match(/Level:\s*(\d+)/i);
      const ascExpMatch = source.match(/Ascension Exp:\s*([0-9,]+)/i);
      const experience = Math.max(0, Number(expMatch[1].replace(/,/g, "")) || 0);
      return {
        experience,
        level: levelFromExperience(experience),
        hintedLevel: hintedLevelMatch ? clamp(Number(hintedLevelMatch[1]), 0, 100) : null,
        ascensionExperience: ascExpMatch ? Math.max(0, Number(ascExpMatch[1].replace(/,/g, "")) || 0) : 0,
      };
    }

    function parseAscMilestonesBlock(text) {
      const source = String(text || "");
      if (!/Ascension Milestones are as follows:/i.test(source)) return null;
      const lines = source.split(/\r?\n/);
      let reached = 0;
      lines.forEach((line) => {
        const match = line.match(/^\s*\d+\.\s+.*\s+(Yes|No)\s*$/i);
        if (match && match[1].toLowerCase() === "yes") reached += 1;
      });
      return clamp(reached, 0, 10);
    }

    function parseSocietyBlock(text) {
      const source = stripMarkupTags(String(text || ""));
      if (!source.trim()) return null;
      if (/not currently a member of any society/i.test(source)) {
        return { society: null, rank: 0 };
      }

      const society =
        (/Council of Light/i.test(source) && "col")
        || (/Order of Voln/i.test(source) && "voln")
        || (/Guardians of Sunfist/i.test(source) && "sunfist")
        || null;

      if (!society) return null;

      const rankMatch = source.match(/(?:Step|Rank)\s+(\d+)\s+of\s+\d+/i);
      if (!rankMatch) return null;
      return {
        society,
        rank: Math.max(0, Math.trunc(Number(rankMatch[1]) || 0)),
      };
    }

    return {
      stripMarkupTags,
      parseInfoBlock,
      parseInfoStartBlock,
      parseSkillsBlock,
      parseSkillsLevel,
      parseAscListBlock,
      levelFromExperience,
      parseExpBlock,
      parseAscMilestonesBlock,
      parseSocietyBlock,
    };
  }

  return {
    createParserSet,
    stripMarkupTags,
  };
});
