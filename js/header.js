import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const navLinks = document.getElementById("navLinks");

function link(href, text, id) {
  return `<a href="${href}" ${id ? `id="${id}"` : ""}>${text}</a>`;
}

onAuthStateChanged(auth, user => {
  if (!navLinks) return;

  navLinks.innerHTML = "";

  // ✅ HOME — ALWAYS PRESENT
  navLinks.insertAdjacentHTML("beforeend", link("index.html", "Home"));

  if (user) {
    // Logged IN
    navLinks.insertAdjacentHTML("beforeend", link("configurator.html", "Configurator"));
    navLinks.insertAdjacentHTML("beforeend", link("cart.html", "Cart"));
    navLinks.insertAdjacentHTML("beforeend", link("games.html", "Games"));
    navLinks.insertAdjacentHTML("beforeend", link("account.html", "My Account"));
    navLinks.insertAdjacentHTML(
      "beforeend",
      `<a href="#" id="logoutBtn">Logout</a>`
    );

    document.getElementById("logoutBtn")?.addEventListener("click", e => {
      e.preventDefault();
      signOut(auth).then(() => {
        window.location.href = "index.html";
      });
    });

  } else {
    // Logged OUT
    navLinks.insertAdjacentHTML("beforeend", link("games.html", "Games"));
    navLinks.insertAdjacentHTML("beforeend", link("login.html", "Login"));
  }
});
