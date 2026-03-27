document.getElementById("year").textContent = new Date().getFullYear();

const ACTIVE_KEY = "displayCaseActiveRockId";

const curatedRocks = [
  {
    id: "agate",
    name: "Agate",
    inventoryIconUrl: "assets/rock-collection/icon--agate.png",
    detailImageUrl: "assets/rock-collection/icon--agate.png",
    connectionTags: ["Studied", "Found"],
    context: "Field and personal collection",
    whyImportant:
      "A favorite for showing banded growth textures and how observation in hand sample can connect to larger geologic history.",
    fieldNotes:
      "Icon and detail image are linked for now; replace detailImageUrl with the final field photo whenever it is ready."
  },
  {
    id: "banded-iron-formation",
    name: "Banded Iron Formation",
    inventoryIconUrl: "assets/rock-collection/icon--banded-iron-formation.png",
    detailImageUrl: "assets/rock-collection/icon--banded-iron-formation.png",
    connectionTags: ["Studied", "Meaningful"],
    context: "Rock magnetism laboratory work",
    whyImportant:
      "The alternating layers and magnetic behavior make this one especially useful for discussing how mineralogy and magnetic signal interact.",
    fieldNotes:
      "Prepared and revisited in lab sessions to compare behavior across measurement methods."
  },
  {
    id: "garnet-schist",
    name: "Garnet Schist",
    inventoryIconUrl: "assets/rock-collection/icon--garnet-schist-new.png",
    detailImageUrl: "assets/rock-collection/icon--garnet-schist-new.png",
    connectionTags: ["Studied", "Found"],
    context: "Recent field documentation",
    whyImportant:
      "Represents an updated sample image and helps compare visual differences between related garnet-bearing materials.",
    fieldNotes:
      "Updated to use the newer icon/photo set for this rock."
  },
  {
    id: "mn-gneiss",
    name: "MN Gneiss",
    inventoryIconUrl: "assets/rock-collection/icon--mn-gneiss.png",
    detailImageUrl: "assets/rock-collection/icon--mn-gneiss.png",
    connectionTags: ["Studied", "Found"],
    context: "Minnesota regional geology",
    whyImportant:
      "A foundational rock type for discussing regional metamorphic history and field identification practice.",
    fieldNotes:
      "Great teaching sample for foliation and compositional banding in hand specimen."
  },
  {
    id: "rose-quartz",
    name: "Rose Quartz",
    inventoryIconUrl: "assets/rock-collection/icon--rose-quartz.png",
    detailImageUrl: "assets/rock-collection/icon--rose-quartz.png",
    connectionTags: ["Found", "Meaningful"],
    context: "Personal and field connection",
    whyImportant:
      "Included for personal significance and as a contrasting mineral texture/color compared with darker metamorphic samples.",
    fieldNotes:
      "This is a good candidate for a future field-context photo once selected."
  },
  {
    id: "speleothem",
    name: "Speleothem",
    inventoryIconUrl: "assets/rock-collection/icon--speleothem.png",
    detailImageUrl: "assets/rock-collection/icon--speleothem.png",
    connectionTags: ["Studied", "Meaningful"],
    context: "Thesis and manuscript work",
    whyImportant:
      "Represents a major through-line in Emma's research on viscous remanent magnetization in cave materials.",
    fieldNotes:
      "Ties together field context, sample processing, and interpretation in ongoing writing."
  },
  {
    id: "vesicular-basalt",
    name: "Vesicular Basalt",
    inventoryIconUrl: "assets/rock-collection/icon--vesicular-basalt.png",
    detailImageUrl: "assets/rock-collection/icon--vesicular-basalt.png",
    connectionTags: ["Studied", "Found"],
    context: "Volcanic field context",
    whyImportant:
      "Helpful for showing volcanic textures and discussing gas escape features preserved in igneous rocks.",
    fieldNotes:
      "Strong visual entry for the display-case layout because vesicles read clearly in icon form."
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
