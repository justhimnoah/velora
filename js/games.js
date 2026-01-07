const games = [
  {
    id: "orbit-racer",
    title: "Orbit Racer",
    description: "High-speed futuristic racing built for Orbit.",
    status: "Released",
    genres: ["Racing"],
    tags: ["Multiplayer"],
  }
];

const grid = document.getElementById("gamesGrid");
const searchInput = document.getElementById("searchInput");

const statusFilters = document.querySelectorAll(".filter-status");
const genreFilters = document.querySelectorAll(".filter-genre");

function renderGames(list) {
  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = "<p style='opacity:0.7'>No games found.</p>";
    return;
  }

  list.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.onclick = () => {
      window.location.href = `game-${game.id}.html`;
    };

    card.innerHTML = `
      <div class="game-image"></div>

      <span class="status-badge ${game.status === "Released" ? "released" : "coming"}">
        ${game.status}
      </span>

      <h3>${game.title}</h3>
      <p>${game.description}</p>

      <div class="game-tags">
        ${game.genres.map(g => `<span class="tag">${g}</span>`).join("")}
        ${game.tags.map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
    `;

    grid.appendChild(card);
  });
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();

  const activeStatus = [...statusFilters]
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  const activeGenres = [...genreFilters]
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  const filtered = games.filter(game => {
    const matchesSearch =
      game.title.toLowerCase().includes(search);

    const matchesStatus =
      activeStatus.length === 0 || activeStatus.includes(game.status);

    const matchesGenre =
      activeGenres.length === 0 ||
      game.genres.some(g => activeGenres.includes(g));

    return matchesSearch && matchesStatus && matchesGenre;
  });

  renderGames(filtered);
}

searchInput.addEventListener("input", applyFilters);
statusFilters.forEach(cb => cb.addEventListener("change", applyFilters));
genreFilters.forEach(cb => cb.addEventListener("change", applyFilters));

renderGames(games);
