import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const navLinks = document.getElementById("navLinks");

// 🔑 Base path resolver (local + GitHub Pages safe)
const BASE_PATH = location.hostname.includes("github.io")
  ? "/console-website" // ⬅️ CHANGE to your repo name
  : "";

function link(path, text, id) {
  return `<a href="${BASE_PATH}${path}" ${id ? `id="${id}"` : ""}>${text}</a>`;
}

onAuthStateChanged(auth, user => {
  if (!navLinks) return;

  navLinks.innerHTML = "";

  // ✅ HOME — ALWAYS PRESENT
  navLinks.insertAdjacentHTML("beforeend", link("/", "Home"));

  if (user) {
    // Logged IN
    navLinks.insertAdjacentHTML("beforeend", link("/configurator.html", "Configurator"));
    navLinks.insertAdjacentHTML("beforeend", link("games/games.html", "Games"));
    navLinks.insertAdjacentHTML("beforeend", link("/cart.html", "Cart"));
    navLinks.insertAdjacentHTML("beforeend", link("/account.html", "My Account"));
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
    // Logged OUT
    navLinks.insertAdjacentHTML("beforeend", link("games/games.html", "Games"));
    navLinks.insertAdjacentHTML("beforeend", link("/login.html", "Login"));
  }
});
