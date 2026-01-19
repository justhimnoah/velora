import { auth } from "/js/firebase.js";
import { db } from "/js/firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let allTickets = [];
let currentFilter = "all";

/* =========================
   AUTH + ROLE CHECK
========================= */

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  const roleSnap = await getDoc(doc(db, "roles", user.uid));
  const role = roleSnap.exists() ? roleSnap.data().role : null;

  if (!["admin", "support"].includes(role)) {
    window.location.href = "/index.html";
    return;
  }

  loadTickets();
});

/* =========================
   LOAD TICKETS
========================= */

async function loadTickets() {
  const table = document.getElementById("ticketTable");

  const snap = await getDocs(
    query(collection(db, "supportTickets"), orderBy("createdAt", "desc"))
  );

  allTickets = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  renderTickets();
}

/* =========================
   RENDER
========================= */

function renderTickets() {
  const table = document.getElementById("ticketTable");

  table.querySelectorAll(".ticket-row:not(.header), .empty")
    .forEach(el => el.remove());

  const filtered =
    currentFilter === "all"
      ? allTickets
      : allTickets.filter(t => t.status === currentFilter);

  if (filtered.length === 0) {
    table.insertAdjacentHTML(
      "beforeend",
      `<div class="empty">No tickets found.</div>`
    );
    return;
  }

  filtered.forEach(t => {
    const row = document.createElement("div");
    row.className = "ticket-row";

    row.innerHTML = `
      <span>#${t.id.slice(0, 6)}</span>
      <span>${t.subject}</span>
      <span>${t.userId.slice(0, 8)}…</span>
      <span class="status ${t.status}">
        ${formatStatus(t.status)}
      </span>
      <button class="view-btn">View</button>
    `;

    row.querySelector(".view-btn").onclick = () => {
      window.location.href = `/admin-ticket.html?id=${t.id}`;
    };

    table.appendChild(row);
  });
}

/* =========================
   FILTERS
========================= */

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.onclick = () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTickets();
  };
});

/* =========================
   HELPERS
========================= */

function formatStatus(s) {
  if (s === "in_progress") return "In Progress";
  if (s === "resolved") return "Resolved";
  return "Open";
}