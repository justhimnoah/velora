import { auth } from "./firebase.js";
import { db } from "./firebase.js";

import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,         
  orderBy,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* -------------------------
   GLOBAL STATE
------------------------- */
let currentUser = null;

/* -------------------------
   HELPERS
------------------------- */

function formatTime(dateInput) {
  if (!dateInput) return "—";

  const d = new Date(dateInput);
  if (isNaN(d)) return "—";

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function formatDate(dateInput) {
  if (!dateInput) return "—";

  const d = new Date(dateInput);
  if (isNaN(d)) return "—";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
}

function formatRemaining(ms) {
  if (ms <= 0) return "now";
  const day = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (day > 0) return `${day} day${day !== 1 ? "s" : ""}`;
  return "soon";
}

function showInlineError(card, message) {
  let err = card.querySelector(".hint.error");
  if (!err) {
    err = document.createElement("div");
    err.className = "hint error";
    card.appendChild(err);
  }
  err.textContent = message;
}

function clearInlineError(card) {
  const err = card.querySelector(".hint.error");
  if (err) err.remove();
}

function formatAmount(amount, currency = "INR") {
  if (typeof amount !== "number") return "—";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function normalizeTicketStatus(raw) {
  if (!raw) return "open";

  const s = raw.toString().toLowerCase();

  if (s === "in progress" || s === "in_progress") return "in_progress";
  if (s === "resolved") return "resolved";
  return "open";
}

function formatTicketStatus(status) {
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return "Open";
}

function setupProfilePicGrid(currentPic) {
  const grid = document.getElementById("pfpGrid");
  const saveBtn = document.getElementById("saveProfilePicBtn");

  grid.innerHTML = "";
  selectedProfilePic = null;
  saveBtn.disabled = true;

  PROFILE_PICS.forEach(pic => {
    const img = document.createElement("img");
    img.src = `assets/pfp/${pic}`;

    if (pic === currentPic) {
      img.classList.add("selected");
    }

    if (pic === currentPic) {
      selectedProfilePic = pic;
    }

    img.onclick = () => {
      document
        .querySelectorAll(".pfp-grid img")
        .forEach(i => i.classList.remove("selected"));

      img.classList.add("selected");
      selectedProfilePic = pic;
      saveBtn.disabled = false;
    };

    grid.appendChild(img);
  });

  saveBtn.onclick = saveProfilePicture;
}

async function saveProfilePicture() {
  if (!selectedProfilePic) return;

  await setDoc(
    doc(db, "users", currentUser.uid),
    { profilePic: selectedProfilePic },
    { merge: true }
  );

  loadProfile(currentUser);
}

/* -------------------------
   INIT
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
  setupPrivacyUI();
  setupConsoleUI();
  setupSupportUI();
  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    currentUser = user;

    loadProfile(user);
    loadOrbitId(user);
    loadSecurity(user);
    await loadPrivacyFromFirestore();
    await loadConsoleFromFirestore();
    await loadOrders();
    await loadTickets();
  });
});

const PROFILE_PICS = [
  "test2.jfif",
  "test.jpg"
];

let selectedProfilePic = null;

/* -------------------------
   SIDEBAR
------------------------- */
function setupSidebar() {
  const buttons = document.querySelectorAll(".side-item");
  const sections = document.querySelectorAll(".section");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.section)?.classList.add("active");
    });
  });
}

/* -------------------------
   PROFILE
------------------------- */
async function loadProfile(user) {
  document.getElementById("displayNameText").textContent =
    user.displayName || "Orbit User";

  document.getElementById("orbitHandle").textContent =
    "@orbituser";

  document.getElementById("emailText").textContent = user.email;
  document.getElementById("memberSince").textContent =
    formatTime(user.metadata.creationTime);

  const avatarEl = document.getElementById("profileAvatar");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const profilePic = userSnap.exists() ? userSnap.data().profilePic : null;

  avatarEl.innerHTML = "";

  if (profilePic) {
    const img = document.createElement("img");
    img.src = `assets/pfp/${profilePic}`;
    img.alt = "Profile";
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent =
      (user.displayName || "O")[0].toUpperCase();
  }

  const input = document.getElementById("displayNameInput");
  input.value = user.displayName || "";

  document.getElementById("saveDisplayName").onclick = async () => {
    if (!input.value.trim()) return;
    await updateProfile(user, { displayName: input.value.trim() });
    loadProfile(auth.currentUser);
  };

  setupProfilePicGrid(profilePic);
}


