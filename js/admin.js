// admin.js

import { supabase } from "./supabase.js";

/* =========================
   ELEMENTS
========================= */
const adminNameEl = document.getElementById("adminName");
const openSupportBtn = document.getElementById("openSupportBtn");

/* =========================
   AUTH + ROLE GUARD
========================= */
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session?.user) {
    window.location.replace("index.html");
    return;
  }

  try {
    // ---------- ROLE CHECK ----------
    const { data: roleRow, error: roleError } = await supabase
      .from("roles")
      .select("role")
      .eq("uid", session.user.id)
      .maybeSingle();

    if (roleError || !roleRow) {
      window.location.replace("index.html");
      return;
    }

    const role = roleRow.role;

    // ❌ Not admin or supportStaff → kick
    if (role !== "admin" && role !== "supportStaff") {
      window.location.replace("index.html");
      return;
    }

    // ---------- UI PERMISSIONS ----------
    if (openSupportBtn) {
      openSupportBtn.style.display = "block";
    }

    if (role === "supportStaff") {
      document.querySelectorAll(".admin-only")
        .forEach(el => el.style.display = "none");
    }

    // ---------- LOAD USER INFO ----------
    const { data: userRow } = await supabase
      .from("users")
      .select("veloraId, displayName")
      .eq("uid", session.user.id)
      .maybeSingle();

    if (userRow) {
      adminNameEl.textContent =
        userRow.veloraId || userRow.displayName || "Admin";
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