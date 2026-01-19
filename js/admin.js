// admin.js

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   ELEMENTS
========================= */

const adminNameEl = document.getElementById("adminName");
const openSupportBtn = document.getElementById("openSupportBtn");

/* =========================
   AUTH + ROLE GUARD
========================= */

onAuthStateChanged(auth, async (user) => {
  // ❌ Not logged in → kick immediately
  if (!user) {
    window.location.replace("index.html");
    return;
  }

  try {
    /* ---------- ROLE CHECK ---------- */
    const roleRef = doc(db, "roles", user.uid);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      window.location.replace("index.html");
      return;
    }

    const role = roleSnap.data().role;

    if (role !== "admin" && role !== "support") {
      window.location.replace("index.html");
      return;
    }

    /* ---------- LOAD USER INFO ---------- */
    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (userSnap.exists()) {
      const data = userSnap.data();
      adminNameEl.textContent =
        data.orbitId || data.displayName || "Admin";
    } else {
      adminNameEl.textContent = "Admin";
    }

    console.log("✅ Admin access granted:", role);

  } catch (err) {
    console.error("Admin auth error:", err);
    window.location.replace("index.html");
  }
});

/* =========================
   SUPPORT SYSTEM
========================= */

openSupportBtn?.addEventListener("click", () => {
  window.location.href = "admin/admin-support.html";
});
