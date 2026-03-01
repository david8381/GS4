const currentExpInput = document.getElementById("currentExp");
const logicBonusInput = document.getElementById("logicBonus");
const scenarioInputs = document.querySelectorAll('input[name="scenarioMode"]');
const profileSelect = document.getElementById("profileSelectCalc");
const profileLoad = document.getElementById("profileLoadCalc");
const profileReload = document.getElementById("profileReloadCalc");
const useEnhanced = document.getElementById("useEnhancedCalc");
const runCalculatorTestsBtn = document.getElementById("runCalculatorTests");
const calculatorTestOutput = document.getElementById("calculatorTestOutput");

const selectedScenarioLabel = document.getElementById("selectedScenario");
const totalTimeLabel = document.getElementById("totalTime");
const totalResources = document.getElementById("totalResources");
const avgAbsorbLabel = document.getElementById("avgAbsorb");
const legend = document.getElementById("legend");
const resultsBody = document.getElementById("results");

const trendChart = document.getElementById("trendChart");
const trendCtx = trendChart.getContext("2d");

const chartPadding = { left: 64, right: 64, top: 24, bottom: 56 };
const maxSteps = 30000;

const ONLINE_PULSE_SECONDS = 60;
const OFFLINE_INTERVAL_SECONDS = 600;
const ONLINE_RESOURCE_BASE = 85;
const OFFLINE_RESOURCE_BASE = 25;
const OFFLINE_ABSORB_PER_INTERVAL = 15;
const X_GRID_SECONDS = 300;
const XP_GRID_STEP = 50;
const RATE_GRID_STEP = 5;
const PROFILE_KEY = "gs4.characterProfiles";
const raceStatBonusModifiers = {
  Aelotoi: { str: -5, con: 0, dex: 5, agi: 10, dis: 5, aur: 0, log: 5, int: 5, wis: 0, inf: -5 },
  "Burghal Gnome": { str: -15, con: 10, dex: 10, agi: 10, dis: -5, aur: 5, log: 10, int: 5, wis: 0, inf: -5 },
  "Dark Elf": { str: 0, con: -5, dex: 10, agi: 5, dis: -10, aur: 10, log: 0, int: 5, wis: 5, inf: -5 },
  Dwarf: { str: 10, con: 15, dex: 0, agi: -5, dis: 10, aur: -10, log: 5, int: 0, wis: 0, inf: -10 },
  Elf: { str: 0, con: 0, dex: 5, agi: 15, dis: -15, aur: 5, log: 0, int: 0, wis: 0, inf: 10 },
  Erithian: { str: -5, con: 10, dex: 0, agi: 0, dis: 5, aur: 0, log: 5, int: 0, wis: 0, inf: 10 },
  "Forest Gnome": { str: -10, con: 10, dex: 5, agi: 10, dis: 5, aur: 0, log: 5, int: 0, wis: 5, inf: -5 },
  Giantman: { str: 15, con: 10, dex: -5, agi: -5, dis: 0, aur: -5, log: -5, int: 0, wis: 0, inf: 5 },
  "Half-Elf": { str: 0, con: 0, dex: 5, agi: 10, dis: -5, aur: 0, log: 0, int: 0, wis: 0, inf: 5 },
  "Half-Krolvin": { str: 10, con: 10, dex: 0, agi: 5, dis: 0, aur: 0, log: -10, int: 0, wis: -5, inf: -5 },
  Halfling: { str: -15, con: 10, dex: 15, agi: 10, dis: -5, aur: -5, log: 5, int: 10, wis: 0, inf: -5 },
  Human: { str: 5, con: 0, dex: 0, agi: 0, dis: 0, aur: 0, log: 5, int: 5, wis: 0, inf: 0 },
  Sylvankind: { str: 0, con: 0, dex: 10, agi: 5, dis: -5, aur: 5, log: 0, int: 0, wis: 0, inf: 0 },
};

const scenarios = [
  {
    key: "on-node",
    name: "On-Node (Town)",
    mode: "online",
    baseAbsorb: 25,
    logicDivisor: 5,
  },
  {
    key: "in-town",
    name: "In-Town (Off-Node)",
    mode: "online",
    baseAbsorb: 22,
    logicDivisor: 5,
  },
  {
    key: "out-town",
    name: "Out-of-Town",
    mode: "online",
    baseAbsorb: 19,
    logicDivisor: 7,
  },
  {
    key: "offline",
    name: "Offline",
    mode: "offline",
  },
];

