// js/auth.js
import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export let currentUser = null;

// Google login button (login.html)
const btn = document.getElementById("googleLoginBtn");

if (btn) {
  btn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "index.html";
    } catch (error) {
      console.error(error);
      alert("Google sign-in failed");
    }
  });
}

// GLOBAL AUTH STATE (IMPORTANT)
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("Logged in:", user.uid);
  } else {
    currentUser = null;
    console.log("Logged out");
  }
});
