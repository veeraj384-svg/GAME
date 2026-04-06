const screens = document.querySelectorAll('.screen');
const navButtons = document.querySelectorAll('.nav-btn');
const openButtons = document.querySelectorAll('[data-open]');

function showScreen(screenId) {
  screens.forEach(screen => {
    screen.classList.remove('active-screen');
  });

  navButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.screen === screenId) {
      btn.classList.add('active');
    }
  });

  const target = document.getElementById(screenId);
  if (target) target.classList.add('active-screen');

  if (screenId !== 'dashScreen') stopDashGame();
  if (screenId !== 'snakeScreen') stopSnakeGame();
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.screen));
});

openButtons.forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.open));
});

/* =========================
   NEON DASH
========================= */

const dashGameArea = document.getElementById('dashGameArea');
const player = document.getElementById('player');
const dashScoreEl = document.getElementById('dashScore');
const dashBestEl = document.getElementById('dashBest');
const dashLivesEl = document.getElementById('dashLives');
const dashStartBtn = document.getElementById('dashStartBtn');
const dashHomeBtn = document.getElementById('dashHomeBtn');
const dashOverlay = document.getElementById('dashOverlay');

let dashRunning = false;
let dashAnimationId = null;
let dashSpawnInterval = null;
let dashCoinInterval = null;
let dashScore = 0;
let dashLives = 3;
let dashBest = Number(localStorage.getItem('veerajDashBest')) || 0;

const dashEnemies = [];
let dashCoin = null;

const playerState = {
  x: 80,
  y: 80,
  size: 34,
  speed: 7,
  dx: 0,
  dy: 0
};

dashBestEl.textContent = dashBest;

function dashAreaWidth() {
  return dashGameArea.clientWidth;
}

function dashAreaHeight() {
  return dashGameArea.clientHeight;
}

function placePlayer() {
  player.style.left = `${playerState.x}px`;
  player.style.top = `${playerState.y}px`;
}

function clearDashEnemies() {
  dashEnemies.forEach(enemy => enemy.el.remove());
  dashEnemies.length = 0;
}

function clearDashCoin() {
  if (dashCoin && dashCoin.el) dashCoin.el.remove();
  dashCoin = null;
}

function stopDashLoops() {
  if (dashAnimationId) cancelAnimationFrame(dashAnimationId);
  if (dashSpawnInterval) clearInterval(dashSpawnInterval);
  if (dashCoinInterval) clearInterval(dashCoinInterval);

  dashAnimationId = null;
  dashSpawnInterval = null;
  dashCoinInterval = null;
}

function stopDashGame() {
  dashRunning = false;
  stopDashLoops();
}

function resetDashGame() {
  stopDashGame();

  dashScore = 0;
  dashLives = 3;

  playerState.x = 80;
  playerState.y = 80;
  playerState.dx = 0;
  playerState.dy = 0;

  dashScoreEl.textContent = dashScore;
  dashLivesEl.textContent = dashLives;

  clearDashEnemies();
  clearDashCoin();
  placePlayer();

  dashOverlay.classList.remove('hidden');
  dashOverlay.innerHTML = `
    <div class="overlay-card glass-inner">
      <h3>Ready?</h3>
      <p>Collect coins. Avoid red blocks.</p>
      <p class="tiny">Arrow keys / WASD to move</p>
    </div>
  `;
}

function spawnDashEnemy() {
  if (!dashRunning) return;

  const el = document.createElement('div');
  el.className = 'enemy';

  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * (dashAreaWidth() - 30);
    y = -30;
  } else if (side === 1) {
    x = dashAreaWidth();
    y = Math.random() * (dashAreaHeight() - 30);
  } else if (side === 2) {
    x = Math.random() * (dashAreaWidth() - 30);
    y = dashAreaHeight();
  } else {
    x = -30;
    y = Math.random() * (dashAreaHeight() - 30);
  }

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  dashGameArea.appendChild(el);

  dashEnemies.push({
    el,
    x,
    y,
    size: 30,
    speed: 1.8 + Math.min(dashScore * 0.03, 3)
  });
}

