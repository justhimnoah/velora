import { supabase } from "../js/supabase.js";

/* =========================
   HELPERS
========================= */
function isReleased(game) {
  if (!game.releaseDate) return true;
  return new Date(game.releaseDate) <= new Date();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

/* =========================
   GET GAME
========================= */
const params = new URLSearchParams(window.location.search);
const gameId = params.get("id");
const page = document.getElementById("gamePage");

async function loadGame() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (error || !data) {
    page.innerHTML = "<p>Game not found.</p>";
    console.error(error);
    return;
  }

  const game = data;

  /* =========================
     PAGE HTML
  ========================= */
  page.innerHTML = `
    <a href="games.html" class="back-link">← Back to Games</a>
    <h1>${game.title}</h1>
    <p>${game.description}</p>
    ${
      !isReleased(game)
        ? `<p class="status-text">Coming ${formatDate(game.releaseDate)}</p>`
        : ""
    }
    <div class="media-slider">
      <div class="slides">
        ${(game.media || []).map((item, i) => `
          <div class="slide ${i === 0 ? "active" : ""}">
            ${
              item.type === "video"
                ? `<video src="${item.src}" controls></video>`
                : `<img src="${item.src}" alt="${game.title}">`
            }
          </div>
        `).join("")}
      </div>
      <button class="slider-btn prev">‹</button>
      <button class="slider-btn next">›</button>
    </div>
    <div class="game-price">₹${game.price}</div>
    <button class="btn add-to-cart" ${!isReleased(game) ? "disabled" : ""}>
      ${isReleased(game) ? "Add to Cart" : "Coming Soon"}
    </button>
  `;

  /* =========================
     SLIDER
  ========================= */
  const slides = document.querySelectorAll(".slide");
  let current = 0;
  function showSlide(i) {
    slides.forEach(s => s.classList.remove("active"));
    slides[i].classList.add("active");
  }
  document.querySelector(".next").onclick = () => {
    current = (current + 1) % slides.length;
    showSlide(current);
  };
  document.querySelector(".prev").onclick = () => {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
  };

  /* =========================
     ADD TO CART (Supabase)
  ========================= */
  const addBtn = document.querySelector(".add-to-cart");
  if (isReleased(game)) {
    addBtn.addEventListener("click", async () => {
      // Replace with your Supabase auth session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to add games to your cart.");
        return;
      }

      addBtn.disabled = true;
      addBtn.textContent = "Adding...";

      const { error: cartError } = await supabase
        .from("cart")
        .insert({
          user_id: user.id,
          game_id: game.id,
          title: game.title,
          price: game.price,
          cover: game.cover,
          added_at: new Date()
        });

      if (cartError) {
        console.error(cartError);
        addBtn.disabled = false;
        addBtn.textContent = "Add to Cart";
        alert(cartError.message);
      } else {
        addBtn.textContent = "Added to cart ✔";
      }
    });
  }
}

loadGame();
