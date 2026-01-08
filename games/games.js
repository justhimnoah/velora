import { games } from "./games-data.js";

const grid = document.getElementById("gamesGrid");
const searchInput = document.getElementById("searchInput");

/* =========================
   RENDER
========================= */

function renderGames(list) {
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<p style="opacity:.7">No games found.</p>`;
    return;
  }

  list.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    card.onclick = () => {
      window.location.href = `game.html?id=${game.id}`;
    };

    let badgeHTML = "";

    if (game.status === "Coming Soon") {
      badgeHTML = `<div class="status-badge coming">Coming Soon</div>`;
    }

    if (game.status === "Released") {
      badgeHTML = `<div class="status-badge released">Released</div>`;
    }

    card.innerHTML = `
      ${badgeHTML}

      <div
        class="game-image"
        style="background:url('${game.cover}') center/cover"
      ></div>

      <div class="game-content">
        <h3>${game.title}</h3>
        <p class="game-desc">${game.description}</p>
        <p class="game-price">${game.price}</p>

        <div class="game-tags">
          ${(game.tags || []).map(tag =>
            `<span class="tag">${tag}</span>`
          ).join("")}
        </div>
      </div>
    `;

        grid.appendChild(card);
      });
    }

/* =========================
   SEARCH ONLY
========================= */

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();

  renderGames(
    games.filter(game =>
      game.title.toLowerCase().includes(value)
    )
  );
});

/* =========================
   INIT
========================= */

renderGames(games);
