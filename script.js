const dialog = document.querySelector('#game-dialog');
const stage = document.querySelector('#game-stage');
const title = document.querySelector('#dialog-title');
let cleanupCurrentGame = () => {};

// Search and category filters work together so it is easy to find a game.
const cards = [...document.querySelectorAll('.game-card')];
const searchInput = document.querySelector('#game-search');
const filterButtons = [...document.querySelectorAll('.filter-chip')];
const noResults = document.querySelector('#no-results');
let selectedCategory = 'all';

function filterGames() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;
  cards.forEach((card) => {
    const matchesCategory = selectedCategory === 'all' || card.dataset.category === selectedCategory;
    const matchesSearch = card.dataset.name.includes(query) || card.querySelector('h3').textContent.toLowerCase().includes(query);
    card.hidden = !(matchesCategory && matchesSearch);
    if (!card.hidden) visibleCount += 1;
  });
  noResults.hidden = visibleCount > 0;
}

searchInput.addEventListener('input', filterGames);
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    filterGames();
  });
});

document.querySelectorAll('[data-game]').forEach((button) => {
  button.addEventListener('click', () => openGame(button.dataset.game));
});
document.querySelector('#close-game').addEventListener('click', closeGame);
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) closeGame();
});
dialog.addEventListener('close', () => cleanupCurrentGame());
document.querySelector('#year').textContent = new Date().getFullYear();

function openGame(game) {
  cleanupCurrentGame();
  stage.replaceChildren();
  if (game === 'tap') startTapGame();
  if (game === 'memory') startMemoryGame();
  if (game === 'snake') startSnakeGame();
  if (!dialog.open) dialog.showModal();
}

function closeGame() {
  if (dialog.open) dialog.close();
}

function setTitle(text) {
  title.textContent = text;
}

