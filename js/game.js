import { games } from "../games/data.js";

/* ---------- GET GAME ID ---------- */
const params = new URLSearchParams(window.location.search);
const gameId = params.get("id");

/* ---------- FIND GAME ---------- */
const game = games.find(g => g.id === gameId);

if (!game) {
  document.body.innerHTML = "<h1 style='padding:40px'>Game not found</h1>";
  throw new Error("Game not found");
}

/* ---------- DOM ---------- */
document.getElementById("gameTitle").textContent = game.title;
document.getElementById("gameSubtitle").textContent = game.subtitle;
document.getElementById("gameDescription").textContent = game.description;
document.getElementById("gameStatus").textContent = game.status;
document.getElementById("gamePrice").textContent = game.price;

const tagsEl = document.getElementById("gameTags");
game.genres.forEach(tag => {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = tag;
  tagsEl.appendChild(span);
});

document.getElementById("gameImage").style.background = game.image;

/* ---------- BUTTON ---------- */
document.getElementById("playButton").addEventListener("click", () => {
  alert("Game launching is coming soon 🚀");
});
