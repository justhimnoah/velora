import { auth } from "./firebase.js";
import { db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const summary = document.getElementById("checkoutSummary");

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const snap = await getDocs(
    collection(db, "users", user.uid, "cart")
  );

  if (snap.empty) {
    summary.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;

  summary.innerHTML = snap.docs.map(doc => {
    const item = doc.data();
    total += item.price;

    return `
      <div class="checkout-item">
        <strong>Orbit Console</strong><br>
        Tier: ${item.tier}<br>
        Storage: ${item.storage}<br>
        <strong>$${item.price}</strong>
      </div>
    `;
  }).join("");

  summary.innerHTML += `
    <div class="checkout-total big">
      Total <span>$${total}</span>
    </div>
  `;
});