function spawnDashCoin() {
  if (!dashRunning || dashCoin) return;

  const el = document.createElement('div');
  el.className = 'coin';

  const x = Math.random() * (dashAreaWidth() - 22);
  const y = Math.random() * (dashAreaHeight() - 22);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  dashGameArea.appendChild(el);

  dashCoin = {
    el,
    x,
    y,
    size: 22
  };
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

function updateDashPlayer() {
  playerState.x += playerState.dx;
  playerState.y += playerState.dy;

  if (playerState.x < 0) playerState.x = 0;
  if (playerState.y < 0) playerState.y = 0;
  if (playerState.x > dashAreaWidth() - playerState.size) {
    playerState.x = dashAreaWidth() - playerState.size;
  }
  if (playerState.y > dashAreaHeight() - playerState.size) {
    playerState.y = dashAreaHeight() - playerState.size;
  }

  placePlayer();
}

function updateDashEnemies() {
  dashEnemies.forEach(enemy => {
    const angle = Math.atan2(playerState.y - enemy.y, playerState.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed;
    enemy.y += Math.sin(angle) * enemy.speed;

    enemy.el.style.left = `${enemy.x}px`;
    enemy.el.style.top = `${enemy.y}px`;
  });
}

function checkDashCollisions() {
  for (let i = dashEnemies.length - 1; i >= 0; i--) {
    if (isColliding(playerState, dashEnemies[i])) {
      dashEnemies[i].el.remove();
      dashEnemies.splice(i, 1);
      dashLives -= 1;
      dashLivesEl.textContent = dashLives;

      if (dashLives <= 0) {
        endDashGame();
        return;
      }
    }
  }

  if (dashCoin && isColliding(playerState, dashCoin)) {
    dashCoin.el.remove();
    dashCoin = null;
    dashScore += 10;
    dashScoreEl.textContent = dashScore;
  }
}

function dashLoop() {
  if (!dashRunning) return;

  updateDashPlayer();
  updateDashEnemies();
  checkDashCollisions();

  dashAnimationId = requestAnimationFrame(dashLoop);
}

function startDashGame() {
  showScreen('dashScreen');
  resetDashGame();

  dashRunning = true;
  dashOverlay.classList.add('hidden');

  spawnDashEnemy();
  spawnDashCoin();

  dashSpawnInterval = setInterval(spawnDashEnemy, 1500);
  dashCoinInterval = setInterval(() => {
    if (!dashCoin) spawnDashCoin();
  }, 2000);

  dashLoop();
}

function endDashGame() {
  dashRunning = false;
  stopDashLoops();

  if (dashScore > dashBest) {
    dashBest = dashScore;
    localStorage.setItem('veerajDashBest', String(dashBest));
    dashBestEl.textContent = dashBest;
  }

  dashOverlay.classList.remove('hidden');
  dashOverlay.innerHTML = `
    <div class="overlay-card glass-inner">
      <h3>Game Over</h3>
      <p>Final Score: ${dashScore}</p>
      <p class="tiny">Press Start Game to play again</p>
    </div>
  `;
}

dashStartBtn.addEventListener('click', startDashGame);
dashHomeBtn.addEventListener('click', () => showScreen('homeScreen'));
placePlayer();

/* =========================
   COIN CLICKER
========================= */

const clickerScoreEl = document.getElementById('clickerScore');
const clickerTimeEl = document.getElementById('clickerTime');
const clickerStartBtn = document.getElementById('clickerStartBtn');
const clickerHomeBtn = document.getElementById('clickerHomeBtn');
const coinButton = document.getElementById('coinButton');
const clickerMessage = document.getElementById('clickerMessage');

let clickerScore = 0;
let clickerTime = 15;
let clickerInterval = null;
let clickerRunning = false;

function resetClicker() {
  if (clickerInterval) clearInterval(clickerInterval);
  clickerScore = 0;
  clickerTime = 15;
  clickerRunning = false;
  clickerScoreEl.textContent = clickerScore;
  clickerTimeEl.textContent = clickerTime;
  clickerMessage.textContent = 'Press Start Game';
  coinButton.disabled = true;
}

function startClickerGame() {
  resetClicker();
  clickerRunning = true;
  coinButton.disabled = false;
  clickerMessage.textContent = 'Click the coin fast!';

  clickerInterval = setInterval(() => {
    clickerTime -= 1;
    clickerTimeEl.textContent = clickerTime;

    if (clickerTime <= 0) {
      clearInterval(clickerInterval);
      clickerRunning = false;
      coinButton.disabled = true;
      clickerMessage.textContent = `Time up! Final Score: ${clickerScore}`;
    }
  }, 1000);
}

clickerStartBtn.addEventListener('click', startClickerGame);

coinButton.addEventListener('click', () => {
  if (!clickerRunning) return;
  clickerScore += 1;
  clickerScoreEl.textContent = clickerScore;
});

clickerHomeBtn.addEventListener('click', () => showScreen('homeScreen'));

/* =========================
   MEMORY MATCH
========================= */

const memoryBoard = document.getElementById('memoryBoard');
const memoryMovesEl = document.getElementById('memoryMoves');
const memoryStartBtn = document.getElementById('memoryStartBtn');
const memoryHomeBtn = document.getElementById('memoryHomeBtn');
const memoryMessage = document.getElementById('memoryMessage');

const memorySymbols = ['⚡', '⚡', '🎮', '🎮', '🚀', '🚀', '🪙', '🪙'];
let memoryCards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let memoryMoves = 0;
let matchedPairs = 0;

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function resetMemoryGame() {
  memoryBoard.innerHTML = '';
  memoryCards = shuffleArray([...memorySymbols]);
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  memoryMoves = 0;
  matchedPairs = 0;
  memoryMovesEl.textContent = memoryMoves;
  memoryMessage.textContent = 'Match all pairs';

  memoryCards.forEach(symbol => {
    const button = document.createElement('button');
    button.className = 'memory-card';
    button.dataset.symbol = symbol;
    button.textContent = '?';

    button.addEventListener('click', () => handleMemoryCardClick(button));
    memoryBoard.appendChild(button);
  });
}

function handleMemoryCardClick(card) {
  if (lockBoard) return;
  if (card.classList.contains('revealed') || card.classList.contains('matched')) return;

  card.classList.add('revealed');
  card.textContent = card.dataset.symbol;

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  memoryMoves += 1;
  memoryMovesEl.textContent = memoryMoves;

  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.remove('revealed');
    secondCard.classList.remove('revealed');
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    firstCard = null;
    secondCard = null;
    lockBoard = false;
    matchedPairs += 1;

    if (matchedPairs === memorySymbols.length / 2) {
      memoryMessage.textContent = `You won in ${memoryMoves} moves!`;
    }
  } else {
    setTimeout(() => {
      firstCard.classList.remove('revealed');
      secondCard.classList.remove('revealed');
      firstCard.textContent = '?';
      secondCard.textContent = '?';
      firstCard = null;
      secondCard = null;
      lockBoard = false;
    }, 800);
  }
}

memoryStartBtn.addEventListener('click', resetMemoryGame);
memoryHomeBtn.addEventListener('click', () => showScreen('homeScreen'));

/* =========================
   SNAKE
========================= */

const snakeCanvas = document.getElementById('snakeCanvas');
const snakeCtx = snakeCanvas.getContext('2d');
const snakeScoreEl = document.getElementById('snakeScore');
const snakeBestEl = document.getElementById('snakeBest');
const snakeStartBtn = document.getElementById('snakeStartBtn');
const snakeHomeBtn = document.getElementById('snakeHomeBtn');
const snakeMessage = document.getElementById('snakeMessage');

const snakeGridSize = 20;
const snakeTileCount = snakeCanvas.width / snakeGridSize;

let snake = [];
let snakeFood = { x: 10, y: 10 };
let snakeDx = 1;
let snakeDy = 0;
let snakeScore = 0;
let snakeBest = Number(localStorage.getItem('veerajSnakeBest')) || 0;
let snakeLoopId = null;
let snakeRunning = false;

snakeBestEl.textContent = snakeBest;

function drawSnakeBoard() {
  snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  snakeCtx.fillStyle = 'rgba(255,255,255,0.03)';
  snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  snakeCtx.fillStyle = '#ffd166';
  snakeCtx.beginPath();
  snakeCtx.arc(
    snakeFood.x * snakeGridSize + snakeGridSize / 2,
    snakeFood.y * snakeGridSize + snakeGridSize / 2,
    snakeGridSize / 2.8,
    0,
    Math.PI * 2
  );
  snakeCtx.fill();

  snake.forEach((segment, index) => {
    snakeCtx.fillStyle = index === 0 ? '#67e8f9' : '#a78bfa';
    snakeCtx.fillRect(
      segment.x * snakeGridSize + 2,
      segment.y * snakeGridSize + 2,
      snakeGridSize - 4,
      snakeGridSize - 4
    );
  });
}

function placeSnakeFood() {
  let valid = false;

  while (!valid) {
    snakeFood = {
      x: Math.floor(Math.random() * snakeTileCount),
      y: Math.floor(Math.random() * snakeTileCount)
    };

    valid = !snake.some(segment => segment.x === snakeFood.x && segment.y === snakeFood.y);
  }
}

function resetSnakeGame() {
  stopSnakeGame();

  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];

  snakeDx = 1;
  snakeDy = 0;
  snakeScore = 0;
  snakeScoreEl.textContent = snakeScore;
  snakeMessage.textContent = 'Use arrow keys to move';
  placeSnakeFood();
  drawSnakeBoard();
}

