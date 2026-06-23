import { supabase } from "./supabase.js";

let allTickets = [];
let currentFilter = "all";

/* =========================
   AUTH + ROLE CHECK
========================= */

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session?.user) {
    window.location.href = "index.html";
    return;
  }

  const { data: roleRow } = await supabase
    .from("roles")
    .select("role")
    .eq("uid", session.user.id)
    .maybeSingle();

  const role = roleRow?.role || null;

  if (!["admin", "support"].includes(role)) {
    window.location.href = "index.html";
    return;
  }

  loadTickets();
});

/* =========================
   LOAD TICKETS
========================= */

async function loadTickets() {
  const table = document.getElementById("ticketTable");

  const { data: tickets, error } = await supabase
    .from("supportTickets")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  allTickets = tickets || [];
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
      window.location.href = `admin-ticket.html?id=${t.id}`;
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