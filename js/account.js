import { auth, db } from "./firebase.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);

  onSnapshot(ref, snap => {
    if (!snap.exists()) return;
    renderBuilds(snap.data().builds || []);
  });
});

function renderBuilds(builds) {
  const box = document.getElementById("buildsBox");
  if (!box) return;

  if (!builds.length) {
    box.innerHTML = "<p>No saved builds yet.</p>";
    return;
  }

  box.innerHTML = builds.map((build, index) => `
    <div class="option-card" style="margin-bottom:32px;">
      <h3>Saved Build ${index + 1}</h3>
      <ul style="margin-top:16px;">
        ${Object.entries(build.selections)
          .map(([k, v]) => `<li>${k}: ${v}</li>`)
          .join("")}
      </ul>
      <p style="margin-top:16px;"><strong>₹${build.total}</strong></p>
      <button onclick="reconfigure(${index})">Reconfigure</button>
    </div>
  `).join("");
}

window.reconfigure = function (index) {
  localStorage.setItem("orbitReconfigureIndex", index);
  window.location.href = "configurator.html";
};
