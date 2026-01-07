import { auth } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const btn = document.getElementById("buildBtn");

onAuthStateChanged(auth, user => {
  if (!btn) return;

  if (user) {
    btn.textContent = "Open Configurator";
    btn.href = "configurator.html";
  } else {
    btn.textContent = "Sign in to build";
    btn.href = "login.html";
  }
});