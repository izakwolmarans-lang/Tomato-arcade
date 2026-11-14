(() => {
  const style = document.createElement('style');
  style.textContent = `
    .racer-art{background:linear-gradient(145deg,#d9f6f1,#91d9d3);display:grid;place-items:center;font-size:72px}
    .racer-art span:last-child{filter:drop-shadow(0 10px 0 #225a5530);transform:perspective(220px) rotateY(-15deg)}
    .racing-game{width:min(100%,700px);text-align:center}.racing-help{margin:0 auto 10px;color:#77716a;font-size:12px;line-height:1.55}.racing-hud{display:flex;justify-content:space-between;gap:8px;margin:9px 0;color:#514b43;font-size:12px;font-weight:800}.racing-canvas{display:block;width:100%;height:auto;border:4px solid #25283b;border-radius:13px;background:#a5d6ff;touch-action:none}.racing-message{min-height:20px;margin:8px 0;color:#81776d;font-size:12px}.racing-controls{display:flex;justify-content:center;gap:10px;margin-top:10px}.racing-controls button{min-width:70px;min-height:48px;padding:8px 14px;border:1px solid #e8e1d6;border-radius:12px;background:#f5f0e8;color:#39352f;font-weight:900;touch-action:none}.racing-controls button:active{background:#dff8ef;transform:translateY(2px)}.racing-start[hidden]{display:none}
    @media(max-width:540px){.racing-hud{font-size:10px}.racing-controls button{min-width:78px;min-height:54px}}
  `;
  document.head.append(style);

  const grid = document.querySelector('#game-grid');
  const dialog = document.querySelector('#game-dialog');
  const stage = document.querySelector('#game-stage');
  const heading = document.querySelector('#dialog-title');
  const search = document.querySelector('#game-search');
  const filters = [...document.querySelectorAll('.filter-chip')];
  const noResults = document.querySelector('#no-results');
  if (!grid || !dialog || !stage) return;

  const card = document.createElement('article');
  card.className = 'game-card';
  card.dataset.category = 'classic';
  card.dataset.name = 'tomato turbo 3d racing car road racer speed driving';
  card.innerHTML = '<div class="game-art racer-art"><span class="art-label">ARCADE RACER</span><span aria-hidden="true">🏎️</span></div><div class="game-info"><div><h3>Tomato Turbo</h3><p>Race the road, dodge traffic, grab coins!</p></div><span class="game-rating" aria-label="Racing">🏁</span></div><button class="play-button" type="button">Race now <span aria-hidden="true">→</span></button>';
  grid.append(card);
  const count = document.querySelector('[data-filter="all"] span');
  if (count) count.textContent = String(grid.querySelectorAll('.game-card').length);

  function updateVisibility() {
    const active = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';
    const query = search?.value.trim().toLowerCase() || '';
    const visible = (active === 'all' || active === card.dataset.category) && card.dataset.name.includes(query);
    card.hidden = !visible;
    if (noResults) noResults.hidden = [...grid.querySelectorAll('.game-card')].some((item) => !item.hidden);
  }
  search?.addEventListener('input', updateVisibility);
  filters.forEach((filter) => filter.addEventListener('click', updateVisibility));
  card.querySelector('button').addEventListener('click', openRacer);

  function openRacer() {
    heading.textContent = 'Tomato Turbo';
    stage.innerHTML = '<div class="racing-game"><p class="racing-help">A colorful, original arcade racer with a 3D-style road. Steer between lanes, avoid traffic, and collect coins. Desktop: ← / → or A / D. Tablet: use the buttons.</p><div class="racing-hud"><span>Distance: <b class="racing-distance">0</b> m</span><span>Coins: <b class="racing-coins">0</b></span><span>Best: <b class="racing-best">0</b> m</span></div><canvas class="racing-canvas" width="640" height="400" aria-label="Tomato Turbo racing game"></canvas><p class="racing-message" aria-live="polite">Ready to race?</p><button class="game-primary racing-start" type="button">Start race</button><div class="racing-controls" aria-label="Touch steering controls"><button type="button" data-steer="left" aria-label="Steer left">← Left</button><button type="button" data-steer="right" aria-label="Steer right">Right →</button></div></div>';
    if (!dialog.open) dialog.showModal();
    play(stage);
  }

  function play(root) {
    const canvas = root.querySelector('.racing-canvas');
    const ctx = canvas.getContext('2d');
    const distanceEl = root.querySelector('.racing-distance');
    const coinsEl = root.querySelector('.racing-coins');
    const bestEl = root.querySelector('.racing-best');
    const message = root.querySelector('.racing-message');
    const startButton = root.querySelector('.racing-start');
    const bestKey = 'tomato-turbo-best-distance';
    let best = 0;
    try { best = Number(localStorage.getItem(bestKey)) || 0; } catch (_) { /* storage not required */ }
    bestEl.textContent = String(best);

    const lanes = [210, 320, 430];
    let running = false, lane = 1, distance = 0, coins = 0, speed = 230, elapsed = 0, last = 0, spawn = 0, raf = 0;
    let traffic = [], pickups = [];
    const keys = new Set();

    function polygon(points, color) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); ctx.fill();
    }
    function drawCar(x, y, color, size = 1, player = false) {
      const w = 36 * size, h = 60 * size;
      ctx.fillStyle = '#171a2c66'; ctx.beginPath(); ctx.ellipse(x, y + h * .42, w * .72, h * .18, 0, 0, Math.PI * 2); ctx.fill();
      polygon([[x - w * .5, y - h * .42], [x + w * .5, y - h * .42], [x + w * .72, y + h * .34], [x - w * .72, y + h * .34]], color);
      polygon([[x - w * .34, y - h * .1], [x + w * .34, y - h * .1], [x + w * .44, y + h * .13], [x - w * .44, y + h * .13]], '#bce9f4');
      ctx.fillStyle = player ? '#fff1aa' : '#ff7777';
      ctx.fillRect(x - w * .43, y + h * .22, w * .2, h * .08); ctx.fillRect(x + w * .23, y + h * .22, w * .2, h * .08);
      ctx.fillStyle = '#202235'; ctx.fillRect(x - w * .68, y - h * .05, w * .18, h * .25); ctx.fillRect(x + w * .5, y - h * .05, w * .18, h * .25);
    }
    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, 250); sky.addColorStop(0, '#85d6ff'); sky.addColorStop(1, '#e8f7ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 640, 400);
      ctx.fillStyle = '#ffe388'; ctx.beginPath(); ctx.arc(510, 62, 28, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 10; i++) { const x = (i * 75 - (distance * .28 % 75)); const h = 55 + (i * 41 % 95); ctx.fillStyle = i % 2 ? '#8297ad' : '#9aabc0'; ctx.fillRect(x, 210 - h, 48, h); }
      polygon([[226, 190], [414, 190], [620, 400], [20, 400]], '#32364b');
      polygon([[210, 190], [226, 190], [20, 400], [0, 400]], '#58a76a');
      polygon([[414, 190], [430, 190], [640, 400], [620, 400]], '#58a76a');
      // Perspective lane markers scroll toward the player.
      for (let i = 0; i < 7; i++) {
        const t = ((i / 7 + (distance / 115) % 1) % 1);
        const y = 190 + t * t * 210; const half = 94 + t * 206; const markerH = 3 + t * 13;
        ctx.fillStyle = '#fff8d8'; ctx.fillRect(320 - half / 3, y, 4 + t * 4, markerH); ctx.fillRect(320 + half / 3, y, 4 + t * 4, markerH);
      }
      pickups.forEach((item) => { ctx.font = `${Math.round(17 + item.depth * 22)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🪙', lanes[item.lane], item.y); });
      traffic.forEach((car) => drawCar(lanes[car.lane], car.y, car.color, .35 + car.depth * .75));
      drawCar(lanes[lane], 330, '#ef5945', 1.08, true);
      if (!running) { ctx.fillStyle = '#1a1b2b35'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }
    function spawnTraffic() {
      const laneIndex = Math.floor(Math.random() * 3);
      traffic.push({ lane: laneIndex, y: 194, depth: 0, color: ['#ffb347', '#79d4bb', '#a28bff', '#ec779d'][Math.floor(Math.random() * 4)] });
      if (Math.random() < .72) pickups.push({ lane: Math.floor(Math.random() * 3), y: 195, depth: 0 });
    }
    function moveLane(change) { lane = Math.max(0, Math.min(2, lane + change)); }
    function finish() {
      if (!running) return;
      running = false; cancelAnimationFrame(raf);
      const finalDistance = Math.floor(distance);
      message.textContent = `Bump! You drove ${finalDistance} m and collected ${coins} coins.`;
      startButton.textContent = 'Race again'; startButton.hidden = false;
      if (finalDistance > best) { best = finalDistance; bestEl.textContent = String(best); try { localStorage.setItem(bestKey, String(best)); } catch (_) { /* optional */ } }
      window.dispatchEvent(new CustomEvent('tomato:score', { detail: { game: 'Tomato Turbo', score: finalDistance + coins * 25 } }));
      draw();
    }
    function update(dt) {
      elapsed += dt; distance += speed * dt / 12; speed = Math.min(430, 230 + elapsed * 8); spawn += dt;
      if (spawn > Math.max(.62, 1.15 - elapsed * .008)) { spawn = 0; spawnTraffic(); }
      traffic.forEach((car) => { car.depth += dt * (0.32 + speed / 850); car.y = 190 + car.depth * car.depth * 210; });
      pickups.forEach((item) => { item.depth += dt * (0.32 + speed / 850); item.y = 190 + item.depth * item.depth * 210; });
      if (traffic.some((car) => car.lane === lane && car.depth > .78 && car.depth < .98)) { finish(); return; }
      const collected = pickups.filter((item) => item.lane === lane && item.depth > .80 && item.depth < 1.04);
      if (collected.length) { coins += collected.length; coinsEl.textContent = String(coins); }
      traffic = traffic.filter((car) => car.depth < 1.15); pickups = pickups.filter((item) => item.depth < .98 && !(item.lane === lane && item.depth > .80));
      distanceEl.textContent = String(Math.floor(distance));
      draw();
    }
    function frame(now) { if (!running) return; const dt = Math.min((now - (last || now)) / 1000, .05); last = now; update(dt); if (running) raf = requestAnimationFrame(frame); }
    function start() { cancelAnimationFrame(raf); lane = 1; distance = 0; coins = 0; speed = 230; elapsed = 0; spawn = 0; traffic = []; pickups = []; running = true; last = 0; distanceEl.textContent = '0'; coinsEl.textContent = '0'; message.textContent = 'Go! Dodge traffic and grab coins!'; startButton.hidden = true; raf = requestAnimationFrame(frame); }
    function keydown(event) { if (!dialog.open) return; const key = event.key.toLowerCase(); if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) event.preventDefault(); if ((key === 'arrowleft' || key === 'a') && !keys.has('left')) moveLane(-1); if ((key === 'arrowright' || key === 'd') && !keys.has('right')) moveLane(1); if (key === 'arrowleft' || key === 'a') keys.add('left'); if (key === 'arrowright' || key === 'd') keys.add('right'); }
    function keyup(event) { const key = event.key.toLowerCase(); if (key === 'arrowleft' || key === 'a') keys.delete('left'); if (key === 'arrowright' || key === 'd') keys.delete('right'); }
    const onVisibility = () => { if (document.hidden && running) { running = false; cancelAnimationFrame(raf); message.textContent = 'Race paused while this tab is hidden. Press Start to race again.'; startButton.textContent = 'Resume / restart'; startButton.hidden = false; } };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); document.addEventListener('visibilitychange', onVisibility);
    root.querySelectorAll('[data-steer]').forEach((button) => button.addEventListener('click', () => moveLane(button.dataset.steer === 'left' ? -1 : 1)));
    startButton.addEventListener('click', start); draw();
    const closeButton = document.querySelector('#close-game');
    const cleanup = () => { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); document.removeEventListener('visibilitychange', onVisibility); };
    closeButton.addEventListener('click', cleanup, { once: true });
    dialog.addEventListener('close', cleanup, { once: true });
  }
})();
