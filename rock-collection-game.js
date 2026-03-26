document.getElementById("year").textContent = new Date().getFullYear();

const STORAGE_KEY = "rockInventory";
const ACTIVE_KEY = "activeRockId";
const LAST_DECAY_AT_KEY = "rockLastDecayAt";
const PROMPT_INTERVAL_MS = 2000;
const PROMPT_VISIBLE_MS = 14000;
const DIRTY_INTERVAL_MS = 30000;

const POLISH_PER_SECOND_BY_RARITY = {
  Common: 10,
  Uncommon: 6,
  Rare: 3,
  Legendary: 1
};

const DIRT_RATE_BY_RARITY = {
  Common: 1.3,
  Uncommon: 1,
  Rare: 0.72,
  Legendary: 0.48
};

const rockPool = [
  { name: "Garnet Schist", icon: "", iconUrl: "assets/rock-collection/garnet-schist.png", rarity: "Common", polishRequired: 100, weight: 40 },
  { name: "Banded Iron Formation", icon: "", iconUrl: "assets/rock-collection/banded-iron-formation.png", rarity: "Rare", polishRequired: 100, weight: 10 },
];

const state = {
  inventory: [],
  activeRockId: null,
  lastDecayAt: Date.now(),
  promptTimer: null,
  dirtTimer: null,
  hidePromptTimer: null,
  promptVisible: false
};