const metricSeries = [
  {
    key: "remaining",
    label: "XP Remaining",
    color: "#2e587a",
    getValue(point) {
      return point.remaining;
    },
    axis: "left",
  },
  {
    key: "absorb",
    label: "Absorb / Pulse",
    color: "#8c3b2a",
    getValue(point) {
      return point.absorb;
    },
    axis: "right",
  },
  {
    key: "resourceGain",
    label: "Resource / Pulse",
    color: "#0f6f61",
    getValue(point) {
      return point.resourceGain;
    },
    axis: "right",
  },
];

let latestResult = null;
let hoverIndex = null;
let profiles = [];
let loadedProfileSnapshot = null;

function numberValue(input, fallback = 0) {
  const parsed = Number(input.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
    if (Array.isArray(stored)) return stored;
  } catch (error) {
    return [];
  }
  return [];
}

function refreshProfileSelect(list) {
  profileSelect.innerHTML = "<option value=\"\">Select from Profile</option>";
  list.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
  });
}

function findProfile(list, id) {
  return list.find((profile) => profile.id === id);
}

function statToBonus(stat) {
  return Math.floor((Number(stat) - 50) / 2);
}

function stateEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function currentProfileSnapshot() {
  return {
    logicBonus: Number(logicBonusInput.value) || 0,
  };
}

function updateProfileLoadButtonState() {
  if (!profileLoad) return;
  profileLoad.classList.remove("attention");
  if (profileReload) {
    profileReload.disabled = !profileSelect.value || !loadedProfileSnapshot;
    profileReload.classList.remove("attention");
  }
  if (!profileSelect.value || !loadedProfileSnapshot) return;
  const hasChanges = !stateEquals(currentProfileSnapshot(), loadedProfileSnapshot);
  if (hasChanges) {
    profileLoad.classList.add("attention");
    if (profileReload) profileReload.classList.add("attention");
  }
}

function reloadSelectedProfile() {
  const selected = profileSelect.value;
  if (!selected) return;
  const profile = findProfile(profiles, selected);
  if (profile) applyProfile(profile);
}

function normalizeRaceForModifierLookup(raw) {
  if (!raw) return "";
  const cleaned = raw.toLowerCase().replace(/[^a-z]/g, "");
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
  return raw;
}

function getRaceStatModifier(raceName, statKey) {
  const normalizedRace = normalizeRaceForModifierLookup(raceName);
  return raceStatBonusModifiers[normalizedRace]?.[statKey] ?? 0;
}

function profileStatValue(profile, statKey, useEnhancedStats) {
  if (!profile) return null;
  const statEntry = profile.stats?.[statKey];
  if (useEnhancedStats) {
    return statEntry?.enhanced ?? profile[`${statKey}Enhanced`] ?? null;
  }
  return statEntry?.base ?? profile[`${statKey}Base`] ?? null;
}

function getFieldExpPoolCap(profile, useEnhancedStats) {
  const logStat = Number(profileStatValue(profile, "log", useEnhancedStats));
  const disStat = Number(profileStatValue(profile, "dis", useEnhancedStats));
  if (!Number.isFinite(logStat) || !Number.isFinite(disStat)) return null;
  return Math.max(0, Math.trunc(800 + logStat + disStat));
}

function applyProfile(profile) {
  if (!profile) return;
  const useEnhancedStats = useEnhanced.checked;
  const logStat = profileStatValue(profile, "log", useEnhancedStats);

  if (logStat != null) {
    const racialLogModifier = getRaceStatModifier(profile.race, "log");
    logicBonusInput.value = String(statToBonus(logStat) + racialLogModifier);
  }

  const fieldExpCap = getFieldExpPoolCap(profile, useEnhancedStats);
  if (fieldExpCap != null) {
    currentExpInput.value = String(fieldExpCap);
  }

  loadedProfileSnapshot = currentProfileSnapshot();
  updateProfileLoadButtonState();
  compute();
}

