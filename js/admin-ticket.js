import { auth, db } from "/js/firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
onAuthStateChanged(auth, async user => {
  if (!user || !ticketId) {
    location.href = "index.html";
    return;
  }

  ticketRef = doc(db, "supportTickets", ticketId);
  messagesRef = collection(ticketRef, "messages");

  await loadTicket();
  listenToMessages();
});

/* =========================
   LOAD TICKET
========================= */
async function loadTicket() {
  const snap = await getDoc(ticketRef);

  if (!snap.exists()) {
    alert("Ticket not found");
    return;
  }

  const t = snap.data();

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

  await updateDoc(ticketRef, {
    status,
    updatedAt: serverTimestamp()
  });

  setStatusUI(status);
};

/* =========================
   LIVE MESSAGES
========================= */
function listenToMessages() {
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  onSnapshot(q, snap => {
    threadEl.innerHTML = "";

    if (snap.empty) {
      threadEl.innerHTML = `<div class="hint">No messages yet.</div>`;
      return;
    }

    snap.forEach(d => {
      const m = d.data();

      const div = document.createElement("div");
      div.className = `message ${m.sender}`;

      div.innerHTML = `
        <div>${m.text}</div>
        <div class="message-meta">
          ${m.sender === "admin" ? "Support" : "User"} •
          ${formatDateTime(m.createdAt)}
        </div>
      `;

      threadEl.appendChild(div);
    });

    threadEl.scrollTop = threadEl.scrollHeight;
  });
}

/* =========================
   SEND REPLY
========================= */
sendReplyBtn.onclick = async () => {
  const text = replyInput.value.trim();
  if (!text) return;

  sendReplyBtn.disabled = true;
  replyStatus.textContent = "Sending…";

  await addDoc(messagesRef, {
    text,
    sender: "admin",
    createdAt: serverTimestamp()
  });

  replyInput.value = "";
  replyStatus.textContent = "Sent";
  sendReplyBtn.disabled = false;

  setTimeout(() => (replyStatus.textContent = ""), 1500);
};