const inventoryEl = document.getElementById("rock-inventory");
const emptyEl = document.getElementById("rock-empty");
const nameEl = document.getElementById("selected-rock-name");
const metaEl = document.getElementById("selected-rock-meta");
const zoneEl = document.getElementById("polish-zone");
const iconEl = document.getElementById("polish-rock-icon");
const sparklesEl = document.getElementById("polish-sparkles");
const hintEl = document.getElementById("polish-hint");
const progressFillEl = document.getElementById("polish-progress-fill");
const statusEl = document.getElementById("polish-status");
const claimButtonEl = document.getElementById("claim-rock-button");
let lastPolishAt = Date.now();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.inventory));
  localStorage.setItem(LAST_DECAY_AT_KEY, String(state.lastDecayAt));
  if (state.activeRockId) {
    localStorage.setItem(ACTIVE_KEY, state.activeRockId);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

function loadState() {
  try {
    const rawInventory = localStorage.getItem(STORAGE_KEY);
    const parsed = rawInventory ? JSON.parse(rawInventory) : [];
    state.inventory = Array.isArray(parsed)
      ? parsed.filter(
          (rock) =>
            rock &&
            typeof rock.id === "string" &&
            typeof rock.name === "string" &&
            typeof rock.icon === "string" &&
            (typeof rock.iconUrl === "undefined" || typeof rock.iconUrl === "string") &&
            typeof rock.rarity === "string" &&
            typeof rock.polishRequired === "number" &&
            typeof rock.polishProgress === "number"
        )
      : [];
  } catch (error) {
    state.inventory = [];
  }

  const savedActive = localStorage.getItem(ACTIVE_KEY);
  state.activeRockId = state.inventory.some((rock) => rock.id === savedActive)
    ? savedActive
    : state.inventory[0]?.id || null;

  const savedLastDecayAt = Number(localStorage.getItem(LAST_DECAY_AT_KEY));
  state.lastDecayAt = Number.isFinite(savedLastDecayAt) && savedLastDecayAt > 0
    ? savedLastDecayAt
    : Date.now();
}

function getActiveRock() {
  return state.inventory.find((rock) => rock.id === state.activeRockId) || null;
}

function rarityClass(rarity) {
  return `rarity-${rarity.toLowerCase()}`;
}

function getCleanlinessPercent(rock) {
  return Math.max(0, Math.min(100, Math.round((rock.polishProgress / rock.polishRequired) * 100)));
}

function cleanlinessClass(percent) {
  if (percent >= 85) {
    return "cleanliness-clean";
  }
  if (percent >= 60) {
    return "cleanliness-dusty";
  }
  if (percent >= 30) {
    return "cleanliness-dirty";
  }
  return "cleanliness-grimy";
}

function getRockIconMarkup(rock) {
  if (rock.iconUrl) {
    return `<img src="${rock.iconUrl}" alt="${rock.name}" loading="lazy" decoding="async" />`;
  }
  return rock.icon || "?";
}

function updateSparkles(cleanlinessPercent) {
  sparklesEl.innerHTML = "";
  if (cleanlinessPercent < 80) {
    return;
  }

  const sparkleStrength = (cleanlinessPercent - 80) / 20;
  const sparkleCount = Math.max(1, Math.round(2 + sparkleStrength * 8));

  for (let i = 0; i < sparkleCount; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle-dot";
    sparkle.style.left = `${8 + Math.random() * 84}%`;
    sparkle.style.top = `${10 + Math.random() * 72}%`;
    sparkle.style.animationDelay = `${Math.random() * 1.8}s`;
    sparkle.style.animationDuration = `${1.2 + Math.random() * 1.6}s`;
    sparklesEl.appendChild(sparkle);
  }
}

function renderInventory() {
  inventoryEl.innerHTML = "";

  if (state.inventory.length === 0) {
    emptyEl.style.display = "block";
    renderDetails(null);
    return;
  }

  emptyEl.style.display = "none";
  state.inventory.forEach((rock) => {
    const cleanliness = getCleanlinessPercent(rock);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rock-card ${rarityClass(rock.rarity)} ${state.activeRockId === rock.id ? "is-active" : ""}`;
    button.innerHTML = `
      <span class="rock-card-icon">${getRockIconMarkup(rock)}</span>
      <span class="rock-card-name">${rock.name}</span>
      <span class="rock-cleanliness ${cleanlinessClass(cleanliness)}">Cleanliness ${cleanliness}%</span>
    `;
    button.addEventListener("click", () => {
      state.activeRockId = rock.id;
      saveState();
      renderInventory();
    });
    inventoryEl.appendChild(button);
  });

  renderDetails(getActiveRock());
}

function renderDetails(rock) {
  if (!rock) {
    nameEl.textContent = "No rock selected";
    metaEl.textContent = "";
    iconEl.textContent = "?";
    updateSparkles(0);
    hintEl.textContent = "Select a rock to start polishing";
    progressFillEl.style.width = "0%";
    zoneEl.style.setProperty("--dirt-opacity", "0");
    statusEl.textContent = "";
    return;
  }

  const progress = getCleanlinessPercent(rock);
  const dirtOpacity = Math.max(0, ((100 - progress) / 100) * 0.82).toFixed(2);
  nameEl.textContent = rock.name;
  metaEl.innerHTML = `
    <span class="rock-rarity ${rarityClass(rock.rarity)}">${rock.rarity}</span>
    <span class="rock-cleanliness ${cleanlinessClass(progress)}">Cleanliness ${progress}%</span>
  `;
  iconEl.innerHTML = getRockIconMarkup(rock);
  updateSparkles(progress);
  progressFillEl.style.width = `${progress}%`;
  zoneEl.style.setProperty("--dirt-opacity", dirtOpacity);

  if (rock.polishProgress >= rock.polishRequired) {
    hintEl.textContent = "Fully polished!";
    statusEl.textContent = "Shiny and complete.";
  } else {
    hintEl.textContent = "Move your mouse around this box to polish";
    statusEl.textContent = "Keep polishing to finish this rock.";
  }
}

function chooseRandomRock() {
  const totalWeight = rockPool.reduce((sum, rock) => sum + rock.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const rock of rockPool) {
    roll -= rock.weight;
    if (roll <= 0) {
      return rock;
    }
  }
  return rockPool[0];
}

function claimRock() {
  const template = chooseRandomRock();
  const freshRock = {
    id: `rock-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    name: template.name,
    icon: template.icon,
    iconUrl: template.iconUrl || "",
    rarity: template.rarity,
    polishRequired: template.polishRequired,
    polishProgress: 0
  };

  state.inventory.unshift(freshRock);
  state.activeRockId = freshRock.id;
  hideClaimPrompt();
  saveState();
  renderInventory();
}

function hideClaimPrompt() {
  state.promptVisible = false;
  claimButtonEl.classList.remove("is-visible");
  if (state.hidePromptTimer) {
    clearTimeout(state.hidePromptTimer);
    state.hidePromptTimer = null;
  }
}

function showClaimPrompt() {
  if (document.hidden || state.promptVisible) {
    return;
  }
  state.promptVisible = true;
  claimButtonEl.classList.add("is-visible");
  state.hidePromptTimer = setTimeout(() => {
    hideClaimPrompt();
  }, PROMPT_VISIBLE_MS);
}

function scheduleClaimPrompt() {
  if (state.promptTimer) {
    clearInterval(state.promptTimer);
  }
  state.promptTimer = setInterval(() => {
    showClaimPrompt();
  }, PROMPT_INTERVAL_MS);
}

function applyDecayForElapsedMs(elapsedMs) {
  if (elapsedMs <= 0) {
    return false;
  }

  let hasChange = false;
  state.inventory.forEach((rock) => {
    const dirtRate = DIRT_RATE_BY_RARITY[rock.rarity] || 1;
    const decayPerMs = (rock.polishRequired * 0.005 * dirtRate) / DIRTY_INTERVAL_MS;
    const decayAmount = elapsedMs * decayPerMs;
    const nextProgress = Math.max(0, rock.polishProgress - decayAmount);
    if (nextProgress !== rock.polishProgress) {
      rock.polishProgress = nextProgress;
      hasChange = true;
    }
  });
  return hasChange;
}

function decayToNow() {
  const now = Date.now();
  const elapsedMs = now - state.lastDecayAt;
  const hasChange = applyDecayForElapsedMs(elapsedMs);
  state.lastDecayAt = now;
  saveState();
  return hasChange;
}

function scheduleDirtDecay() {
  if (state.dirtTimer) {
    clearInterval(state.dirtTimer);
  }
  state.dirtTimer = setInterval(() => {
    if (document.hidden) {
      return;
    }

    const hasChange = decayToNow();
    if (hasChange) {
      renderInventory();
    }
  }, DIRTY_INTERVAL_MS);
}

function polishActiveRock() {
  if (document.hidden) {
    return;
  }

  const rock = getActiveRock();
  if (!rock || rock.polishProgress >= rock.polishRequired) {
    return;
  }

  const now = Date.now();
  const elapsedSeconds = Math.max(0.008, (now - lastPolishAt) / 1000);
  lastPolishAt = now;
  const polishRate = POLISH_PER_SECOND_BY_RARITY[rock.rarity] || 10;
  const gain = polishRate * elapsedSeconds;
  rock.polishProgress = Math.min(rock.polishRequired, rock.polishProgress + gain);
  state.lastDecayAt = Date.now();
  saveState();
  renderInventory();
}

claimButtonEl.addEventListener("click", claimRock);
zoneEl.addEventListener("mousemove", polishActiveRock);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hideClaimPrompt();
    state.lastDecayAt = Date.now();
    lastPolishAt = Date.now();
    saveState();
    return;
  }

  lastPolishAt = Date.now();
  const hasChange = decayToNow();
  if (hasChange) {
    renderInventory();
  }
});

loadState();
lastPolishAt = Date.now();
decayToNow();
renderInventory();
scheduleClaimPrompt();
scheduleDirtDecay();
