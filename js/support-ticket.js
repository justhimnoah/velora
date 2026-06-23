import { supabase } from "./supabase.js";

/* =========================
   HELPERS
========================= */

const ticketId = new URLSearchParams(location.search).get("id");

function formatDateTime(ts) {
  if (!ts) return "—";
  return ts.toDate().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function applyResolvedState(status) {
  const input = document.getElementById("replyInput");
  const btn = document.getElementById("sendReplyBtn");

  if (status === "resolved") {
    input.readOnly = true;
    input.placeholder = "This ticket has been resolved.";
    btn.disabled = true;
  } else {
    input.readOnly = false;
    input.placeholder = "Type your reply…";
    btn.disabled = false;
  }
}

/* =========================
   INIT
========================= */

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session?.user || !ticketId) {
    location.href = "login.html";
    return;
  }

  listenToTicket(ticketId);
  listenToMessages(ticketId);

  document.getElementById("sendReplyBtn").onclick =
    () => sendReply(ticketId, session.user.id);
});

/* =========================
   LOAD TICKET
========================= */

async function listenToTicket(ticketId) {
  const { data: t, error } = await supabase
    .from("supportTickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !t) {
    alert("Ticket not found");
    return;
  }

  renderTicket(t);

  // Subscribe to realtime updates
  supabase.channel('ticket-updates')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'supportTickets', filter: `id=eq.${ticketId}` },
      payload => renderTicket(payload.new)
    )
    .subscribe();
}

function renderTicket(t) {
  document.getElementById("ticketId").textContent = `#${ticketId.slice(0, 6)}`;
  document.getElementById("ticketSubject").textContent = t.subject;
  document.getElementById("ticketMeta").textContent =
    `${t.category} • ${new Date(t.createdAt).toLocaleString()}`;

  const statusEl = document.getElementById("ticketStatus");
  statusEl.className = `order-status ${t.status}`;
  statusEl.textContent =
    t.status === "in_progress" ? "In Progress" :
    t.status === "resolved" ? "Resolved" : "Open";

  applyResolvedState(t.status);
}

/* =========================
   LIVE MESSAGES
========================= */

async function listenToMessages(ticketId) {
  const thread = document.getElementById("ticketThread");

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("ticketId", ticketId)
    .order("createdAt", { ascending: true });

  renderMessages(messages || []);

  supabase.channel('messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticketId=eq.${ticketId}` },
      payload => renderMessages([...(messages || []), payload.new])
    )
    .subscribe();
}

function renderMessages(messages) {
  const thread = document.getElementById("ticketThread");
  thread.innerHTML = "";

  if (!messages.length) {
    thread.innerHTML = `<div class="thread-empty">No replies yet.</div>`;
    return;
  }

  messages.forEach(m => {
    const div = document.createElement("div");
    div.className = `message ${m.sender}`;
    div.innerHTML = `
      <div>${m.text}</div>
      <div class="message-meta">
        ${m.sender === "admin" ? "Support" : "You"} •
        ${new Date(m.createdAt).toLocaleString()}
      </div>
    `;
    thread.appendChild(div);
  });

  thread.scrollTop = thread.scrollHeight;
}

/* =========================
   SEND REPLY
========================= */

async function sendReply(ticketId, userId) {
  const input = document.getElementById("replyInput");
  const text = input.value.trim();
  if (!text) return;

  await supabase.from("messages").insert({
    ticketId,
    text,
    sender: "user",
    createdAt: new Date()
  });

  input.value = "";
}