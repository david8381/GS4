const currentExpInput = document.getElementById("currentExp");
const logicBonusInput = document.getElementById("logicBonus");
const scenarioInputs = document.querySelectorAll('input[name="scenarioMode"]');

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

function numberValue(input, fallback = 0) {
  const parsed = Number(input.value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

trendChart.addEventListener("mousemove", updateHover);
trendChart.addEventListener("mouseleave", clearHover);
trendChart.addEventListener("touchstart", updateHover);
trendChart.addEventListener("touchmove", updateHover);
trendChart.addEventListener("touchend", clearHover);

renderLegend();
compute();