function makeButton(text, onClick) {
  const button = document.createElement('button');
  button.className = 'game-primary';
  button.type = 'button';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function startTapGame() {
  setTitle('Tomato Tap');
  const wrap = document.createElement('div');
  wrap.className = 'tap-game';
  wrap.innerHTML = '<p class="game-instructions">Tap the tomato as many times as you can before time runs out!</p><p class="tap-score">Score: <span>0</span></p><p class="tap-time">Ready when you are</p><button class="tap-target" type="button" aria-label="Tap the tomato">🍅</button><div class="tap-action"></div>';
  stage.append(wrap);
  const scoreText = wrap.querySelector('.tap-score span');
  const timeText = wrap.querySelector('.tap-time');
  const target = wrap.querySelector('.tap-target');
  const action = wrap.querySelector('.tap-action');
  let score = 0;
  let remaining = 15;
  let timer;
  target.disabled = true;
  action.append(makeButton('Start game', () => {
    action.replaceChildren();
    target.disabled = false;
    timeText.textContent = `${remaining} seconds left`;
    timer = window.setInterval(() => {
      remaining -= 1;
      timeText.textContent = `${remaining} second${remaining === 1 ? '' : 's'} left`;
      if (remaining <= 0) {
        window.clearInterval(timer);
        target.disabled = true;
        timeText.textContent = `Time's up! You scored ${score}.`;
        action.append(makeButton('Play again', startTapGame));
      }
    }, 1000);
  }));
  target.addEventListener('click', () => {
    score += 1;
    scoreText.textContent = String(score);
  });
  cleanupCurrentGame = () => window.clearInterval(timer);
}

function startMemoryGame() {
  setTitle('Memory Match');
  const wrap = document.createElement('div');
  wrap.className = 'memory-game';
  wrap.innerHTML = '<p class="game-instructions">Turn over two cards at a time and find all the pairs.</p><p class="tap-time">Moves: <span class="move-count">0</span></p><div class="memory-board" aria-label="Memory cards"></div><p class="memory-message" aria-live="polite"></p>';
  stage.append(wrap);
  const board = wrap.querySelector('.memory-board');
  const message = wrap.querySelector('.memory-message');
  const moveCount = wrap.querySelector('.move-count');
  const icons = ['🍋', '🍓', '🍇', '🍊', '🍋', '🍓', '🍇', '🍊'];
  icons.sort(() => Math.random() - 0.5);
  let first = null;
  let locked = false;
  let moves = 0;
  let matched = 0;
  let hideTimer;
  const buttons = icons.map((icon, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.textContent = '?';
    card.setAttribute('aria-label', `Hidden card ${index + 1}`);
    card.addEventListener('click', () => {
      if (locked || card.classList.contains('matched') || card === first) return;
      card.textContent = icon;
      card.classList.add('revealed');
      card.setAttribute('aria-label', icon);
      if (!first) {
        first = card;
        return;
      }
      moves += 1;
      moveCount.textContent = String(moves);
      if (first.textContent === card.textContent) {
        first.classList.add('matched');
        card.classList.add('matched');
        first = null;
        matched += 2;
        if (matched === icons.length) message.textContent = `You found them all in ${moves} moves! Great job! 🎉`;
      } else {
        locked = true;
        const previous = first;
        hideTimer = window.setTimeout(() => {
          previous.textContent = '?';
          previous.classList.remove('revealed');
          previous.setAttribute('aria-label', 'Hidden card');
          card.textContent = '?';
          card.classList.remove('revealed');
          card.setAttribute('aria-label', 'Hidden card');
          first = null;
          locked = false;
        }, 750);
      }
    });
    board.append(card);
    return card;
  });
  cleanupCurrentGame = () => {
    window.clearTimeout(hideTimer);
    buttons.forEach((card) => card.replaceWith(card.cloneNode(true)));
  };
}

function startSnakeGame() {
  setTitle('Snaky');
  const wrap = document.createElement('div');
  wrap.className = 'snake-game';
  wrap.innerHTML = '<p class="game-instructions">Use the arrow keys (or the buttons) to eat apples. Don\'t hit the walls or yourself!</p><p class="snake-status" aria-live="polite">Press Start to play. Score: <span>0</span></p><canvas class="snake-canvas" width="360" height="360" aria-label="Snake game board"></canvas><div class="snake-controls" aria-label="Touch controls"><button type="button" data-dir="up" aria-label="Up">↑</button><button type="button" data-dir="left" aria-label="Left">←</button><button type="button" data-dir="down" aria-label="Down">↓</button><button type="button" data-dir="right" aria-label="Right">→</button></div><div class="snake-action" style="margin-top:12px"></div>';
  stage.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const status = wrap.querySelector('.snake-status');
  const scoreText = status.querySelector('span');
  const action = wrap.querySelector('.snake-action');
  const cell = 18;
  let snake;
  let direction;
  let nextDirection;
  let apple;
  let score;
  let timer;
  let running = false;

  function draw() {
    ctx.fillStyle = '#1f281e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!snake) return;
    ctx.fillStyle = '#ff6750';
    ctx.fillRect(apple.x * cell + 2, apple.y * cell + 2, cell - 4, cell - 4);
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? '#b9f08f' : '#70bf67';
      ctx.fillRect(part.x * cell + 1, part.y * cell + 1, cell - 2, cell - 2);
    });
  }

  function placeApple() {
    do {
      apple = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
    } while (snake.some((part) => part.x === apple.x && part.y === apple.y));
  }

  function endGame() {
    running = false;
    window.clearInterval(timer);
    status.firstChild.textContent = `Game over! Score: ${score} · `;
    action.replaceChildren(makeButton('Play again', start));
  }

  function step() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const eating = head.x === apple.x && head.y === apple.y;
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.slice(0, eating ? undefined : -1).some((part) => part.x === head.x && part.y === head.y)) {
      endGame();
      return;
    }
    snake.unshift(head);
    if (eating) {
      score += 1;
      scoreText.textContent = String(score);
      placeApple();
    } else {
      snake.pop();
    }
    draw();
  }

  function turn(name) {
    const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    const proposed = directions[name];
    if (proposed && (proposed.x !== -direction.x || proposed.y !== -direction.y)) nextDirection = proposed;
  }

  function onKey(event) {
    const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (keys[event.key] && dialog.open) {
      event.preventDefault();
      turn(keys[event.key]);
    }
  }

  function start() {
    window.clearInterval(timer);
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = direction;
    score = 0;
    scoreText.textContent = '0';
    status.firstChild.textContent = 'Playing! Score: ';
    action.replaceChildren();
    running = true;
    placeApple();
    draw();
    timer = window.setInterval(step, 125);
  }

  wrap.querySelectorAll('[data-dir]').forEach((button) => button.addEventListener('click', () => turn(button.dataset.dir)));
  window.addEventListener('keydown', onKey);
  action.append(makeButton('Start game', start));
  draw();
  cleanupCurrentGame = () => {
    running = false;
    window.clearInterval(timer);
    window.removeEventListener('keydown', onKey);
  };
}
