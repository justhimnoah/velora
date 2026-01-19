import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const navLinks = document.getElementById("navLinks");

// 🔑 Base path resolver (local + GitHub Pages safe)
const BASE_PATH = location.hostname.includes("github.io")
  ? "/orbit"
  : "";

function link(path, text, id) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `<a href="${BASE_PATH}${normalizedPath}" ${id ? `id="${id}"` : ""}>${text}</a>`;
}

onAuthStateChanged(auth, user => {
  if (!navLinks) return;

  navLinks.innerHTML = "";

  // HOME
  navLinks.insertAdjacentHTML("beforeend", link("/", "Home"));

  if (user) {
    navLinks.insertAdjacentHTML("beforeend", link("/configurator.html", "Configurator"));
    navLinks.insertAdjacentHTML("beforeend", link("/games.html", "Games"));
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
    navLinks.insertAdjacentHTML("beforeend", link("/games.html", "Games"));
    navLinks.insertAdjacentHTML("beforeend", link("/login.html", "Login"));
  }
});