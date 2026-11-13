(() => {
  const dialog = document.querySelector('#game-dialog');
  const stage = document.querySelector('#game-stage');
  const heading = document.querySelector('#dialog-title');
  const gameCardButton = document.querySelector('[data-game="enemies"]');
  let stopGame = () => {};

  // 10 × 10 × 10 deliberately fictional names provide 1,000 selectable blasters.
  const prefixes = ['Tomato', 'Comet', 'Jelly', 'Bubble', 'Pixel', 'Cosmic', 'Neon', 'Marshmallow', 'Starry', 'Bouncy'];
  const cores = ['Popper', 'Sprinkler', 'Zapper', 'Sparkler', 'Confetti Caster', 'Pea Shooter', 'Bubble Blaster', 'Star Launcher', 'Wobble Wand', 'Jelly Jetter'];
  const finishes = ['of Giggles', 'of Stardust', 'of Bubbles', 'of the Garden', 'of Rainbows', 'of Zoomies', 'of the Moon', 'of Sprinkles', 'of Daydreams', 'of Good Luck'];
  const blasters = [];
  prefixes.forEach((prefix, p) => cores.forEach((core, c) => finishes.forEach((finish, f) => {
    const index = blasters.length;
    blasters.push({
      name: `${prefix} ${core} ${finish}`,
      color: ['#ff8065', '#71dcbb', '#a992ff', '#ffd166', '#77b9ff', '#ff8ac5', '#a9df75', '#ffad66', '#78e0e8', '#d2a3ff'][(p + c + f) % 10],
      damage: 1 + ((p + f) % 3),
      speed: 270 + ((c * 19 + p * 13 + f * 7) % 150),
      cooldown: 170 + ((p * 17 + c * 11 + f * 5) % 300),
      spread: 1 + ((p + c + f) % 3)
    });
  })));

  gameCardButton.addEventListener('click', () => {
    stopGame();
    heading.textContent = 'Enemy Rush';
    stage.innerHTML = '<div class="enemy-rush"><p class="game-instructions">Pick a pretend blaster and difficulty, then dodge the silly space baddies! Move with <strong>WASD</strong> or arrow keys. Your blaster automatically aims at nearby enemies.</p><div class="enemy-options"><label>Difficulty<select class="enemy-difficulty"><option value="easy">Easy — gentle</option><option value="normal" selected>Normal — a challenge</option><option value="hard">Hard — speedy baddies</option><option value="expert">Expert — good luck!</option></select></label><label>Choose a blaster<select class="enemy-weapon"></select></label></div><p class="weapon-count">Choose from <strong>1,000 different pretend blasters</strong>. Try the random button to discover one!</p><div class="enemy-hud"><span>Wave: <b class="enemy-wave">0</b></span><span>Score: <b class="enemy-score">0</b></span><span>Hearts: <b class="enemy-hearts">♥♥♥</b></span></div><canvas class="enemy-canvas" width="600" height="380" aria-label="Enemy Rush game board"></canvas><p class="enemy-toast" aria-live="polite">Ready when you are!</p><div class="enemy-actions"></div><p class="enemy-help">Desktop: WASD / arrow keys · Mobile: tap or drag to move · Blasters and enemies are make-believe arcade sprites.</p></div>';
    if (!dialog.open) dialog.showModal();
    initialize();
  });

  dialog.addEventListener('close', () => stopGame());

  function initialize() {
    const canvas = stage.querySelector('.enemy-canvas');
    const ctx = canvas.getContext('2d');
    const weaponSelect = stage.querySelector('.enemy-weapon');
    const difficultySelect = stage.querySelector('.enemy-difficulty');
    const waveText = stage.querySelector('.enemy-wave');
    const scoreText = stage.querySelector('.enemy-score');
    const heartsText = stage.querySelector('.enemy-hearts');
    const toast = stage.querySelector('.enemy-toast');
    const actions = stage.querySelector('.enemy-actions');
    const difficulty = { easy: { speed: 0.72, health: 1, interval: 1100, hearts: 5 }, normal: { speed: 1, health: 1, interval: 850, hearts: 3 }, hard: { speed: 1.35, health: 2, interval: 650, hearts: 3 }, expert: { speed: 1.75, health: 3, interval: 470, hearts: 2 } };
    const optionList = document.createDocumentFragment();
    blasters.forEach((blaster, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${String(index + 1).padStart(4, '0')} · ${blaster.name}`;
      optionList.append(option);
    });
    weaponSelect.append(optionList);
    weaponSelect.value = String(Math.floor(Math.random() * blasters.length));

    let player, enemies, shots, particles, score, wave, hearts, running = false, animationId, spawnTimer, lastShot = 0, lastTime = 0;
    let pointer = null;
    const keys = new Set();
    const onKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
      keys.add(event.key.toLowerCase());
    };
    const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
    const onPointerDown = (event) => { const rect = canvas.getBoundingClientRect(); pointer = { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; canvas.setPointerCapture?.(event.pointerId); };
    const onPointerMove = (event) => { if (!pointer || event.buttons) { const rect = canvas.getBoundingClientRect(); pointer = { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; } };
    const onPointerUp = () => { pointer = null; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    function updateHud() {
      waveText.textContent = String(wave);
      scoreText.textContent = String(score);
      heartsText.textContent = '♥'.repeat(Math.max(0, hearts)) + '♡'.repeat(Math.max(0, 5 - hearts));
    }
    function draw() {
      ctx.fillStyle = '#242333'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ffffff0c'; ctx.lineWidth = 1;
      for (let x = 20; x < canvas.width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 20; y < canvas.height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      particles.forEach((part) => { ctx.globalAlpha = Math.max(0, part.life); ctx.fillStyle = part.color; ctx.beginPath(); ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
      shots.forEach((shot) => { ctx.fillStyle = shot.color; ctx.beginPath(); ctx.arc(shot.x, shot.y, 5, 0, Math.PI * 2); ctx.fill(); });
      enemies.forEach((enemy) => { ctx.fillStyle = enemy.color; ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(enemy.x - 4, enemy.y - 2, 2, 0, Math.PI * 2); ctx.arc(enemy.x + 4, enemy.y - 2, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#312d3a'; ctx.fillRect(enemy.x - 5, enemy.y + 4, 10, 2); if (enemy.hp > 1) { ctx.fillStyle = '#ffffff88'; ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 6, enemy.radius * 2 * enemy.hp / enemy.maxHp, 3); } });
      if (player) { ctx.fillStyle = '#fff4bd'; ctx.beginPath(); ctx.arc(player.x, player.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ef5945'; ctx.beginPath(); ctx.arc(player.x, player.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4d3440'; ctx.beginPath(); ctx.arc(player.x - 2, player.y - 2, 1.5, 0, Math.PI * 2); ctx.arc(player.x + 3, player.y - 2, 1.5, 0, Math.PI * 2); ctx.fill(); }
    }
    function spawnEnemy() {
      const edge = Math.floor(Math.random() * 4); let x, y;
      if (edge === 0) { x = Math.random() * canvas.width; y = -15; }
      else if (edge === 1) { x = canvas.width + 15; y = Math.random() * canvas.height; }
      else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 15; }
      else { x = -15; y = Math.random() * canvas.height; }
      const cfg = difficulty[difficultySelect.value]; const hp = cfg.health + Math.floor(wave / 5);
      enemies.push({ x, y, radius: 11 + Math.min(wave, 8), speed: (34 + Math.random() * 20 + wave * 2) * cfg.speed, hp, maxHp: hp, color: ['#9b8cff', '#ff82b4', '#78d7bc', '#ffd166'][Math.floor(Math.random() * 4)] });
    }
    function endGame() {
      running = false; clearInterval(spawnTimer); cancelAnimationFrame(animationId);
      toast.textContent = `Game over! You reached wave ${wave} and scored ${score}.`;
      const button = document.createElement('button'); button.className = 'game-primary'; button.type = 'button'; button.textContent = 'Play again'; button.addEventListener('click', startGame); actions.replaceChildren(button);
    }
    function tick(time) {
      if (!running) return;
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.04); lastTime = time;
      let dx = 0, dy = 0;
      if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
      if (keys.has('arrowright') || keys.has('d')) dx += 1;
      if (keys.has('arrowup') || keys.has('w')) dy -= 1;
      if (keys.has('arrowdown') || keys.has('s')) dy += 1;
      if (pointer) { const px = pointer.x - player.x, py = pointer.y - player.y; const length = Math.hypot(px, py); if (length > 8) { dx = px / length; dy = py / length; } else { dx = 0; dy = 0; } }
      const magnitude = Math.hypot(dx, dy) || 1;
      player.x = Math.max(14, Math.min(canvas.width - 14, player.x + dx / magnitude * 190 * dt));
      player.y = Math.max(14, Math.min(canvas.height - 14, player.y + dy / magnitude * 190 * dt));
      const weapon = blasters[Number(weaponSelect.value)];
      const target = enemies.reduce((nearest, enemy) => !nearest || Math.hypot(enemy.x - player.x, enemy.y - player.y) < Math.hypot(nearest.x - player.x, nearest.y - player.y) ? enemy : nearest, null);
      if (target && time - lastShot > weapon.cooldown) {
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        for (let i = 0; i < weapon.spread; i++) { const offset = (i - (weapon.spread - 1) / 2) * 0.16; shots.push({ x: player.x, y: player.y, vx: Math.cos(angle + offset) * weapon.speed, vy: Math.sin(angle + offset) * weapon.speed, color: weapon.color, damage: weapon.damage }); }
        lastShot = time;
      }
      shots.forEach((shot) => { shot.x += shot.vx * dt; shot.y += shot.vy * dt; });
      shots = shots.filter((shot) => shot.x > -10 && shot.x < canvas.width + 10 && shot.y > -10 && shot.y < canvas.height + 10);
      enemies.forEach((enemy) => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed * dt; enemy.y += Math.sin(angle) * enemy.speed * dt;
        shots.forEach((shot) => { if (!shot.hit && Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < enemy.radius + 5) { shot.hit = true; enemy.hp -= shot.damage; for (let i = 0; i < 3; i++) particles.push({ x: shot.x, y: shot.y, life: 0.5, radius: 2 + Math.random() * 2, color: weapon.color }); } });
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.radius + 12 && !enemy.bumped) { enemy.bumped = true; hearts -= 1; updateHud(); if (hearts <= 0) endGame(); }
      });
      shots = shots.filter((shot) => !shot.hit);
      const defeated = enemies.filter((enemy) => enemy.hp <= 0); score += defeated.length * 10; enemies = enemies.filter((enemy) => enemy.hp > 0);
      defeated.forEach((enemy) => { for (let i = 0; i < 8; i++) particles.push({ x: enemy.x, y: enemy.y, life: 0.75, radius: 2 + Math.random() * 3, color: enemy.color }); });
      particles.forEach((part) => { part.life -= dt; }); particles = particles.filter((part) => part.life > 0);
      updateHud(); draw();
      if (running) animationId = requestAnimationFrame(tick);
    }
    function startGame() {
      clearInterval(spawnTimer); cancelAnimationFrame(animationId);
      const cfg = difficulty[difficultySelect.value]; player = { x: canvas.width / 2, y: canvas.height / 2 };
      enemies = []; shots = []; particles = []; score = 0; wave = 1; hearts = cfg.hearts; lastShot = 0; lastTime = 0; running = true; updateHud();
      toast.textContent = 'Stay moving and keep an eye out!'; actions.replaceChildren();
      spawnEnemy(); spawnTimer = window.setInterval(() => { if (running) { spawnEnemy(); if (score > wave * 80) { wave += 1; updateHud(); toast.textContent = `Wave ${wave}! Here come more baddies!`; } } }, cfg.interval);
      animationId = requestAnimationFrame(tick);
    }
    function startGameButton() { const button = document.createElement('button'); button.className = 'game-primary'; button.type = 'button'; button.textContent = 'Start game'; button.addEventListener('click', startGame); actions.replaceChildren(button); }
    startGameButton(); draw();
    stopGame = () => { running = false; clearInterval(spawnTimer); cancelAnimationFrame(animationId); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointercancel', onPointerUp); };
  }
})();
