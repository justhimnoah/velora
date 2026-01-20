/* ======================================
   Velora CONFIGURATOR — FIXED
====================================== */

/* ---------- IMPORTS ---------- */
import { db, auth } from "./firebase.js";
import {
  doc,
  setDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ---------- AUTH GUARD ---------- */
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.replace("login.html");
  }
});

/* ---------- CONSTANTS ---------- */
const BASE_WEIGHT = 280;
const BASE_BATTERY = 10;

/* ---------- STATE ---------- */
const state = {
  tier: null,
  storage: null,
  controller: {
    triggers: null,
    haptics: null,
    sticks: null,
    stickCaps: null,
    backButtons: null,
    battery: null
  },
  prices: {
    tier: 0,
    storage: 0,
    controller: {
      triggers: 0,
      haptics: 0,
      sticks: 0,
      stickCaps: 0,
      backButtons: 0,
      battery: 0
    }
  }
};

/* ---------- DOM ---------- */
const totalPriceEl = document.getElementById("totalPrice");
const sumTier = document.getElementById("sum-tier");
const sumStorage = document.getElementById("sum-storage");
const sumController = document.getElementById("sum-controller");

const weightEl = document.getElementById("weightValue");
const batteryEl = document.getElementById("batteryValue");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const mainSlides = document.querySelectorAll(".config-slide");
const controllerSlides = document.querySelectorAll(".controller-slide");
const controllerSteps = document.querySelectorAll(".controller-steps span");

let mainIndex = 0;
let controllerIndex = 0;

/* ---------- CALCULATIONS ---------- */
function controllerTotal() {
  return Object.values(state.prices.controller).reduce((a, b) => a + b, 0);
}

function calculateWeight() {
  let w = BASE_WEIGHT;

  if (state.controller.triggers === "Adaptive Triggers") w += 18;
  if (state.controller.haptics === "Advanced Haptics") w += 22;
  if (state.controller.sticks === "High-tension Sticks") w += 8;
  if (state.controller.stickCaps === "One Stick Cap") w += 5;
  if (state.controller.stickCaps === "Both Stick Caps") w += 10;
  if (state.controller.backButtons === "2 Back Buttons") w += 10;
  if (state.controller.backButtons === "4 Back Buttons") w += 18;
  if (state.controller.battery === "Extended Battery") w += 25;

  return w;
}

function calculateBatteryLife() {
  let h = BASE_BATTERY;

  if (state.controller.triggers === "Adaptive Triggers") h -= 0.5;
  if (state.controller.haptics === "Advanced Haptics") h -= 1.2;
  if (state.controller.backButtons === "2 Back Buttons") h -= 0.2;
  if (state.controller.backButtons === "4 Back Buttons") h -= 0.4;
  if (state.controller.battery === "Extended Battery") h += 4;

  return Math.max(h, 4).toFixed(1);
}

/* ---------- UI ---------- */
function updatePrice() {
  totalPriceEl.textContent =
    state.prices.tier +
    state.prices.storage +
    controllerTotal();
}

function updateStats() {
  weightEl.textContent = `${calculateWeight()}g`;
  batteryEl.textContent = `${calculateBatteryLife()} hrs`;
}

function updateProgress() {
  const checklist = [
    !!state.tier,
    !!state.storage,
    ...Object.values(state.controller).map(Boolean)
  ];

  const percent = Math.round(
    (checklist.filter(Boolean).length / checklist.length) * 100
  );

  progressText.textContent = `${percent}% complete`;
  progressFill.style.width = `${percent}%`;
}

function updateSidebar() {
  sumTier.textContent = state.tier || "—";
  sumStorage.textContent = state.storage || "—";
  sumController.textContent =
    Object.values(state.controller).filter(Boolean).join(" • ") || "—";

  updateStats();
  updateProgress();
}

/* ---------- NAV ---------- */
function showMain(i) {
  if (i < 0 || i >= mainSlides.length) return;

  mainSlides[mainIndex].classList.remove("active");
  mainSlides[i].classList.add("active");
  mainIndex = i;
}

function showController(i) {
  if (i < 0 || i >= controllerSlides.length) return;

  controllerSlides.forEach(s => s.classList.remove("active"));

  controllerSteps.forEach((step, index) => {
    step.classList.remove("active", "completed");
    if (index < i) step.classList.add("completed");
    if (index === i) step.classList.add("active");
  });

  controllerSlides[i].classList.add("active");
  controllerIndex = i;
}

/* ---------- OPTION HANDLER ---------- */
function setup(selector, apply) {
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener("click", e => {
      e.stopPropagation();

      const group = card
        .closest(".config-options")
        ?.querySelectorAll(selector);

      group?.forEach(c => {
        c.classList.remove("selected", "dimmed");
        if (c !== card) c.classList.add("dimmed");
      });

      card.classList.add("selected");
      apply(card.dataset.label, Number(card.dataset.price));

      card.closest(".config-slide, .controller-slide")
        ?.querySelector(".config-next, .controller-next")
        ?.classList.remove("locked");

      updatePrice();
      updateSidebar();
    });
  });
}

/* ---------- OPTIONS ---------- */
setup("[data-tier]", (l, p) => { state.tier = l; state.prices.tier = p; });
setup("[data-storage]", (l, p) => { state.storage = l; state.prices.storage = p; });

setup("[data-triggers]", (l, p) => { state.controller.triggers = l; state.prices.controller.triggers = p; });
setup("[data-haptics]", (l, p) => { state.controller.haptics = l; state.prices.controller.haptics = p; });
setup("[data-sticks]", (l, p) => { state.controller.sticks = l; state.prices.controller.sticks = p; });
setup("[data-stickcaps]", (l, p) => { state.controller.stickCaps = l; state.prices.controller.stickCaps = p; });
setup("[data-backbuttons]", (l, p) => { state.controller.backButtons = l; state.prices.controller.backButtons = p; });
setup("[data-battery]", (l, p) => { state.controller.battery = l; state.prices.controller.battery = p; });

/* ---------- ADD TO CART ---------- */
async function saveBuildToCart(redirectTo) {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const cartData = {
    tier: state.tier,
    storage: state.storage,
    controller: state.controller,
    stats: {
      weight: calculateWeight(),
      batteryLife: calculateBatteryLife()
    },
    price:
      state.prices.tier +
      state.prices.storage +
      controllerTotal(),
    createdAt: Date.now()
  };

  await addDoc(
    collection(db, "users", user.uid, "cart"),
    cartData
  );

  window.location.href = redirectTo;
}

/* ---------- BUTTONS ---------- */
document.querySelectorAll(".config-next").forEach(b =>
  b.addEventListener("click", () =>
    !b.classList.contains("locked") && showMain(mainIndex + 1))
);

document.querySelectorAll(".config-back").forEach(b =>
  b.addEventListener("click", () => showMain(mainIndex - 1))
);

document.querySelectorAll(".controller-next").forEach(b =>
  b.addEventListener("click", () =>
    !b.classList.contains("locked") && showController(controllerIndex + 1))
);

document.querySelectorAll(".controller-back").forEach(b =>
  b.addEventListener("click", () => showController(controllerIndex - 1))
);

document
  .getElementById("finalAddToCart")
  ?.addEventListener("click", () => {
    saveBuildToCart("cart.html");
  });

document
  .getElementById("finalCheckout")
  ?.addEventListener("click", () => {
    saveBuildToCart("checkout.html");
  });

/* ---------- INIT ---------- */
showMain(0);
showController(0);
updatePrice();
updateSidebar();
