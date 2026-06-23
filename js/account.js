import { supabase } from "./supabase.js";

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

async function getUserDoc(uid) {
  const { data } = await supabase.from("users")
    .select("*")
    .eq("uid", uid)
    .maybeSingle();
  return data || {};
}

/* -------------------------
   INIT
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
  setupPrivacyUI();
  setupConsoleUI();
  setupSupportUI();
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      window.location.href = "login.html";
      return;
    }
    currentUser = session.user;
    loadProfile(session.user);
    loadVeloraId(session.user);
    loadSecurity(session.user);
    await loadPrivacyFromSupabase();
    await loadConsoleFromSupabase();
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
  // 🔹 Auth-based
  document.getElementById("displayNameText").textContent =
    user.displayName || "Velora User";

  document.getElementById("emailText").textContent = user.email;
  document.getElementById("memberSince").textContent =
    formatTime(user.metadata.creationTime);

  // 🔹 Firestore-based
  const userData = await getUserDoc(user.uid);

  // ✅ Velora Handle (FIXED)
  document.getElementById("veloraHandle").textContent =
    userData.veloraId ? `@${userData.veloraId}` : "@veloruser";

  // 🔹 Avatar
  const avatarEl = document.getElementById("profileAvatar");
  avatarEl.innerHTML = "";

  if (userData.profilePic) {
    const img = document.createElement("img");
    img.src = `assets/pfp/${userData.profilePic}`;
    img.alt = "Profile";
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent =
      (user.displayName || "O")[0].toUpperCase();
  }

  // 🔹 Display name edit
  const input = document.getElementById("displayNameInput");
  input.value = user.displayName || "";

  document.getElementById("saveDisplayName").onclick = async () => {
    if (!input.value.trim()) return;
    await supabase.from("users")
    .update({ displayName: input.value.trim() })
    .eq("uid", currentUser.id);
    loadProfile(currentUser);
  };

  // 🔹 Profile picture grid
  setupProfilePicGrid(userData.profilePic || null);
}

/* -------------------------
   VELORA ID
------------------------- */
async function loadVeloraId(user) {
  const input = document.getElementById("veloraIdInput");
  const status = document.getElementById("veloraIdStatus");
  const btn = document.getElementById("changeVeloraIdBtn");

  // Fetch user data ONCE
  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    status.textContent = "Unable to load Velora ID data.";
    return;
  }

  const data = snap.data();

  const currentId = data.veloraId || "";
  const lastChangedTs = data.veloraLastChanged;

  input.value = currentId;

  document.getElementById("veloraHandle").textContent =
    currentId ? `@${currentId}` : "@velorauser";

  // 🔥 COOLDOWN LOGIC
  const cooldownMs = 7 * 24 * 60 * 60 * 1000;
  const lastChanged = lastChangedTs?.toDate?.().getTime() || 0;
  const remaining = lastChanged + cooldownMs - Date.now();

  const canChange = remaining <= 0;

  // ✅ SINGLE SOURCE OF TRUTH
  input.disabled = !canChange;
  btn.disabled = !canChange;

  status.textContent = canChange
    ? "You can change your Velora ID now."
    : `You can change your Velora ID in ${formatRemaining(remaining)}.`;

  // 🔥 BUTTON CLICK
  btn.onclick = async () => {
  const newId = input.value.trim().toLowerCase();

  if (!newId.match(/^[a-z0-9_]{4,16}$/)) {
    status.textContent =
      "ID must be 4–16 chars, lowercase letters, numbers, or underscore.";
    return;
  }

  if (newId === currentId) return;

  try {
    // 🔍 Check if new ID exists
    const newIdSnap = await getDoc(doc(db, "veloraIds", newId));
    if (newIdSnap.exists()) {
      status.textContent = "This Velora ID is already taken.";
      return;
    }

    await supabase.from("veloraids").delete().eq("id", currentId);
    await supabase.from("veloraids").insert({ id: newId, uid: currentUser.id });
    await supabase.from("users").update({
      veloraid: newId,
      veloraLastChanged: new Date()
    }).eq("uid", currentUser.id);

    status.textContent = "Velora ID updated successfully!";

    // 🔄 Reload state
    loadVeloraId(user);

  } catch (err) {
    console.error(err);
    status.textContent = "Failed to update Velora ID.";
  }
};
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
    if (!newEmail || newEmail === currentUser.email) return;

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      showInlineError(emailCard, "Failed to update email.");
    } else {
      emailBtn.textContent = "Verification sent";
      emailBtn.disabled = true;
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

  privacy.updatedAt = new Date();

  await supabase.from("users")
    .update({ privacy })
    .eq("uid", currentUser.id);

  // ✅ INLINE "Saved" HINT
  saveStatus.classList.add("visible");

  setTimeout(() => {
    saveStatus.classList.remove("visible");
  }, 2000);
}

async function loadPrivacyFromSupabase() {
  const { data: userRow, error } = await supabase
    .from("users")
    .select("privacy")
    .eq("uid", currentUser.id)
    .maybeSingle();

  if (error || !userRow?.privacy) return;

  const privacy = userRow.privacy;
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

  consoleSettings.updatedAt = new Date();

  await supabase.from("users")
    .update({ consoleSettings })
    .eq("uid", currentUser.id);

  saveStatus.classList.add("visible");
  setTimeout(() => saveStatus.classList.remove("visible"), 2000);
}

async function loadConsoleFromSupabase() {
  const { data: userRow, error } = await supabase
    .from("users")
    .select("consoleSettings")
    .eq("uid", currentUser.id)
    .maybeSingle();

  if (error || !userRow?.consoleSettings) return;

  const settings = userRow.consoleSettings;

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

  const { data: orders } = await supabase.from("orders")
    .select("*")
    .eq("uid", currentUser.id)
    .order("createdAt", { ascending: false });

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


  await supabase.from("supportTickets").insert(ticketData);

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

  const { data: tickets, error } = await supabase
    .from("supportTickets")
    .select("*")
    .eq("userId", currentUser.id)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error(error);
    list.innerHTML = `<div class="orders-empty">Failed to load tickets.</div>`;
    return;
  }

  if (!tickets || tickets.length === 0) {
    list.innerHTML = `<div class="orders-empty">No support tickets yet.</div>`;
    return;
  }

  tickets.forEach(t => {
    const row = document.createElement("div");
    row.className = "order-row";

    const status = normalizeTicketStatus(t.status);

    row.innerHTML = `
      <span>#${t.id.slice(0, 6)}</span>
      <span>${t.subject}</span>
      <span class="order-status ${status}">
        ${formatTicketStatus(status)}
      </span>
      <span>${formatDate(new Date(t.createdAt))}</span>
      <span>
        <a class="primary-btn small-btn"
          href="support-ticket.html?id=${t.id}">
          View
        </a>
      </span>
    `;

    list.appendChild(row);
  });
}