/* -------------------------
   ORBIT ID (UI ONLY)
------------------------- */
function loadOrbitId(user) {
  const input = document.getElementById("orbitIdInput");
  const status = document.getElementById("orbitIdStatus");
  const btn = document.getElementById("changeOrbitIdBtn");

  input.value = "orbitadmin";
  input.disabled = true;

  const cooldownMs = 7 * 24 * 60 * 60 * 1000;
  const createdAt = new Date(user.metadata.creationTime).getTime();
  const remaining = createdAt + cooldownMs - Date.now();

  if (remaining <= 0) {
    status.textContent = "You can change your Orbit ID now.";
    btn.disabled = false;
  } else {
    status.textContent =
      `You can change your Orbit ID in ${formatRemaining(remaining)}.`;
    btn.disabled = true;
  }
}

/* -------------------------
   SECURITY
------------------------- */
function loadSecurity(user) {
  const cards = document.querySelectorAll("#security .account-card");

  const emailCard = cards[0];
  const emailInputs = emailCard.querySelectorAll("input");
  const emailBtn = emailCard.querySelector("button");

  emailInputs[0].value = user.email;
  emailInputs[0].disabled = true;

  emailBtn.onclick = async () => {
    clearInlineError(emailCard);
    const newEmail = emailInputs[1].value.trim();
    if (!newEmail || newEmail === user.email) return;

    try {
      const password = prompt("Enter your current password:");
      if (!password) return;

      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await verifyBeforeUpdateEmail(user, newEmail);

      emailBtn.textContent = "Verification sent";
      emailBtn.disabled = true;
    } catch {
      showInlineError(emailCard, "Failed to update email.");
    }
  };

  const activity = document.querySelectorAll("#security .profile-meta div");

  activity[0].innerHTML =
    `<strong>Account created:</strong> ${formatTime(user.metadata.creationTime)}`;

  activity[1].innerHTML =
    `<strong>Last login:</strong> ${formatTime(user.metadata.lastSignInTime)}`;

  const pwChanged =
    user.reloadUserInfo?.passwordUpdatedAt
      ? new Date(parseInt(user.reloadUserInfo.passwordUpdatedAt))
      : null;

  activity[2].innerHTML =
    `<strong>Last password change:</strong> ${formatTime(pwChanged)}`;
}

/* -------------------------
   PRIVACY (FIRESTORE-SYNCED)
------------------------- */
function setupPrivacyUI() {
  document.querySelectorAll(".segmented").forEach(group => {
    const segments = group.querySelectorAll(".segment");
    segments.forEach(seg => {
      seg.onclick = () => {
        segments.forEach(s => s.classList.remove("active"));
        seg.classList.add("active");
      };
    });
  });

  document.getElementById("savePrivacyBtn").onclick = savePrivacy;
}

async function savePrivacy() {
  const saveStatus = document.getElementById("privacySaveStatus");

  const mapValue = text =>
    text === "Everyone" ? "everyone" :
    text === "Friends" ? "friends" :
    "no_one";

  const privacy = {};

  document.querySelectorAll("#privacy .privacy-row").forEach(row => {
    const key = row.dataset.key;
    const valueText = row.querySelector(".segment.active").textContent;
    privacy[key] = mapValue(valueText);
  });

  privacy.updatedAt = serverTimestamp();

  await setDoc(
    doc(db, "users", currentUser.uid),
    { privacy },
    { merge: true }
  );

  // ✅ INLINE "Saved" HINT
  saveStatus.classList.add("visible");

  setTimeout(() => {
    saveStatus.classList.remove("visible");
  }, 2000);
}

async function loadPrivacyFromFirestore() {
  const snap = await getDoc(doc(db, "users", currentUser.uid));
  if (!snap.exists()) return;

  const privacy = snap.data().privacy;
  if (!privacy) return;

  const mapText = v =>
    v === "everyone" ? "Everyone" :
    v === "friends" ? "Friends" :
    "No one";

  document.querySelectorAll("#privacy .privacy-row").forEach(row => {
    const key = row.dataset.key;
    if (!privacy[key]) return;

    row.querySelectorAll(".segment").forEach(seg => {
      seg.classList.toggle(
        "active",
        seg.textContent === mapText(privacy[key])
      );
    });
  });
}

