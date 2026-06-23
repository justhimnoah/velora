import { supabase } from "./supabase.js";

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
      await supabase
        .from("cart")
        .delete()
        .eq("id", btn.dataset.id)
        .eq("user_id", uid);
      location.reload();
    };
  });
}

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session?.user) {
    window.location.replace("login.html");
    return;
  }

  const { data: items, error } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", session.user.id);

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Failed to load cart.</p>";
    return;
  }

  renderCart(items || [], session.user.id);
});