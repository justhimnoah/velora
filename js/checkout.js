import { supabase } from "./supabase.js";

const summary = document.getElementById("checkoutSummary");

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
    summary.innerHTML = "<p>Failed to load cart.</p>";
    return;
  }

  if (!items || items.length === 0) {
    summary.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;

  summary.innerHTML = items.map(item => {
    total += item.price;

    return `
      <div class="checkout-item">
        <strong>${item.type === "game" ? item.title : "Velora Console"}</strong><br>
        ${item.type === "console" ? `
          Tier: ${item.tier}<br>
          Storage: ${item.storage}<br>
        ` : ""}
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