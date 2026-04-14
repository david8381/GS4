(() => {
  const storage = window.GS4Storage;
  const data = window.GS4_DATA;
  const wrData = window.WEIGHT_REDUCTION_DATA;
  const logic = window.WeightReductionLogic;

  if (!storage || !wrData || !logic) {
    console.error("Weight Reduction dependencies missing.");
    return;
  }

  // ─── DOM refs ────────────────────────────────────────────────────
  const profileSelect   = document.getElementById("profileSelect");
  const profileLoad     = document.getElementById("profileLoad");
  const capacitySelect  = document.getElementById("wrCapacity");
  const currentWRSelect = document.getElementById("wrCurrentPct");
  const fillSlider      = document.getElementById("wrFillSlider");
  const fillDisplay     = document.getElementById("wrFillDisplay");
  const costCanvas      = document.getElementById("wrCostChart");
  const weightCanvas    = document.getElementById("wrWeightChart");
  const costTooltip     = document.getElementById("wrCostTooltip");
  const weightTooltip   = document.getElementById("wrWeightTooltip");
  const costCursor      = document.getElementById("wrCostCursor");
  const weightCursor    = document.getElementById("wrWeightCursor");
  const summaryTable    = document.getElementById("wrSummaryTable");
  const encSection      = document.getElementById("wrEncSection");
  const encRaceSelect   = document.getElementById("wrRace");
  const encStrInput     = document.getElementById("wrStr");
  const encConInput     = document.getElementById("wrCon");
  const encPfInput      = document.getElementById("wrPf");
  const encOtherInput   = document.getElementById("wrOtherWeight");
  const encTableBody    = document.getElementById("wrEncBody");

  // ─── State ───────────────────────────────────────────────────────
  let hoveredWRPct = -1; // 0-100 integer, -1 = none
  const CHART_COLOR_COST   = "#e74c3c";
  const CHART_COLOR_WEIGHT = "#3498db";
  const CHART_COLOR_CURSOR = "rgba(0,0,0,0.25)";
  const CHART_COLOR_CURSOR_DARK = "rgba(255,255,255,0.3)";

  // ─── Init ─────────────────────────────────────────────────────────
  function init() {
    // Capacity options
    wrData.containers.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = String(c.capacity);
      opt.textContent = `${c.capacity} lb`;
      capacitySelect.appendChild(opt);
    });
    capacitySelect.value = "100";

    // currentWRSelect is a number input; just ensure default
    if (currentWRSelect) currentWRSelect.value = "0";

    // Race options for encumbrance section
    if (encRaceSelect && data) {
      const encRaces = [
        { key: "burghal", name: "Burghal Gnome", baseWeight: 40, weightFactor: 0.4, maxWeight: 120, encFactor: 0.5 },
        { key: "halfling", name: "Halfling", baseWeight: 45.3333, weightFactor: 0.4533, maxWeight: 136, encFactor: 0.5 },
        { key: "forest-gnome", name: "Forest Gnome", baseWeight: 47.6667, weightFactor: 0.4767, maxWeight: 143, encFactor: 0.6 },
        { key: "aelotoi", name: "Aelotoi", baseWeight: 67.6667, weightFactor: 0.6767, maxWeight: 203, encFactor: 0.75 },
        { key: "elf", name: "Elf", baseWeight: 70, weightFactor: 0.7, maxWeight: 210, encFactor: 0.78 },
        { key: "erithian", name: "Erithian", baseWeight: 72.3333, weightFactor: 0.7233, maxWeight: 217, encFactor: 0.85 },
        { key: "sylvankind", name: "Sylvankind", baseWeight: 72.3333, weightFactor: 0.7233, maxWeight: 217, encFactor: 0.81 },
        { key: "dark-elf", name: "Dark Elf", baseWeight: 77.6667, weightFactor: 0.7767, maxWeight: 233, encFactor: 0.84 },
        { key: "dwarf", name: "Dwarf", baseWeight: 77.6667, weightFactor: 0.7767, maxWeight: 233, encFactor: 0.8 },
        { key: "half-elf", name: "Half-Elf", baseWeight: 82.3333, weightFactor: 0.8233, maxWeight: 247, encFactor: 0.92 },
        { key: "human", name: "Human", baseWeight: 90, weightFactor: 0.9, maxWeight: 270, encFactor: 1.0 },
        { key: "half-krolvin", name: "Half-Krolvin", baseWeight: 100, weightFactor: 1.0, maxWeight: 300, encFactor: 1.1 },
        { key: "giantman", name: "Giantman", baseWeight: 120, weightFactor: 1.2, maxWeight: 360, encFactor: 1.33 },
      ];
      encRaceSelect._raceData = encRaces;
      encRaces.forEach((r) => {
        const opt = document.createElement("option");
        opt.value = r.key;
        opt.textContent = r.name;
        encRaceSelect.appendChild(opt);
      });
      encRaceSelect.value = "human";
    }

    fillSlider.value = "70";
    syncFillDisplay();
    render();
    initProfileSelect();
  }

  function syncFillDisplay() {
    if (fillDisplay) fillDisplay.textContent = `${fillSlider.value}%`;
  }

  // ─── Profile ──────────────────────────────────────────────────────
  function initProfileSelect() {
    if (!profileSelect) return;
    const profiles = storage.loadProfiles();
    const selected = localStorage.getItem(storage.SELECTED_PROFILE_KEY) || "";
    profileSelect.innerHTML = '<option value="">Select from Profile</option>';
    profiles.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      profileSelect.appendChild(opt);
    });
    if (selected && profiles.some((p) => p.id === selected)) {
      profileSelect.value = selected;
      applyProfile();
    }
    window.addEventListener("gs4:selected-profile-changed", (e) => {
      const id = e.detail?.profileId || "";
      if (id) profileSelect.value = id;
      else profileSelect.value = "";
      applyProfile();
    });
  }

  function applyProfile() {
    if (!profileSelect?.value) return;
    const profiles = storage.loadProfiles();
    const profile = storage.findProfile(profiles, profileSelect.value);
    if (!profile) return;
    localStorage.setItem(storage.SELECTED_PROFILE_KEY, profileSelect.value);
    if (encRaceSelect && profile.race) {
      const norm = (profile.race || "").toLowerCase().replace(/\s+/g, "-");
      const match = encRaceSelect._raceData?.find(
        (r) => r.key === norm || r.name.toLowerCase() === profile.race.toLowerCase()
      );
      if (match) encRaceSelect.value = match.key;
    }
    if (encStrInput) {
      const v = profile.stats?.str?.enhanced ?? profile.stats?.str?.base ?? profile.strEnhanced ?? profile.strBase;
      if (v != null) encStrInput.value = String(v);
    }
    if (encConInput) {
      const v = profile.stats?.con?.enhanced ?? profile.stats?.con?.base ?? profile.conEnhanced ?? profile.conBase;
      if (v != null) encConInput.value = String(v);
    }
    if (encPfInput) {
      const pfSkill = profile.skills?.find((s) => s.name.toLowerCase() === "physical fitness");
      if (pfSkill?.bonus != null) encPfInput.value = String(pfSkill.bonus);
    }
    renderEncumbranceTable();
  }

  // ─── Main render ─────────────────────────────────────────────────
  function render() {
    const container = logic.getContainer(wrData.containers, Number(capacitySelect.value));
    if (!container) return;
    const currentWR = Number(currentWRSelect.value);
    const fillPct = Number(fillSlider.value);
    const costCurve = logic.getCostCurve(container, currentWR);
    const weightCurve = logic.getWeightSavedCurve(container.capacity, fillPct);

    renderCostChart(costCurve, container, currentWR);
    renderWeightChart(weightCurve, container.capacity, fillPct, currentWR);
    renderSummaryTable(costCurve, weightCurve);
    renderEncumbranceTable();
  }

  // ─── Chart drawing helpers ────────────────────────────────────────
  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function chartColors() {
    const dark = isDark();
    return {
      grid: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
      text: dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
      cursor: dark ? CHART_COLOR_CURSOR_DARK : CHART_COLOR_CURSOR,
    };
  }

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement?.clientWidth || 400;
    const cssH = 320;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, cssW, cssH };
  }

  function formatRaikhen(v) {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return String(v);
  }

  function drawGrid(ctx, pad, plotW, plotH, cssW, cssH, yMin, yMax, ySteps, formatY, colors) {
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const WR_LEVELS = [0, 20, 40, 60, 80, 100];
    WR_LEVELS.forEach((lvl) => {
      const x = pad.left + (lvl / 100) * plotW;
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.fillText(`${lvl}%`, x, pad.top + plotH + 5);
    });
    ctx.fillText("WR%", pad.left + plotW / 2, cssH - 8);

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= ySteps; i++) {
      const val = yMin + (yMax - yMin) * (i / ySteps);
      const y = pad.top + plotH - (i / ySteps) * plotH;
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.fillText(formatY(val), pad.left - 5, y);
    }
  }

  function drawCursorLine(ctx, pad, plotH, x, colors) {
    ctx.strokeStyle = colors.cursor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function xForWR(wrPct, pad, plotW) {
    return pad.left + (wrPct / 100) * plotW;
  }

  // ─── Cost chart ───────────────────────────────────────────────────
  function renderCostChart(costCurve, container, currentWR) {
    if (!costCanvas) return;
    const { ctx, cssW, cssH } = setupCanvas(costCanvas);
    ctx.clearRect(0, 0, cssW, cssH);
    const colors = chartColors();
    const pad = { top: 20, right: 16, bottom: 40, left: 58 };
    const plotW = cssW - pad.left - pad.right;
    const plotH = cssH - pad.top - pad.bottom;

    const maxCost = Math.max(...costCurve.map((p) => p.cumulativeCost), 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxCost)));
    const yMax = Math.ceil(maxCost / magnitude) * magnitude || 1000;
    const yMin = 0;
    const ySteps = 5;

    drawGrid(ctx, pad, plotW, plotH, cssW, cssH, yMin, yMax, ySteps, formatRaikhen, colors);

    function yPos(v) { return pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    // Shade already-purchased region
    const currentX = xForWR(currentWR, pad, plotW);
    ctx.fillStyle = isDark() ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    ctx.fillRect(pad.left, pad.top, currentX - pad.left, plotH);

    // Fill under cost curve
    ctx.fillStyle = isDark() ? "rgba(231,76,60,0.12)" : "rgba(231,76,60,0.08)";
    ctx.beginPath();
    ctx.moveTo(xForWR(0, pad, plotW), pad.top + plotH);
    costCurve.forEach((pt) => ctx.lineTo(xForWR(pt.wrPct, pad, plotW), yPos(pt.cumulativeCost)));
    ctx.lineTo(xForWR(100, pad, plotW), pad.top + plotH);
    ctx.closePath();
    ctx.fill();

    // Cost line (piecewise-linear through 101 points)
    ctx.strokeStyle = CHART_COLOR_COST;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    costCurve.forEach((pt, i) => {
      const x = xForWR(pt.wrPct, pad, plotW);
      const y = yPos(pt.cumulativeCost);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots + "~" at tier boundaries (20, 40, 60, 80, 100)
    [20, 40, 60, 80, 100].forEach((boundary) => {
      const pt = costCurve[boundary];
      if (!pt || pt.isReached) return;
      const x = xForWR(pt.wrPct, pad, plotW);
      const y = yPos(pt.cumulativeCost);
      ctx.fillStyle = CHART_COLOR_COST;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (pt.hasExtrapolated) {
        ctx.fillStyle = colors.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.font = "10px 'IBM Plex Mono', monospace";
        ctx.fillText("~", x, y - 5);
      }
    });

    // Current WR dotted line
    if (currentWR > 0) {
      ctx.strokeStyle = colors.cursor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(currentX, pad.top);
      ctx.lineTo(currentX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillText("current", currentX, pad.top - 2);
    }

    // Hover cursor
    if (hoveredWRPct >= 0) {
      drawCursorLine(ctx, pad, plotH, xForWR(hoveredWRPct, pad, plotW), colors);
    }

    costCanvas._pad = pad;
    costCanvas._plotW = plotW;
    costCanvas._plotH = plotH;
  }

  // ─── Weight chart ─────────────────────────────────────────────────
  function renderWeightChart(weightCurve, capacity, fillPct, currentWR) {
    if (!weightCanvas) return;
    const { ctx, cssW, cssH } = setupCanvas(weightCanvas);
    ctx.clearRect(0, 0, cssW, cssH);
    const colors = chartColors();
    const pad = { top: 20, right: 16, bottom: 40, left: 52 };
    const plotW = cssW - pad.left - pad.right;
    const plotH = cssH - pad.top - pad.bottom;

    const maxSaved = capacity * (fillPct / 100);
    const yMax = Math.max(Math.ceil(maxSaved / 10) * 10, 10);
    const yMin = 0;
    const ySteps = 5;

    drawGrid(ctx, pad, plotW, plotH, cssW, cssH, yMin, yMax, ySteps, (v) => `${Math.round(v)} lb`, colors);

    function yPos(v) { return pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    // Shade already-purchased region
    const currentX = xForWR(currentWR, pad, plotW);
    ctx.fillStyle = isDark() ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    ctx.fillRect(pad.left, pad.top, currentX - pad.left, plotH);

    // Line + fill
    ctx.strokeStyle = CHART_COLOR_WEIGHT;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    weightCurve.forEach((pt, i) => {
      const x = xForWR(pt.wrPct, pad, plotW);
      const y = yPos(pt.weightSaved);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = isDark() ? "rgba(52,152,219,0.12)" : "rgba(52,152,219,0.08)";
    ctx.beginPath();
    weightCurve.forEach((pt, i) => {
      const x = xForWR(pt.wrPct, pad, plotW);
      const y = yPos(pt.weightSaved);
      if (i === 0) ctx.moveTo(x, pad.top + plotH);
      ctx.lineTo(x, y);
    });
    const lastX = xForWR(100, pad, plotW);
    ctx.lineTo(lastX, pad.top + plotH);
    ctx.closePath();
    ctx.fill();

    // Dots
    weightCurve.forEach((pt) => {
      ctx.fillStyle = CHART_COLOR_WEIGHT;
      ctx.beginPath();
      ctx.arc(xForWR(pt.wrPct, pad, plotW), yPos(pt.weightSaved), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Current WR line
    if (currentWR > 0) {
      ctx.strokeStyle = colors.cursor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(currentX, pad.top);
      ctx.lineTo(currentX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillText("current", currentX, pad.top - 2);
    }

    // Hover cursor
    if (hoveredWRPct >= 0) {
      drawCursorLine(ctx, pad, plotH, xForWR(hoveredWRPct, pad, plotW), colors);
    }

    weightCanvas._pad = pad;
    weightCanvas._plotW = plotW;
    weightCanvas._plotH = plotH;
  }

  // ─── Summary table ────────────────────────────────────────────────
  function renderSummaryTable(costCurve, weightCurve) {
    if (!summaryTable) return;
    const fillPct = Number(fillSlider.value);
    summaryTable.innerHTML = `
      <thead>
        <tr>
          <th>WR Tier</th>
          <th>Cost to Reach</th>
          <th>Weight Saved</th>
          <th>Effective Wt</th>
        </tr>
      </thead>
      <tbody>
        ${[0, 20, 40, 60, 80, 100].map((pct) => {
          const cp = costCurve[pct];
          const wp = weightCurve[pct];
          const capacity = Number(capacitySelect.value);
          const effWt = capacity * (fillPct / 100) * (1 - pct / 100);
          const reached = cp.isReached;
          return `<tr class="${reached ? "wr-row-reached" : ""}">
            <td>${pct}%${reached ? " ✓" : ""}</td>
            <td>${cp.cumulativeCost === 0 && pct > 0 ? "—" : cp.cumulativeCost.toLocaleString()}</td>
            <td>${wp.weightSaved.toFixed(1)} lb${cp.hasExtrapolated ? " ~" : ""}</td>
            <td>${effWt.toFixed(1)} lb</td>
          </tr>`;
        }).join("")}
      </tbody>`;
  }

  // ─── Encumbrance table ─────────────────────────────────────────────
  function renderEncumbranceTable() {
    if (!encTableBody || !encRaceSelect) return;
    const raceData = encRaceSelect._raceData || [];
    const race = raceData.find((r) => r.key === encRaceSelect.value);
    if (!race) return;
    const str = Number(encStrInput?.value) || 60;
    const con = Number(encConInput?.value) || 60;
    const pf = Number(encPfInput?.value) || 0;
    const otherWeight = Number(encOtherInput?.value) || 0;
    const capacity = Number(capacitySelect.value);
    const fillPct = Number(fillSlider.value);

    const curve = logic.getEncumbranceCurve(race, str, con, pf, capacity, fillPct, otherWeight);
    const { bodyWeight } = logic.computeCarryCapacity(race, str, con, pf);

    encTableBody.innerHTML = curve.map((pt) => `
      <tr>
        <td>${pt.wrPct}%</td>
        <td>${pt.totalCarried.toFixed(1)} lb</td>
        <td>${pt.encPct.toFixed(1)}%</td>
        <td>${pt.encLabel}</td>
      </tr>`).join("");
  }

  // ─── Hover / cursor ───────────────────────────────────────────────
  function wrPctFromX(canvas, mouseX) {
    const pad = canvas._pad;
    const plotW = canvas._plotW;
    if (!pad || !plotW) return -1;
    const frac = (mouseX - pad.left) / plotW;
    if (frac < 0 || frac > 1) return -1;
    return Math.min(100, Math.max(0, Math.round(frac * 100)));
  }

  function updateTooltip(tooltip, cursor, canvas, wrPct, lines, mouseX) {
    if (!tooltip || !canvas) return;
    if (wrPct < 0) {
      tooltip.style.display = "none";
      if (cursor) cursor.style.display = "none";
      return;
    }
    const pad = canvas._pad || { left: 52 };
    const plotW = canvas._plotW || (canvas.clientWidth - pad.left - 16);
    const x = pad.left + (wrPct / 100) * plotW;

    if (cursor) {
      cursor.style.display = "block";
      cursor.style.left = x + "px";
    }
    tooltip.innerHTML = lines.join("<br>");
    tooltip.style.display = "block";
    const tipW = tooltip.offsetWidth;
    const rect = canvas.getBoundingClientRect();
    let left = mouseX + 10;
    if (left + tipW > rect.width - 4) left = mouseX - tipW - 10;
    tooltip.style.left = left + "px";
    tooltip.style.top = "6px";
  }

  function handleHover(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const wPct = wrPctFromX(canvas, mouseX);
    if (wPct !== hoveredWRPct) {
      hoveredWRPct = wPct;
      render();
    }

    const container = logic.getContainer(wrData.containers, Number(capacitySelect.value));
    if (!container || wPct < 0) {
      if (costTooltip) costTooltip.style.display = "none";
      if (weightTooltip) weightTooltip.style.display = "none";
      if (costCursor) costCursor.style.display = "none";
      if (weightCursor) weightCursor.style.display = "none";
      return;
    }
    const currentWR = Number(currentWRSelect.value);
    const fillPct = Number(fillSlider.value);
    const costCurve = logic.getCostCurve(container, currentWR);
    const weightCurve = logic.getWeightSavedCurve(container.capacity, fillPct);
    const cp = costCurve[wPct]; // direct index into 101-point array
    const wp = weightCurve[wPct];

    const costLines = [
      `<strong>${wPct}% WR</strong>`,
      cp.isReached && wPct > 0 ? "Already purchased" : `${cp.cumulativeCost.toLocaleString()} raikhen${cp.hasExtrapolated ? " (~)" : ""}`,
    ];
    const weightLines = [
      `<strong>${wPct}% WR</strong>`,
      `Saved: ${wp.weightSaved.toFixed(1)} lb`,
      `Effective: ${(container.capacity * (fillPct / 100) * (1 - wPct / 100)).toFixed(1)} lb`,
    ];

    updateTooltip(costTooltip, costCursor, costCanvas, wPct, costLines, mouseX);
    const wPad = weightCanvas?._pad || { left: 52 };
    const wPlotW = weightCanvas?._plotW || ((weightCanvas?.clientWidth || 400) - wPad.left - 16);
    const weightMouseX = canvas === costCanvas ? wPad.left + (wPct / 100) * wPlotW : mouseX;
    updateTooltip(weightTooltip, weightCursor, weightCanvas, wPct, weightLines, weightMouseX);
  }

  function handleLeave() {
    hoveredWRPct = -1;
    render();
    if (costTooltip) costTooltip.style.display = "none";
    if (weightTooltip) weightTooltip.style.display = "none";
    if (costCursor) costCursor.style.display = "none";
    if (weightCursor) weightCursor.style.display = "none";
  }

  // ─── Events ───────────────────────────────────────────────────────
  capacitySelect?.addEventListener("change", render);
  currentWRSelect?.addEventListener("input", render);
  fillSlider?.addEventListener("input", () => { syncFillDisplay(); render(); });

  costCanvas?.addEventListener("mousemove", (e) => handleHover(e, costCanvas));
  costCanvas?.addEventListener("mouseleave", handleLeave);
  weightCanvas?.addEventListener("mousemove", (e) => handleHover(e, weightCanvas));
  weightCanvas?.addEventListener("mouseleave", handleLeave);

  profileSelect?.addEventListener("change", () => {
    const v = profileSelect.value;
    if (v) localStorage.setItem(storage.SELECTED_PROFILE_KEY, v);
    else localStorage.removeItem(storage.SELECTED_PROFILE_KEY);
    applyProfile();
  });
  profileLoad?.addEventListener("click", applyProfile);

  if (encRaceSelect) encRaceSelect.addEventListener("change", renderEncumbranceTable);
  if (encStrInput) encStrInput.addEventListener("input", renderEncumbranceTable);
  if (encConInput) encConInput.addEventListener("input", renderEncumbranceTable);
  if (encPfInput) encPfInput.addEventListener("input", renderEncumbranceTable);
  if (encOtherInput) encOtherInput.addEventListener("input", renderEncumbranceTable);

  window.addEventListener("resize", render);

  init();
})();
