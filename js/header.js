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