function clampMin(value, minValue) {
  return Math.max(minValue, value);
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function formatDuration(seconds) {
  if (seconds <= 0) return "0m";
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function ceilToStep(value, step) {
  return Math.max(step, Math.ceil(value / step) * step);
}

function formatMinutes(seconds) {
  return `${Math.floor(seconds / 60)}m`;
}

function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function getSelectedScenarioKey() {
  const selected = Array.from(scenarioInputs).find((input) => input.checked);
  return selected ? selected.value : "on-node";
}

function findScenario(key) {
  return scenarios.find((scenario) => scenario.key === key) || scenarios[0];
}

function simulateScenario(startExp, logicBonus, scenario) {
  let remaining = startExp;
  let elapsedSeconds = 0;
  let resources = 0;
  let pulses = 0;
  let totalAbsorbed = 0;

  const points = [{ t: 0, remaining, absorb: 0, resourceGain: 0, resources }];

  while (remaining > 0 && pulses < maxSteps) {
    let absorbed = 0;
    let resourceGain = 0;

    if (scenario.mode === "offline") {
      absorbed = Math.min(remaining, OFFLINE_ABSORB_PER_INTERVAL);
      elapsedSeconds += OFFLINE_INTERVAL_SECONDS;
      resourceGain = OFFLINE_RESOURCE_BASE;
    } else {
      const logicTerm = Math.trunc(logicBonus / scenario.logicDivisor);
      const poolTerm = Math.min(10, Math.floor(remaining / 200));
      const absorbPerPulse = Math.max(0, scenario.baseAbsorb + logicTerm + poolTerm);
      absorbed = Math.min(remaining, absorbPerPulse);
      elapsedSeconds += ONLINE_PULSE_SECONDS;
      if (absorbed >= 20) resourceGain = ONLINE_RESOURCE_BASE;
    }

    if (absorbed <= 0) break;

    remaining -= absorbed;
    totalAbsorbed += absorbed;
    pulses += 1;
    resources += resourceGain;

    points.push({ t: elapsedSeconds, remaining, absorb: absorbed, resourceGain, resources });
  }

  return {
    scenario,
    pulses,
    elapsedSeconds,
    resources,
    avgAbsorb: pulses > 0 ? totalAbsorbed / pulses : 0,
    points,
  };
}

function renderLegend() {
  legend.innerHTML = "";
  metricSeries.forEach((metric) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = metric.color;
    const label = document.createElement("span");
    label.textContent = metric.label;
    item.appendChild(swatch);
    item.appendChild(label);
    legend.appendChild(item);
  });
}

function drawAxes(ctx, width, height, maxXSeconds, maxRemaining, maxRate) {
  const left = chartPadding.left;
  const right = width - chartPadding.right;
  const top = chartPadding.top;
  const bottom = height - chartPadding.bottom;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const xScale = plotWidth / maxXSeconds;
  const yLeftScale = plotHeight / maxRemaining;
  const yRightScale = plotHeight / maxRate;

  ctx.font = "12px IBM Plex Mono";

  for (let t = 0; t <= maxXSeconds; t += X_GRID_SECONDS) {
    const x = left + t * xScale;
    ctx.strokeStyle = "rgba(29, 26, 33, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.fillStyle = "#5d5866";
    ctx.fillText(formatMinutes(t), x - 11, height - 30);
  }

  for (let xp = 0; xp <= maxRemaining; xp += XP_GRID_STEP) {
    const y = bottom - xp * yLeftScale;
    ctx.strokeStyle = "rgba(46, 88, 122, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.fillStyle = "#2e587a";
    ctx.fillText(String(xp), 8, y + 4);
  }

  for (let rate = 0; rate <= maxRate; rate += RATE_GRID_STEP) {
    const y = bottom - rate * yRightScale;
    ctx.strokeStyle = "rgba(15, 111, 97, 0.24)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#0f6f61";
    ctx.fillText(String(rate), right + 8, y + 4);
  }

  ctx.strokeStyle = "#1d1a21";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.lineTo(right, top);
  ctx.stroke();

  ctx.fillStyle = "#5d5866";
  ctx.fillText("Time", width / 2 - 16, height - 10);
  ctx.fillStyle = "#2e587a";
  ctx.fillText("XP Remaining", 8, top - 6);
  ctx.fillStyle = "#0f6f61";
  ctx.fillText("Absorb / Resource", right - 116, top - 6);
}

function drawTrendChart(result) {
  const width = trendChart.width;
  const height = trendChart.height;
  trendCtx.clearRect(0, 0, width, height);

  const left = chartPadding.left;
  const right = width - chartPadding.right;
  const top = chartPadding.top;
  const bottom = height - chartPadding.bottom;
  const plotWidth = right - left;
  const plotHeight = bottom - top;

  const maxX = Math.max(X_GRID_SECONDS, ceilToStep(result.elapsedSeconds, X_GRID_SECONDS));
  const maxRemaining = ceilToStep(Math.max(1, ...result.points.map((p) => p.remaining)), XP_GRID_STEP);
  const maxRate = ceilToStep(
    Math.max(1, ...result.points.map((p) => Math.max(p.absorb, p.resourceGain))),
    RATE_GRID_STEP
  );

  drawAxes(trendCtx, width, height, maxX, maxRemaining, maxRate);

  const xScale = plotWidth / maxX;
  const yLeftScale = plotHeight / maxRemaining;
  const yRightScale = plotHeight / maxRate;

  metricSeries.forEach((metric) => {
    trendCtx.strokeStyle = metric.color;
    trendCtx.lineWidth = 2.5;
    trendCtx.beginPath();

    result.points.forEach((point, index) => {
      const x = left + point.t * xScale;
      const value = metric.getValue(point);
      const y =
        metric.axis === "left" ? bottom - value * yLeftScale : bottom - value * yRightScale;

      if (index === 0) trendCtx.moveTo(x, y);
      else trendCtx.lineTo(x, y);
    });
    trendCtx.stroke();

    trendCtx.fillStyle = metric.color;
    result.points.forEach((point) => {
      const x = left + point.t * xScale;
      const value = metric.getValue(point);
      const y =
        metric.axis === "left" ? bottom - value * yLeftScale : bottom - value * yRightScale;
      trendCtx.beginPath();
      trendCtx.arc(x, y, 2, 0, Math.PI * 2);
      trendCtx.fill();
    });
  });

  if (hoverIndex == null || !result.points[hoverIndex]) return;

  const point = result.points[hoverIndex];
  const hoverX = left + point.t * xScale;

  trendCtx.strokeStyle = "rgba(29, 26, 33, 0.75)";
  trendCtx.setLineDash([6, 4]);
  trendCtx.lineWidth = 1.5;
  trendCtx.beginPath();
  trendCtx.moveTo(hoverX, top);
  trendCtx.lineTo(hoverX, bottom);
  trendCtx.stroke();
  trendCtx.setLineDash([]);

  metricSeries.forEach((metric) => {
    const value = metric.getValue(point);
    const y =
      metric.axis === "left" ? bottom - value * yLeftScale : bottom - value * yRightScale;
    trendCtx.fillStyle = metric.color;
    trendCtx.beginPath();
    trendCtx.arc(hoverX, y, 4, 0, Math.PI * 2);
    trendCtx.fill();
  });

  const tooltipX = Math.min(hoverX + 12, right - 216);
  const tooltipY = top + 8;
  trendCtx.fillStyle = "rgba(29, 26, 33, 0.94)";
  trendCtx.fillRect(tooltipX, tooltipY, 212, 84);
  trendCtx.font = "12px IBM Plex Mono";
  trendCtx.fillStyle = "#f7f3ea";
  trendCtx.fillText(`Time: ${formatClock(point.t)}`, tooltipX + 8, tooltipY + 16);
  trendCtx.fillStyle = metricSeries[0].color;
  trendCtx.fillText(`XP Remaining: ${formatNumber(point.remaining)}`, tooltipX + 8, tooltipY + 34);
  trendCtx.fillStyle = metricSeries[1].color;
  trendCtx.fillText(`Absorb: ${point.absorb}`, tooltipX + 8, tooltipY + 50);
  trendCtx.fillStyle = metricSeries[2].color;
  trendCtx.fillText(`Resource: ${point.resourceGain}`, tooltipX + 8, tooltipY + 66);
}

function renderBreakdown(result) {
  resultsBody.innerHTML = "";
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="option-chip">${result.scenario.name}</td>
    <td>${formatDuration(result.elapsedSeconds)}</td>
    <td>${formatNumber(result.pulses)}</td>
    <td>${formatNumber(result.resources)}</td>
    <td>${result.avgAbsorb.toFixed(1)}</td>
  `;
  resultsBody.appendChild(row);
}

function renderSummary(result) {
  selectedScenarioLabel.textContent = result.scenario.name;
  totalTimeLabel.textContent = `Total Time: ${formatDuration(result.elapsedSeconds)}`;
  totalResources.textContent = formatNumber(result.resources);
  avgAbsorbLabel.textContent = `Avg Absorb: ${result.avgAbsorb.toFixed(1)}`;
}

function compute() {
  const startExp = clampMin(numberValue(currentExpInput, 0), 0);
  const logicBonus = numberValue(logicBonusInput, 0);

  const selectedScenario = findScenario(getSelectedScenarioKey());
  const result = simulateScenario(startExp, logicBonus, selectedScenario);

  latestResult = result;
  renderSummary(result);
  renderBreakdown(result);
  drawTrendChart(result);
  updateProfileLoadButtonState();
}

function updateHover(event) {
  if (!latestResult || latestResult.points.length === 0) return;

  const rect = trendChart.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const leftPx = chartPadding.left;
  const rightPx = rect.width - chartPadding.right;
  const clampedX = Math.max(leftPx, Math.min(clientX - rect.left, rightPx));

  const maxX = Math.max(X_GRID_SECONDS, ceilToStep(latestResult.elapsedSeconds, X_GRID_SECONDS));
  const ratio = (clampedX - leftPx) / (rightPx - leftPx || 1);
  const targetTime = ratio * maxX;

  let nearest = 0;
  let nearestDistance = Infinity;
  latestResult.points.forEach((point, index) => {
    const distance = Math.abs(point.t - targetTime);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = index;
    }
  });

  hoverIndex = nearest;
  drawTrendChart(latestResult);
}

function clearHover() {
  hoverIndex = null;
  if (latestResult) drawTrendChart(latestResult);
}

[currentExpInput, logicBonusInput].forEach((element) => {
  element.addEventListener("input", compute);
});

scenarioInputs.forEach((input) => {
  input.addEventListener("change", compute);
});

profileSelect.addEventListener("change", () => {
  const selected = profileSelect.value;
  if (!selected) {
    loadedProfileSnapshot = null;
    updateProfileLoadButtonState();
    compute();
    return;
  }
  const profile = findProfile(profiles, selected);
  if (profile) applyProfile(profile);
});

if (profileLoad) {
  profileLoad.addEventListener("click", () => {
    reloadSelectedProfile();
  });
}

if (profileReload) {
  profileReload.addEventListener("click", () => {
    reloadSelectedProfile();
  });
}

useEnhanced.addEventListener("change", () => {
  const selected = profileSelect.value;
  if (!selected) {
    compute();
    return;
  }
  const profile = findProfile(profiles, selected);
  if (profile) applyProfile(profile);
});

trendChart.addEventListener("mousemove", updateHover);
trendChart.addEventListener("mouseleave", clearHover);
trendChart.addEventListener("touchstart", updateHover);
trendChart.addEventListener("touchmove", updateHover);
trendChart.addEventListener("touchend", clearHover);

function runCalculatorSelfTests() {
  const tests = [
    {
      name: "T1 offline absorbs 15 per interval and gains 25 resources",
      run: () => simulateScenario(30, 0, findScenario("offline")),
      check: (got) => got.pulses === 2 && got.elapsedSeconds === 1200 && got.resources === 50,
    },
    {
      name: "T2 online resource pulse requires >=20 absorb",
      run: () => simulateScenario(10, 0, findScenario("on-node")),
      check: (got) => got.resources === 0,
    },
    {
      name: "T3 larger pool takes longer than small pool",
      run: () => ({
        small: simulateScenario(100, 20, findScenario("in-town")).elapsedSeconds,
        large: simulateScenario(300, 20, findScenario("in-town")).elapsedSeconds,
      }),
      check: (got) => got.large > got.small,
    },
  ];

  let pass = 0;
  const lines = [];
  tests.forEach((test) => {
    const got = test.run();
    const ok = Boolean(test.check(got));
    if (ok) pass += 1;
    lines.push(`${ok ? "PASS" : "FAIL"} ${test.name}`);
    if (!ok) lines.push(` got: ${JSON.stringify(got)}`);
  });
  lines.push("");
  lines.push(`Summary: ${pass}/${tests.length} passing`);
  if (calculatorTestOutput) {
    calculatorTestOutput.textContent = lines.join("\n");
    calculatorTestOutput.style.color = pass === tests.length ? "#1f4e42" : "#b42318";
  }
}

if (runCalculatorTestsBtn) {
  runCalculatorTestsBtn.addEventListener("click", runCalculatorSelfTests);
}

renderLegend();
profiles = loadProfiles();
refreshProfileSelect(profiles);
window.addEventListener("focus", () => {
  profiles = loadProfiles();
  refreshProfileSelect(profiles);
  updateProfileLoadButtonState();
});
compute();
