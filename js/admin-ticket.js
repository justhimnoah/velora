import { supabase } from "./supabase.js";

/* =========================
   HELPERS
========================= */
function formatDateTime(ts) {
  if (!ts) return "—";
  return ts.toDate().toLocaleString();
}

/* =========================
   DOM
========================= */
const ticketIdEl = document.getElementById("ticketId");
const ticketSubjectEl = document.getElementById("ticketSubject");
const ticketMetaEl = document.getElementById("ticketMeta");
const ticketStatusPill = document.getElementById("ticketStatus");

const statusSelect = document.getElementById("statusSelect");
const threadEl = document.getElementById("ticketThread");

const replyInput = document.getElementById("replyInput");
const sendReplyBtn = document.getElementById("sendReplyBtn");
const replyStatus = document.getElementById("replyStatus");

/* =========================
   STATE
========================= */
const ticketId = new URLSearchParams(location.search).get("id");
let ticketRef;
let messagesRef;

/* =========================
   AUTH
========================= */
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session?.user || !ticketId) {
    location.href = "index.html";
    return;
  }

  await loadTicket();
  listenToMessages();
});

/* =========================
   LOAD TICKET
========================= */
async function loadTicket() {
  const { data: t, error } = await supabase
    .from("supportTickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !t) {
    alert("Ticket not found");
    return;
  }

  ticketIdEl.textContent = `#${ticketId.slice(0, 6)}`;
  ticketSubjectEl.textContent = t.subject;
  ticketMetaEl.textContent =
    `From user: ${t.userId.slice(0, 8)}… • ${formatDateTime(t.createdAt)}`;

  setStatusUI(t.status);
  statusSelect.value = t.status;
}

/* =========================
   STATUS
========================= */
function setStatusUI(status) {
  ticketStatusPill.textContent =
    status === "in_progress" ? "In Progress" :
    status === "resolved" ? "Resolved" :
    "Open";

  ticketStatusPill.className = `order-status ${status}`;
}

statusSelect.onchange = async () => {
  const status = statusSelect.value;

  await supabase.from("supportTickets")
    .update({ status, updatedAt: new Date() })
    .eq("id", ticketId);

  setStatusUI(status);
};

/* =========================
   LIVE MESSAGES
========================= */
async function listenToMessages() {
  const { data: initialMessages } = await supabase
    .from("messages")
    .select("*")
    .eq("ticketId", ticketId)
    .order("createdAt", { ascending: true });

  renderMessages(initialMessages || []);

  supabase.channel('messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticketId=eq.${ticketId}` },
      payload => {
        renderMessages([...(initialMessages || []), payload.new]);
      }
    )
    .subscribe();
}

function renderMessages(messages) {
  threadEl.innerHTML = "";
  if (!messages.length) {
    threadEl.innerHTML = `<div class="hint">No messages yet.</div>`;
    return;
  }

  messages.forEach(m => {
    const div = document.createElement("div");
    div.className = `message ${m.sender}`;
    div.innerHTML = `
      <div>${m.text}</div>
      <div class="message-meta">
        ${m.sender === "admin" ? "Support" : "User"} •
        ${new Date(m.createdAt).toLocaleString()}
      </div>
    `;
    threadEl.appendChild(div);
  });

  threadEl.scrollTop = threadEl.scrollHeight;
}

/* =========================
   SEND REPLY
========================= */
sendReplyBtn.onclick = async () => {
  const text = replyInput.value.trim();
  if (!text) return;

  sendReplyBtn.disabled = true;
  replyStatus.textContent = "Sending…";

  await supabase.from("messages").insert({
    text,
    sender: "admin",
    ticketId,
    createdAt: new Date()
  });

  replyInput.value = "";
  replyStatus.textContent = "Sent";
  sendReplyBtn.disabled = false;

  setTimeout(() => (replyStatus.textContent = ""), 1500);
};