/* =================
   CONSOLE SETTINGS 
==================== */
function setupConsoleUI() {
  document.querySelectorAll("#console .segmented").forEach(group => {
    const segments = group.querySelectorAll(".segment");
    segments.forEach(seg => {
      seg.onclick = () => {
        segments.forEach(s => s.classList.remove("active"));
        seg.classList.add("active");
      };
    });
  });

  document.getElementById("saveConsoleBtn").onclick = saveConsoleSettings;
}

async function saveConsoleSettings() {
  const saveStatus = document.getElementById("consoleSaveStatus");
  const consoleSettings = {};

  document.querySelectorAll("#console .privacy-row").forEach(row => {
    const key = row.dataset.key;
    const value = row.querySelector(".segment.active").textContent === "On";
    consoleSettings[key] = value;
  });

  consoleSettings.updatedAt = serverTimestamp();

  await setDoc(
    doc(db, "users", currentUser.uid),
    { consoleSettings },
    { merge: true }
  );

  saveStatus.classList.add("visible");
  setTimeout(() => saveStatus.classList.remove("visible"), 2000);
}

async function loadConsoleFromFirestore() {
  const snap = await getDoc(doc(db, "users", currentUser.uid));
  if (!snap.exists()) return;

  const settings = snap.data().consoleSettings;
  if (!settings) return;

  document.querySelectorAll("#console .privacy-row").forEach(row => {
    const key = row.dataset.key;
    if (!(key in settings)) return;

    row.querySelectorAll(".segment").forEach(seg => {
      seg.classList.toggle(
        "active",
        (seg.textContent === "On") === settings[key]
      );
    });
  });
}

/* ========
   ORDERS
=========== */
async function loadOrders() {
  const list = document.getElementById("ordersList");
  list.innerHTML = "";

  const q = query(
    collection(db, "users", currentUser.uid, "orders"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    list.innerHTML = `<div class="orders-empty">You haven’t made any purchases yet.</div>`;
    return;
  }

  snap.forEach(docSnap => {
    const o = docSnap.data();

    const row = document.createElement("div");
    row.className = "order-row";

    const amountText = formatAmount(o.amount, o.currency || "INR");
    const isPaid = String(o.status).toLowerCase() === "paid";

    row.innerHTML = `
      <span>${o.orderId || "—"}</span>
      <span>${formatDate(o.createdAt?.toDate?.())}</span>
      <span>${o.product || "—"}</span>
      <span>${amountText}</span>
      <span class="order-status ${isPaid ? "paid" : ""}">
        ${isPaid ? "Paid" : "—"}
      </span>
    `;

    list.appendChild(row);
  });
}

/* ========
   SUPPORT
=========== */

function setupSupportUI() {
  document.getElementById("createTicketBtn").onclick = createTicket;
}

/* -------------------------
   CREATE TICKET
------------------------- */
async function createTicket() {
  const subject = document.getElementById("ticketSubject").value.trim();
  const category = document.getElementById("ticketCategory").value;
  const message = document.getElementById("ticketMessage").value.trim();
  const statusText = document.getElementById("ticketCreateStatus");

  if (!subject || !message) return;

  const ticketData = {
    subject,
    category,
    message,
    status: "open",
    userId: currentUser.uid,              // 🔑 admin needs this
    userEmail: currentUser.email || null, // optional but useful
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };


  await addDoc(
    collection(db, "supportTickets"),
    ticketData
  );

  statusText.classList.add("visible");
  setTimeout(() => statusText.classList.remove("visible"), 2000);

  document.getElementById("ticketSubject").value = "";
  document.getElementById("ticketMessage").value = "";

  loadTickets();
}

/* -------------------------
   LOAD USER TICKETS
------------------------- */
async function loadTickets() {
  const list = document.getElementById("ticketList");
  list.innerHTML = "";

  const snap = await getDocs(
    query(
      collection(db, "supportTickets"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    )
  );

  if (snap.empty) {
    list.innerHTML = `<div class="orders-empty">No support tickets yet.</div>`;
    return;
  }

  snap.forEach(docSnap => {
    const t = docSnap.data();

    const row = document.createElement("div");
    row.className = "order-row";

    const status = normalizeTicketStatus(t.status);

    row.innerHTML = `
      <span>#${docSnap.id.slice(0, 6)}</span>
      <span>${t.subject}</span>
      <span class="order-status ${status}">
        ${formatTicketStatus(status)}
      </span>
      <span>${formatDate(t.createdAt?.toDate?.())}</span>
      <span>
        <a class="primary-btn small-btn"
           href="support-ticket.html?id=${docSnap.id}">
          View
        </a>
      </span>
    `;

    list.appendChild(row);
  });
}