function stopSnakeGame() {
  snakeRunning = false;
  if (snakeLoopId) clearInterval(snakeLoopId);
  snakeLoopId = null;
}

function moveSnake() {
  const head = {
    x: snake[0].x + snakeDx,
    y: snake[0].y + snakeDy
  };

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= snakeTileCount ||
    head.y >= snakeTileCount ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    endSnakeGame();
    return;
  }

  snake.unshift(head);

  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snakeScore += 10;
    snakeScoreEl.textContent = snakeScore;
    placeSnakeFood();
  } else {
    snake.pop();
  }

  drawSnakeBoard();
}

function startSnakeGame() {
  showScreen('snakeScreen');
  resetSnakeGame();
  snakeRunning = true;
  snakeMessage.textContent = 'Snake is running';

  snakeLoopId = setInterval(moveSnake, 120);
}

function endSnakeGame() {
  stopSnakeGame();

  if (snakeScore > snakeBest) {
    snakeBest = snakeScore;
    localStorage.setItem('veerajSnakeBest', String(snakeBest));
    snakeBestEl.textContent = snakeBest;
  }

  snakeMessage.textContent = `Game over! Final Score: ${snakeScore}`;
}

snakeStartBtn.addEventListener('click', startSnakeGame);
snakeHomeBtn.addEventListener('click', () => showScreen('homeScreen'));

