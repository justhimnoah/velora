import { auth } from "./firebase.js";
import { db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("cartContainer");

function renderCart(items, uid) {
  if (items.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;

  container.innerHTML = `
    <div class="cart-items">
      ${items.map(item => {
        total += item.price;

        if (item.type === "game") {
          return `
            <div class="cart-card">
              <h3>${item.title}</h3>
              <p class="price">$${item.price}</p>

              <button
                class="btn danger"
                data-id="${item.id}">
                Remove
              </button>
            </div>
          `;
        }

        // DEFAULT: CONSOLE ITEM (your existing code)
        return `
          <div class="cart-card">
            <h3>Velora Console</h3>

            <p><strong>Tier:</strong> ${item.tier}</p>
            <p><strong>Storage:</strong> ${item.storage}</p>

            <h4>Controller</h4>
            <ul>
              ${Object.values(item.controller)
                .filter(Boolean)
                .map(v => `<li>${v}</li>`)
                .join("")}
            </ul>

            <p><strong>Weight:</strong> ${item.stats.weight}g</p>
            <p><strong>Battery:</strong> ${item.stats.batteryLife} hrs</p>

            <p class="price">$${item.price}</p>

            <button
              class="btn danger"
              data-id="${item.id}">
              Remove from cart
            </button>
          </div>
        `;
      }).join("")}
    </div>

    <div class="cart-footer">
      <h2>Total: $${total}</h2>
      <a href="checkout.html" class="btn">Proceed to Payment</a>
    </div>
  `;

  document.querySelectorAll(".danger").forEach(btn => {
    btn.onclick = async () => {
      await deleteDoc(
        doc(db, "users", uid, "cart", btn.dataset.id)
      );
      location.reload();
    };
  });
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const snap = await getDocs(
    collection(db, "users", user.uid, "cart")
  );

  const items = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  renderCart(items, user.uid);
});