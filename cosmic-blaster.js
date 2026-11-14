/* Cosmic Blaster: a colorful, fictional pseudo-3D target game. */
(() => {
  const dialog = document.querySelector('#game-dialog');
  const stage = document.querySelector('#game-stage');
  const heading = document.querySelector('#dialog-title');
  const grid = document.querySelector('#game-grid');
  const search = document.querySelector('#game-search');
  const empty = document.querySelector('#no-results');
  if (!dialog || !stage || !grid || !heading) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL('cosmic-blaster.css', document.currentScript.src).href; document.head.append(css);

  const card = document.createElement('article');
  card.className = 'game-card'; card.dataset.category = 'quick';
  card.dataset.name = 'cosmic blaster 3d target shooter alien arcade';
  card.innerHTML = '<div class="game-art cosmic-card-art"><span class="art-label">3D ARCADE</span><span aria-hidden="true">👾✨</span></div><div class="game-info"><div><h3>Cosmic Blaster</h3><p>Pop cartoon space targets!</p></div><span class="game-rating" aria-label="Arcade action">🚀</span></div><button class="play-button" type="button">Play now <span aria-hidden="true">→</span></button>';
  grid.append(card);

  function filterCard() {
    const query = search?.value.trim().toLowerCase() || '';
    const filter = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';
    card.hidden = !(card.dataset.name.includes(query) && (filter === 'all' || card.dataset.category === filter));
    const count = document.querySelector('[data-filter="all"] span');
    if (count) count.textContent = String(grid.querySelectorAll('.game-card').length);
    if (empty) empty.hidden = [...grid.querySelectorAll('.game-card')].some((item) => !item.hidden);
  }
  search?.addEventListener('input', filterCard);
  document.querySelectorAll('.filter-chip').forEach((button) => button.addEventListener('click', filterCard));

  let stop = () => {};
  dialog.addEventListener('close', () => stop());
  card.querySelector('button').addEventListener('click', openGame);

  function openGame() {
    stop(); heading.textContent = 'Cosmic Blaster';
    stage.innerHTML = '<div class="cosmic-game"><p class="cosmic-help">Aim with your finger or mouse and tap the friendly space critters before they drift away. This is a colorful, make-believe arcade game.</p><div class="cosmic-settings"><label>Difficulty <select class="cosmic-difficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Challenge</option></select></label><label>Blaster glow <select class="cosmic-color"><option value="#77f5d2">Mint</option><option value="#ff86b8">Bubblegum</option><option value="#ffe27a">Sunshine</option><option value="#9e91ff">Violet</option></select></label></div><div class="cosmic-hud"><span>Score <b class="cosmic-score">0</b></span><span>Time <b class="cosmic-time">30</b></span><span>Hits <b class="cosmic-hits">0</b></span></div><canvas class="cosmic-canvas" width="800" height="500" aria-label="Cosmic Blaster target game"></canvas><p class="cosmic-message" aria-live="polite">Ready to play?</p><button type="button" class="game-primary cosmic-start">Start game</button></div>';
    if (!dialog.open) dialog.showModal();
    stop = play(stage);
  }

  function play(root) {
    const canvas = root.querySelector('.cosmic-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = root.querySelector('.cosmic-score');
    const timeEl = root.querySelector('.cosmic-time');
    const hitsEl = root.querySelector('.cosmic-hits');
    const message = root.querySelector('.cosmic-message');
    const startButton = root.querySelector('.cosmic-start');
    const difficulty = root.querySelector('.cosmic-difficulty');
    const colorSelect = root.querySelector('.cosmic-color');
    let targets = [], score = 0, hits = 0, seconds = 30, running = false, raf = 0, timer = 0, spawnTimer = 0, last = 0, pointer = { x: 400, y: 250 };
    let blips = [];
    const levels = { easy: { spawn: 1050, speed: 0.18 }, normal: { spawn: 760, speed: 0.27 }, hard: { spawn: 520, speed: 0.39 } };
    const critters = ['👾', '👽', '🤖', '🐙', '🛸'];

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height); sky.addColorStop(0, '#151b3d'); sky.addColorStop(.58, '#443b70'); sky.addColorStop(1, '#171b33');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 65; i++) { ctx.globalAlpha = .25 + (i % 5) * .12; ctx.fillStyle = '#fff'; ctx.fillRect((i * 131 + 19) % 800, (i * 73 + 11) % 340, 2, 2); } ctx.globalAlpha = 1;
      // Perspective floor and receding grid create a lightweight 3D arcade look.
      ctx.fillStyle = '#27264a'; ctx.beginPath(); ctx.moveTo(0, 320); ctx.lineTo(800, 320); ctx.lineTo(800, 500); ctx.lineTo(0, 500); ctx.fill();
      ctx.strokeStyle = '#b1a2ff40'; ctx.lineWidth = 2;
      for (let i = 0; i < 11; i++) { const y = 320 + i * i * 1.65; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }
      for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(400 + i * 8, 320); ctx.lineTo(400 + i * 62, 500); ctx.stroke(); }
    }
    function drawTarget(target) {
      const scale = .42 + target.depth * .8; const radius = 19 * scale;
      const x = target.x; const y = target.y;
      ctx.globalAlpha = Math.min(1, .55 + target.depth);
      ctx.fillStyle = '#10132966'; ctx.beginPath(); ctx.ellipse(x, y + radius * .85, radius * 1.1, radius * .35, 0, 0, Math.PI * 2); ctx.fill();
      const glow = ctx.createRadialGradient(x - radius * .3, y - radius * .4, 2, x, y, radius * 1.35); glow.addColorStop(0, '#fff'); glow.addColorStop(.25, target.color); glow.addColorStop(1, '#8a72ff');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.font = `${Math.max(14, radius * 1.35)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(target.icon, x, y);
      ctx.globalAlpha = 1; target.hitRadius = radius;
    }
    function draw() {
      drawBackground(); targets.forEach(drawTarget);
      blips.forEach((effect) => { ctx.globalAlpha = effect.life; ctx.strokeStyle = colorSelect.value; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(effect.x, effect.y, 7 + (1 - effect.life) * 24, 0, Math.PI * 2); ctx.stroke(); }); ctx.globalAlpha = 1;
      // Bright arcade reticle follows pointer/touch.
      ctx.strokeStyle = colorSelect.value; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 12, 0, Math.PI * 2); ctx.moveTo(pointer.x - 19, pointer.y); ctx.lineTo(pointer.x - 7, pointer.y); ctx.moveTo(pointer.x + 7, pointer.y); ctx.lineTo(pointer.x + 19, pointer.y); ctx.moveTo(pointer.x, pointer.y - 19); ctx.lineTo(pointer.x, pointer.y - 7); ctx.moveTo(pointer.x, pointer.y + 7); ctx.lineTo(pointer.x, pointer.y + 19); ctx.stroke();
    }
    function spawn() {
      const x = 70 + Math.random() * 660;
      targets.push({ x, y: 170 + Math.random() * 130, depth: .05, drift: (Math.random() - .5) * 70, icon: critters[Math.floor(Math.random() * critters.length)], color: ['#ff83bb', '#72e0c3', '#ffe17c', '#9d8bff'][Math.floor(Math.random() * 4)] });
    }
    function end() {
      if (!running) return;
      running = false; clearInterval(timer); clearInterval(spawnTimer); cancelAnimationFrame(raf);
      message.textContent = `Time! You scored ${score} with ${hits} hits.`; startButton.textContent = 'Play again'; startButton.hidden = false;
      window.dispatchEvent(new CustomEvent('tomato:score', { detail: { game: 'Cosmic Blaster', score } })); draw();
    }
    function update(dt) {
      const level = levels[difficulty.value];
      targets.forEach((target) => { target.depth += level.speed * dt; target.x += target.drift * dt * target.depth; target.y = 175 + target.depth * 215 + Math.sin(performance.now() / 360 + target.x) * 8; });
      targets = targets.filter((target) => target.depth < 1.08);
      blips.forEach((effect) => { effect.life -= dt * 1.8; }); blips = blips.filter((effect) => effect.life > 0);
      draw();
    }
    function frame(now) { if (!running) return; const dt = Math.min((now - (last || now)) / 1000, .05); last = now; update(dt); if (running) raf = requestAnimationFrame(frame); }
    function start() {
      clearInterval(timer); clearInterval(spawnTimer); cancelAnimationFrame(raf); targets = []; blips = []; score = 0; hits = 0; seconds = 30; last = 0; running = true;
      scoreEl.textContent = '0'; hitsEl.textContent = '0'; timeEl.textContent = '30'; message.textContent = 'Tap the friendly targets!'; startButton.hidden = true;
      spawn(); spawnTimer = setInterval(spawn, levels[difficulty.value].spawn);
      timer = setInterval(() => { seconds--; timeEl.textContent = String(seconds); if (seconds <= 0) end(); }, 1000);
      raf = requestAnimationFrame(frame);
    }
    function aim(event) {
      const rect = canvas.getBoundingClientRect(); pointer = { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
    }
    function fire(event) {
      if (!running) return; aim(event);
      const index = targets.findIndex((target) => Math.hypot(target.x - pointer.x, target.y - pointer.y) <= (target.hitRadius || 22) + 10);
      blips.push({ x: pointer.x, y: pointer.y, life: .9 });
      if (index >= 0) { targets.splice(index, 1); score += 10; hits++; scoreEl.textContent = String(score); hitsEl.textContent = String(hits); message.textContent = 'Nice shot! Keep going! ✨'; }
      else message.textContent = 'Missed! Try another target.';
      draw();
    }
    const onKey = (event) => { if (event.key === 'Escape') return; if (event.key === ' ' && running) { event.preventDefault(); const nearest = targets.sort((a,b)=>Math.hypot(a.x-pointer.x,a.y-pointer.y)-Math.hypot(b.x-pointer.x,b.y-pointer.y))[0]; if (nearest) fire({ clientX: canvas.getBoundingClientRect().left + nearest.x / canvas.width * canvas.getBoundingClientRect().width, clientY: canvas.getBoundingClientRect().top + nearest.y / canvas.height * canvas.getBoundingClientRect().height }); } };
    canvas.addEventListener('pointermove', aim); canvas.addEventListener('pointerdown', fire); window.addEventListener('keydown', onKey); startButton.addEventListener('click', start);
    draw();
    return () => { running = false; clearInterval(timer); clearInterval(spawnTimer); cancelAnimationFrame(raf); canvas.removeEventListener('pointermove', aim); canvas.removeEventListener('pointerdown', fire); window.removeEventListener('keydown', onKey); };
  }
})();