/* =========================
   KEYBOARD
========================= */

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (document.getElementById('dashScreen').classList.contains('active-screen')) {
    if (key === 'arrowup' || key === 'w') playerState.dy = -playerState.speed;
    if (key === 'arrowdown' || key === 's') playerState.dy = playerState.speed;
    if (key === 'arrowleft' || key === 'a') playerState.dx = -playerState.speed;
    if (key === 'arrowright' || key === 'd') playerState.dx = playerState.speed;
  }

  if (document.getElementById('snakeScreen').classList.contains('active-screen') && snakeRunning) {
    if (key === 'arrowup' && snakeDy !== 1) {
      snakeDx = 0;
      snakeDy = -1;
    } else if (key === 'arrowdown' && snakeDy !== -1) {
      snakeDx = 0;
      snakeDy = 1;
    } else if (key === 'arrowleft' && snakeDx !== 1) {
      snakeDx = -1;
      snakeDy = 0;
    } else if (key === 'arrowright' && snakeDx !== -1) {
      snakeDx = 1;
      snakeDy = 0;
    }
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();

  if (document.getElementById('dashScreen').classList.contains('active-screen')) {
    if (key === 'arrowup' || key === 'w' || key === 'arrowdown' || key === 's') {
      playerState.dy = 0;
    }
    if (key === 'arrowleft' || key === 'a' || key === 'arrowright' || key === 'd') {
      playerState.dx = 0;
    }
  }
});

resetClicker();
resetMemoryGame();
resetSnakeGame();
showScreen('homeScreen');
