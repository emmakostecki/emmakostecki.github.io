document.getElementById("year").textContent = new Date().getFullYear();

const ACTIVE_KEY = "displayCaseActiveRockId";

const curatedRocks = [
  {
    id: "garnet-schist-field",
    name: "Garnet Schist",
    inventoryIconUrl: "assets/rock-collection/garnet-schist.png",
    detailImageUrl: "assets/rock-collection/garnet-schist.png",
    connectionTags: ["Studied", "Found"],
    context: "Minnesota field sampling",
    whyImportant:
      "This sample connects field mapping with lab interpretation and is one of the clearest reminders of how textures record deformation history.",
    fieldNotes:
      "Collected during a long outcrop day where structural measurements and hand-sample notes were taken together."
  },
  {
    id: "banded-iron-formation-core",
    name: "Banded Iron Formation",
    inventoryIconUrl: "assets/rock-collection/banded-iron-formation.png",
    detailImageUrl: "assets/rock-collection/banded-iron-formation.png",
    connectionTags: ["Studied", "Meaningful"],
    context: "Rock magnetism laboratory work",
    whyImportant:
      "The alternating layers and magnetic behavior make this one especially useful for discussing how mineralogy and magnetic signal interact.",
    fieldNotes:
      "Prepared and revisited in lab sessions to compare behavior across measurement methods."
  },
  {
    id: "speleothem-section",
    name: "Speleothem Section",
    inventoryIconUrl: "assets/rock-collection/placeholder-icon.jpg",
    detailImageUrl: "assets/rock-collection/placeholder-detail.jpg",
    connectionTags: ["Studied", "Meaningful"],
    context: "Thesis and manuscript work",
    whyImportant:
      "This piece represents a major through-line in Emma's research on viscous remanent magnetization in cave materials.",
    fieldNotes:
      "Placeholder text and image path for now - swap with a real cave or sample photo when ready."
  }
];

const state = {
  activeRockId: null
};

const inventoryEl = document.getElementById("rock-inventory");
const emptyEl = document.getElementById("rock-empty");
const nameEl = document.getElementById("selected-rock-name");
const metaEl = document.getElementById("selected-rock-meta");
const imageEl = document.getElementById("selected-rock-image");
const contentEl = document.getElementById("selected-rock-content");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tagClass(tag) {
  const normalized = tag.toLowerCase();
  if (normalized === "studied") return "chip-studied";
  if (normalized === "found") return "chip-found";
  return "chip-meaningful";
}

function getActiveRock() {
  return curatedRocks.find((rock) => rock.id === state.activeRockId) || null;
}

function saveActiveRock() {
  if (state.activeRockId) {
    localStorage.setItem(ACTIVE_KEY, state.activeRockId);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

function loadActiveRock() {
  const saved = localStorage.getItem(ACTIVE_KEY);
  state.activeRockId = curatedRocks.some((rock) => rock.id === saved)
    ? saved
    : curatedRocks[0]?.id || null;
}

function renderDetails(rock) {
  if (!rock) {
    nameEl.textContent = "No rock selected";
    metaEl.textContent = "";
    imageEl.src = "";
    imageEl.alt = "";
    contentEl.innerHTML = "<p>Select a rock from the inventory to view its story and field notes.</p>";
    return;
  }

  nameEl.textContent = rock.name;
  metaEl.textContent = rock.context;
  imageEl.src = rock.detailImageUrl;
  imageEl.alt = `${rock.name} field or specimen photo`;
  contentEl.innerHTML = `
    <p class="rock-detail-label">Why This Rock Matters</p>
    <p>${escapeHtml(rock.whyImportant)}</p>
    <p class="rock-detail-label">Field Notes</p>
    <p>${escapeHtml(rock.fieldNotes)}</p>
  `;
}

function renderInventory() {
  inventoryEl.innerHTML = "";

  if (curatedRocks.length === 0) {
    emptyEl.style.display = "block";
    renderDetails(null);
    return;
  }

  emptyEl.style.display = "none";
  curatedRocks.forEach((rock) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rock-card ${state.activeRockId === rock.id ? "is-active" : ""}`;

    const tagsMarkup = rock.connectionTags
      .map((tag) => `<span class="rock-chip ${tagClass(tag)}">${escapeHtml(tag)}</span>`)
      .join("");

    button.innerHTML = `
      <span class="rock-card-icon">
        <img src="${escapeHtml(rock.inventoryIconUrl)}" alt="${escapeHtml(rock.name)} inventory icon" loading="lazy" decoding="async" />
      </span>
      <span class="rock-card-name">${escapeHtml(rock.name)}</span>
      <span class="rock-chip-row">${tagsMarkup}</span>
    `;

    button.addEventListener("click", () => {
      state.activeRockId = rock.id;
      saveActiveRock();
      renderInventory();
    });

    inventoryEl.appendChild(button);
  });

  renderDetails(getActiveRock());
}

loadActiveRock();
renderInventory();
