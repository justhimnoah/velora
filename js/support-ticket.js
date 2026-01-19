import { auth, db } from "js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  collection,
  query,
  orderBy,
  addDoc,
  onSnapshot,  
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

onAuthStateChanged(auth, async user => {
  if (!user || !ticketId) {
    location.href = "login.html";
    return;
  }

  listenToTicket(ticketId);
  listenToMessages(ticketId);

  document.getElementById("sendReplyBtn").onclick =
    () => sendReply(ticketId);
});

/* =========================
   LOAD TICKET
========================= */

function listenToTicket(ticketId) {
  const ref = doc(db, "supportTickets", ticketId);

  onSnapshot(ref, snap => {
    if (!snap.exists()) {
      alert("Ticket not found");
      return;
    }

    const t = snap.data();

    document.getElementById("ticketId").textContent =
      `#${ticketId.slice(0, 6)}`;
    document.getElementById("ticketSubject").textContent = t.subject;
    document.getElementById("ticketMeta").textContent =
      `${t.category} • ${formatDateTime(t.createdAt)}`;

    const statusEl = document.getElementById("ticketStatus");
    statusEl.className = `order-status ${t.status}`;
    statusEl.textContent =
      t.status === "in_progress" ? "In Progress" :
      t.status === "resolved" ? "Resolved" : "Open";

    // 🔒 lock / unlock reply UI
    applyResolvedState(t.status);
  });
}

/* =========================
   LIVE MESSAGES
========================= */

function listenToMessages(ticketId) {
  const thread = document.getElementById("ticketThread");

  const q = query(
    collection(db, "supportTickets", ticketId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snap => {
    thread.innerHTML = "";

    if (snap.empty) {
      thread.innerHTML = `<div class="thread-empty">No replies yet.</div>`;
      return;
    }

    snap.forEach(d => {
      const m = d.data();

      const div = document.createElement("div");
      div.className = `message ${m.sender}`;

      div.innerHTML = `
        <div>${m.text}</div>
        <div class="message-meta">
          ${m.sender === "admin" ? "Support" : "You"} •
          ${formatDateTime(m.createdAt)}
        </div>
      `;

      thread.appendChild(div);
    });

    thread.scrollTop = thread.scrollHeight;
  });
}

/* =========================
   SEND REPLY
========================= */

async function sendReply(ticketId) {
  const input = document.getElementById("replyInput");
  const text = input.value.trim();
  if (!text) return;

  await addDoc(
    collection(db, "supportTickets", ticketId, "messages"),
    {
      text,
      sender: "user",
      createdAt: serverTimestamp()
    }
  );

  input.value = "";
}