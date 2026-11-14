(() => {
  const dialog = document.querySelector('#game-dialog');
  const stage = document.querySelector('#game-stage');
  const title = document.querySelector('#dialog-title');
  let cleanupParkour = () => {};
  const card = document.querySelector('[data-game="parkour"]');
  if (!card) return;

  card.addEventListener('click', () => {
    cleanupParkour();
    title.textContent = 'Skyline Parkour';
    stage.innerHTML = '<div class="parkour-game"><p class="parkour-help">Run across the rooftops, jump over gaps and obstacles, and collect stars. Desktop: arrow keys or A/D to move, Space to jump. Tablet: use the buttons below.</p><div class="parkour-hud"><span>Distance: <b class="parkour-score">0</b> m</span><span>Stars: <b class="parkour-stars">0</b></span><span>Best: <b class="parkour-best">0</b> m</span></div><canvas class="parkour-canvas" width="640" height="360" aria-label="Skyline Parkour game"></canvas><p class="parkour-message" aria-live="polite">Ready to run?</p><div class="parkour-actions"><button class="game-primary parkour-start" type="button">Start game</button></div><div class="parkour-controls" aria-label="Touch game controls"><button type="button" data-move="left" aria-label="Move left">←</button><button type="button" data-move="jump" aria-label="Jump">↑ Jump</button><button type="button" data-move="right" aria-label="Move right">→</button></div></div>';
    if (!dialog.open) dialog.showModal();
    cleanupParkour = playParkour(stage);
  });
  dialog.addEventListener('close', () => cleanupParkour());

  function playParkour(root) {
    const canvas = root.querySelector('.parkour-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = root.querySelector('.parkour-score');
    const starsEl = root.querySelector('.parkour-stars');
    const bestEl = root.querySelector('.parkour-best');
    const message = root.querySelector('.parkour-message');
    const startButton = root.querySelector('.parkour-start');
    let best = 0;
    try { best = Number(localStorage.getItem('tomato-parkour-best')) || 0; } catch (_) { /* local storage might be unavailable */ }
    bestEl.textContent = String(best);

    const groundY = 280;
    let running = false;
    let raf = 0;
    let lastTime = 0;
    let spawnClock = 0;
    let distance = 0;
    let stars = 0;
    let speed = 230;
    let player;
    let objects = [];
    const held = new Set();
    const keyMap = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'jump', ' ': 'jump', w: 'jump' };

    function polygon(points, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      ctx.fill();
    }

    function drawBlock(x, y, width, height, color) {
      const depth = 14;
      polygon([[x, y], [x + width, y], [x + width + depth, y - depth], [x + depth, y - depth]], '#ffffff55');
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
      polygon([[x + width, y], [x + width + depth, y - depth], [x + width + depth, y + height - depth], [x + width, y + height]], '#34334f');
      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(x + 8, y + 9, Math.max(0, width - 18), 4);
    }

    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, '#9edcff'); sky.addColorStop(1, '#f6d4ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Distant city silhouettes add depth without requiring a 3D engine.
      for (let i = 0; i < 10; i++) {
        const x = i * 76 - (distance * 0.18 % 76);
        const h = 75 + (i * 37 % 100);
        ctx.fillStyle = i % 2 ? '#8294be' : '#7185af';
        ctx.fillRect(x, groundY - h, 54, h);
        ctx.fillStyle = '#ffefaa88';
        for (let wy = groundY - h + 14; wy < groundY - 8; wy += 19) ctx.fillRect(x + 9, wy, 6, 8);
      }
      ctx.fillStyle = '#ffe69a'; ctx.beginPath(); ctx.arc(520, 68, 28, 0, Math.PI * 2); ctx.fill();
      // Rooftop lane and perspective stripes.
      polygon([[0, groundY], [canvas.width, groundY], [canvas.width, canvas.height], [0, canvas.height]], '#584b78');
      ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        const y = groundY + ((i * 25 + distance * 1.4) % 100);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      objects.forEach((object) => {
        const scale = 0.55 + Math.max(0, object.x) / canvas.width * 0.7;
        if (object.type === 'star') {
          ctx.font = `${Math.round(22 * scale)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.fillText('⭐', object.x, object.y);
        } else {
          drawBlock(object.x, object.y, object.width * scale, object.height * scale, object.type === 'gap' ? '#302943' : '#ff816c');
        }
      });
      if (player) {
        const py = groundY - player.height - player.jump;
        // Shadow, body and head make a simple readable runner character.
        ctx.globalAlpha = Math.max(0.15, 0.38 - player.jump / 300);
        ctx.fillStyle = '#302943'; ctx.beginPath(); ctx.ellipse(player.x, groundY + 2, 19, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff704f'; ctx.fillRect(player.x - 11, py + 13, 22, player.height - 13);
        ctx.fillStyle = '#ffd8b0'; ctx.beginPath(); ctx.arc(player.x, py + 8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#382e46'; ctx.fillRect(player.x + 2, py + 7, 3, 3);
        ctx.fillStyle = '#4f59a9'; ctx.fillRect(player.x - 12, groundY - 7, 9, 7); ctx.fillRect(player.x + 3, groundY - 7, 9, 7);
      }
      if (!running) { ctx.fillStyle = '#19172a44'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }

    function jump() {
      if (running && player.grounded) {
        player.vy = 470;
        player.grounded = false;
      }
    }
    function spawnObject() {
      const roll = Math.random();
      if (roll < 0.30) objects.push({ type: 'star', x: canvas.width + 20, y: groundY - 62 - Math.random() * 45, width: 20, height: 20 });
      else if (roll < 0.55) objects.push({ type: 'gap', x: canvas.width + 20, y: groundY, width: 55 + Math.random() * 25, height: 70 });
      else objects.push({ type: 'block', x: canvas.width + 20, y: groundY - 31, width: 30 + Math.random() * 12, height: 31 });
    }

    function finish() {
      running = false; cancelAnimationFrame(raf);
      const finalDistance = Math.floor(distance / 10);
      scoreEl.textContent = String(finalDistance);
      message.textContent = `Run over! You made it ${finalDistance} m and collected ${stars} star${stars === 1 ? '' : 's'}.`;
      if (finalDistance > best) {
        best = finalDistance; bestEl.textContent = String(best);
        try { localStorage.setItem('tomato-parkour-best', String(best)); } catch (_) { /* ignore */ }
      }
      startButton.textContent = 'Run again'; startButton.hidden = false;
      draw();
    }

    function update(dt) {
      if (held.has('left')) player.x -= 230 * dt;
      if (held.has('right')) player.x += 230 * dt;
      player.x = Math.max(32, Math.min(canvas.width * 0.66, player.x));
      player.jump += player.vy * dt;
      player.vy -= 1150 * dt;
      if (player.jump <= 0) { player.jump = 0; player.vy = 0; player.grounded = true; }
      distance += speed * dt;
      speed = Math.min(390, 230 + distance * 0.035);
      spawnClock += dt;
      if (spawnClock > Math.max(0.72, 1.3 - distance / 3500)) { spawnClock = 0; spawnObject(); }
      for (const object of objects) object.x -= speed * dt;
      objects = objects.filter((object) => object.x > -100);
      const playerLeft = player.x - 12, playerRight = player.x + 12;
      for (const object of objects) {
        if (object.type === 'star' && !object.collected && Math.abs(object.x - player.x) < 24 && Math.abs(object.y - (groundY - player.height - player.jump / 2)) < 30) {
          object.collected = true; stars += 1; starsEl.textContent = String(stars);
        } else if (object.type !== 'star' && playerRight > object.x && playerLeft < object.x + object.width && player.jump < (object.type === 'gap' ? 42 : object.height * 0.72)) {
          finish(); return;
        }
      }
      objects = objects.filter((object) => !object.collected);
      scoreEl.textContent = String(Math.floor(distance / 10));
      draw();
    }
    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - (lastTime || now)) / 1000, 0.04); lastTime = now;
      update(dt);
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() {
      cancelAnimationFrame(raf); distance = 0; stars = 0; speed = 230; spawnClock = 0; objects = [];
      player = { x: 120, height: 40, jump: 0, vy: 0, grounded: true };
      scoreEl.textContent = '0'; starsEl.textContent = '0'; message.textContent = 'Run! Jump over obstacles and gaps!'; startButton.hidden = true;
      running = true; lastTime = 0; raf = requestAnimationFrame(frame);
    }
    function onKeyDown(event) {
      const action = keyMap[event.key] || keyMap[event.key.toLowerCase()];
      if (!action || !dialog.open) return;
      event.preventDefault();
      if (action === 'jump') jump(); else held.add(action);
    }
    function onKeyUp(event) {
      const action = keyMap[event.key] || keyMap[event.key.toLowerCase()];
      if (action) held.delete(action);
    }
    const controls = [...root.querySelectorAll('[data-move]')];
    controls.forEach((button) => {
      const action = button.dataset.move;
      const down = (event) => { event.preventDefault(); if (action === 'jump') jump(); else held.add(action); };
      const up = () => held.delete(action);
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('pointerleave', up);
      button._parkourCleanup = () => { button.removeEventListener('pointerdown', down); button.removeEventListener('pointerup', up); button.removeEventListener('pointercancel', up); button.removeEventListener('pointerleave', up); };
    });
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    startButton.addEventListener('click', start);
    draw();
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); controls.forEach((button) => button._parkourCleanup()); };
  }
})();
