import { supabase } from "./supabase.js";

const btn = document.getElementById("buildBtn");

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!btn) return;

  if (session?.user) {
    btn.textContent = "Open Configurator";
    btn.href = "configurator.html";
  } else {
    btn.textContent = "Sign in to build";
    btn.href = "login.html";
  }
}

// Run once on page load
checkSession();

// Subscribe to changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (!btn) return;

  if (session?.user) {
    btn.textContent = "Open Configurator";
    btn.href = "configurator.html";
  } else {
    btn.textContent = "Sign in to build";
    btn.href = "login.html";
  }
});
