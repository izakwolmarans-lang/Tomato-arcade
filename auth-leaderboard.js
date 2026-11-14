(() => {
  const accountDialog = document.querySelector('#account-dialog');
  const accountForm = document.querySelector('#account-form');
  const nameInput = document.querySelector('#player-name');
  const accountMessage = document.querySelector('#account-message');
  const accountSubmit = document.querySelector('#account-submit');
  const accountMode = document.querySelector('#account-mode');
  const signOut = document.querySelector('#account-signout');
  const accountOpen = document.querySelector('.account-open');
  const rows = document.querySelector('#leaderboard-rows');
  const scoreKey = 'tomato-arcade-leaderboard-v1';
  const profileKey = 'tomato-arcade-local-profile-v1';
  let isSignIn = false;

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
  }
  function getProfile() { return read(profileKey, null); }

  function updateAccountButton() {
    const profile = getProfile();
    accountOpen.innerHTML = profile ? `${escapeHtml(profile.name)} <span aria-hidden="true">⌄</span>` : 'Sign in <span aria-hidden="true">↗</span>';
    signOut.hidden = !profile;
    accountSubmit.hidden = Boolean(profile);
    accountMode.hidden = Boolean(profile);
    nameInput.disabled = Boolean(profile);
    nameInput.value = profile?.name || '';
    accountMessage.textContent = profile ? `Signed in locally as ${profile.name}.` : '';
  }
  function escapeHtml(text) {
    const span = document.createElement('span'); span.textContent = text; return span.innerHTML;
  }
  function renderScores() {
    const scores = read(scoreKey, []).sort((a, b) => b.score - a.score).slice(0, 10);
    rows.replaceChildren();
    if (!scores.length) {
      const tr = document.createElement('tr'); const td = document.createElement('td');
      td.colSpan = 4; td.className = 'leaderboard-empty'; td.textContent = 'Play a game to add the first score!'; tr.append(td); rows.append(tr); return;
    }
    scores.forEach((entry, index) => {
      const tr = document.createElement('tr');
      [index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : String(index + 1), entry.player, entry.game, String(entry.score)].forEach((value, cellIndex) => {
        const td = document.createElement('td'); td.textContent = value; if (cellIndex === 3) td.className = 'score-cell'; tr.append(td);
      });
      rows.append(tr);
    });
  }
  function addScore({ game, score }) {
    const value = Number(score);
    if (!Number.isFinite(value) || value < 0 || !game) return;
    const profile = getProfile();
    const scores = read(scoreKey, []);
    scores.push({ player: profile?.name || 'Guest', game: String(game).slice(0, 32), score: Math.floor(value), date: Date.now() });
    write(scoreKey, scores.sort((a, b) => b.score - a.score).slice(0, 50));
    renderScores();
  }

  accountOpen.addEventListener('click', () => { updateAccountButton(); accountDialog.showModal(); });
  document.querySelector('.account-close').addEventListener('click', () => accountDialog.close());
  accountDialog.addEventListener('click', (event) => { if (event.target === accountDialog) accountDialog.close(); });
  accountMode.addEventListener('click', () => {
    isSignIn = !isSignIn;
    document.querySelector('#account-title').textContent = isSignIn ? 'Welcome back!' : 'Create your profile';
    accountSubmit.textContent = isSignIn ? 'Sign in on this browser' : 'Create local profile';
    accountMode.textContent = isSignIn ? 'New here? Create a profile' : 'Already have a profile? Sign in';
    accountMessage.textContent = isSignIn ? 'Enter the player name you saved on this browser.' : '';
  });
  accountForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    if (name.length < 2) { accountMessage.textContent = 'Choose a name with at least 2 characters.'; return; }
    const saved = read(profileKey, null);
    if (isSignIn && (!saved || saved.name.toLowerCase() !== name.toLowerCase())) {
      accountMessage.textContent = 'That player name is not saved in this browser. Create a profile first.'; return;
    }
    if (!isSignIn && saved && saved.name.toLowerCase() !== name.toLowerCase()) {
      accountMessage.textContent = 'A profile already exists here. Sign out first to create another.'; return;
    }
    if (!write(profileKey, { name })) { accountMessage.textContent = 'Could not save your profile. Check browser storage settings.'; return; }
    updateAccountButton(); renderScores();
  });
  signOut.addEventListener('click', () => {
    try { localStorage.removeItem(profileKey); } catch (_) { /* storage may be disabled */ }
    isSignIn = false; updateAccountButton(); renderScores();
  });
  document.querySelector('#clear-scores').addEventListener('click', () => {
    try { localStorage.removeItem(scoreKey); } catch (_) { /* storage may be disabled */ }
    renderScores();
  });
  window.addEventListener('tomato:score', (event) => addScore(event.detail || {}));
  updateAccountButton();
  renderScores();
})();
