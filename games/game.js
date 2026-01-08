import { games } from "./games-data.js";
import { auth, db } from "../js/firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


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

const game = games.find(g => g.id === gameId);
const page = document.getElementById("gamePage");

if (!game) {
  page.innerHTML = "<p>Game not found.</p>";
  throw new Error("Game not found");
}

/* =========================
   PAGE HTML
========================= */

page.innerHTML = `
  <a href="games.html" class="back-link">← Back to Games</a>

  <h1>${game.title}</h1>
  <p>${game.description}</p>

  ${
    !isReleased(game)
      ? `<p class="status-text">
          Coming ${formatDate(game.releaseDate)}
        </p>`
      : ""
  }

  <div class="media-slider">
    <div class="slides">
      ${game.media.map((item, i) => `
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
   ADD TO CART (CORRECT PATH)
========================= */

const addBtn = document.querySelector(".add-to-cart");

async function syncCartButton() {
  const user = auth.currentUser;
  if (!user) return;

  const itemRef = doc(
    db,
    "users",
    user.uid,
    "cart",
    game.id
  );

  const snap = await getDoc(itemRef);

  if (snap.exists()) {
    addBtn.textContent = "Added to cart ✔";
    addBtn.disabled = true;
  }
}

// 🔹 Run once on page load (after auth)
onAuthStateChanged(auth, user => {
  if (user && isReleased(game)) {
    syncCartButton();
  }
});

if (isReleased(game)) {
  addBtn.addEventListener("click", async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please log in to add games to your cart.");
      return;
    }

    addBtn.disabled = true;
    addBtn.textContent = "Adding...";

    try {
      const itemRef = doc(
        db,
        "users",
        user.uid,
        "cart",
        game.id
      );

      await setDoc(itemRef, {
        type: "game",
        gameId: game.id,
        title: game.title,
        price: game.price,
        cover: game.cover,
        addedAt: serverTimestamp()
      });

      addBtn.textContent = "Added to cart ✔";
    } catch (err) {
      console.error(err);
      addBtn.disabled = false;
      addBtn.textContent = "Add to Cart";
      alert(err.message);
    }
  });
}