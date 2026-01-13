// ================================
// ORBIT ACCOUNT PAGE (FIREBASE)
// MATCHES current account.html
// ================================

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { sendPasswordResetEmail } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ---------- DOM ---------- */

const avatarLetter = document.getElementById("avatarLetter");
const displayNameText = document.getElementById("displayNameText");
const orbitIdText = document.getElementById("orbitIdText");

const displayNameInput = document.getElementById("displayNameInput");
const emailText = document.getElementById("emailText");
const orbitIdText2 = document.getElementById("orbitIdText2");
const memberSince = document.getElementById("memberSince");
const securityEmail = document.getElementById("securityEmail");

const logoutBtn = document.getElementById("logoutBtn");
const saveBtn = document.querySelector(".account-card .btn");

/* ---------- TABS ---------- */

const tabs = document.querySelectorAll(".account-tab");
const sections = document.querySelectorAll(".account-section");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

/* ---------- LOAD ACCOUNT ---------- */

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.error("User document missing");
    return;
  }

  const data = snap.data();

  const displayName = data.displayName || "Orbit User";
  const orbitId = data.orbitId || "—";
  const email = user.email || "—";
  const created = data.createdAt
    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
    : "—";

  // Populate UI
  avatarLetter.textContent = displayName.charAt(0).toUpperCase();
  displayNameText.textContent = displayName;
  orbitIdText.textContent = orbitId;

  displayNameInput.value = displayName;
  emailText.textContent = email;
  orbitIdText2.textContent = orbitId;
  memberSince.textContent = created;
  securityEmail.textContent = email;
});

/* ---------- SAVE DISPLAY NAME ---------- */

saveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const value = displayNameInput.value.trim();
  if (!value) return;

  await updateDoc(doc(db, "users", user.uid), {
    displayName: value
  });

  displayNameText.textContent = value;
  avatarLetter.textContent = value.charAt(0).toUpperCase();
});

/* ---------- LOG OUT ---------- */

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* ---------- RESET/CHANGE PASSWORD ---------- */

const resetPasswordBtn = document.getElementById("resetPasswordBtn");

resetPasswordBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user || !user.email) return;

  await sendPasswordResetEmail(auth, user.email);
  alert("Password reset email sent. Check your inbox.");
});
