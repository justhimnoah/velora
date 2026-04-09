import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const navLinks = document.getElementById("navLinks");
const logoLink = document.getElementById("logoLink");
const logoImg = document.getElementById("logoImg");

// 🔑 Base path resolver (local + GitHub Pages safe)
const BASE_PATH = location.hostname.includes("github.io")
  ? "/velora"
  : "";

/* =========================
   LOGO SETUP
========================= */
if (logoImg) {
  logoImg.src = `${BASE_PATH}/assets/velora.png`;
}

if (logoLink) {
  logoLink.href = `${BASE_PATH}/`;
}

// =========================
// MOBILE BLOCK (GLOBAL)
// =========================
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

if (isMobile()) {
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top, #0b1c3f, #020615);
      color: white;
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div style="
        max-width: 420px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 20px;
        padding: 40px;
        backdrop-filter: blur(16px);
        box-shadow: 0 30px 80px rgba(0,0,0,0.6);
      ">
        <h1 style="font-size: 28px; margin-bottom: 14px;">
          Desktop Required
        </h1>
        <p style="opacity: 0.75; margin-bottom: 24px;">
          Continue on a desktop device to access Velora.
        </p>
        <div style="
          font-size: 14px;
          opacity: 0.5;
        ">
          Mobile support coming soon.
        </div>
      </div>
    </div>
  `;
}

if (isMobile()) throw new Error("Mobile blocked");

/**
 * Normalizes paths so:
 * "./games/games.html"  -> /games/games.html
 * "/games/games.html"   -> /games/games.html
 * "games/games.html"    -> /games/games.html
 *
 * Final output:
 *  - Local: /games/games.html
 *  - GitHub: /velora/games/games.html
 */
function link(path, text, id) {
  let cleanPath = path;

  if (cleanPath.startsWith("./")) {
    cleanPath = cleanPath.slice(1);
  }

  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  return `<a href="${BASE_PATH}${cleanPath}" ${id ? `id="${id}"` : ""}>${text}</a>`;
}

/* =========================
   NAV LOGIC
========================= */
onAuthStateChanged(auth, user => {
  if (!navLinks) return;

  navLinks.innerHTML = "";

  // HOME
  navLinks.insertAdjacentHTML("beforeend", link("/", "Home"));

  if (user) {
    // LOGGED IN
    navLinks.insertAdjacentHTML("beforeend", link("./configurator.html", "Configurator"));
    navLinks.insertAdjacentHTML("beforeend", link("./games/games.html", "Games"));
    navLinks.insertAdjacentHTML("beforeend", link("./cart.html", "Cart"));
    navLinks.insertAdjacentHTML("beforeend", link("./account.html", "My Account"));
    navLinks.insertAdjacentHTML(
      "beforeend",
      `<a href="#" id="logoutBtn">Logout</a>`
    );

    document.getElementById("logoutBtn")?.addEventListener("click", e => {
      e.preventDefault();
      signOut(auth).then(() => {
        window.location.href = `${BASE_PATH}/`;
      });
    });

  } else {
    // LOGGED OUT
    navLinks.insertAdjacentHTML("beforeend", link("./games/games.html", "Games"));
    navLinks.insertAdjacentHTML("beforeend", link("./login.html", "Login"));
  }
});
