const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const livesEl = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const overlay = document.getElementById('overlay');

let gameRunning = false;
let animationId = null;
let spawnInterval = null;
let coinInterval = null;

let score = 0;
let lives = 3;
let bestScore = Number(localStorage.getItem('neonDashBest')) || 0;

const enemies = [];
let coin = null;

const playerState = {
  x: 80,
  y: 80,
  size: 34,
  speed: 7,
  dx: 0,
  dy: 0
};

bestScoreEl.textContent = bestScore;
scoreEl.textContent = score;
livesEl.textContent = lives;

function getAreaWidth() {
  return gameArea.clientWidth;
}

function getAreaHeight() {
  return gameArea.clientHeight;
}

function placePlayer() {
  player.style.left = `${playerState.x}px`;
  player.style.top = `${playerState.y}px`;
}

function clearEnemies() {
  enemies.forEach(enemy => enemy.el.remove());
  enemies.length = 0;
}

function clearCoin() {
  if (coin && coin.el) {
    coin.el.remove();
  }
  coin = null;
}

function stopGameLoops() {
  if (animationId) cancelAnimationFrame(animationId);
  if (spawnInterval) clearInterval(spawnInterval);
  if (coinInterval) clearInterval(coinInterval);

  animationId = null;
  spawnInterval = null;
  coinInterval = null;
}

function resetGame() {
  stopGameLoops();

  gameRunning = false;
  score = 0;
  lives = 3;

  playerState.x = 80;
  playerState.y = 80;
  playerState.dx = 0;
  playerState.dy = 0;

  scoreEl.textContent = score;
  livesEl.textContent = lives;

  clearEnemies();
  clearCoin();
  placePlayer();

  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div class="overlay-card glass-inner">
      <h3>Ready?</h3>
      <p>Collect coins. Avoid red blocks.</p>
      <p class="tiny">Arrow keys / WASD to move</p>
    </div>
  `;
}

function spawnEnemy() {
  if (!gameRunning) return;

  const el = document.createElement('div');
  el.className = 'enemy';

  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * (getAreaWidth() - 30);
    y = -30;
  } else if (side === 1) {
    x = getAreaWidth();
    y = Math.random() * (getAreaHeight() - 30);
  } else if (side === 2) {
    x = Math.random() * (getAreaWidth() - 30);
    y = getAreaHeight();
  } else {
    x = -30;
    y = Math.random() * (getAreaHeight() - 30);
  }

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  gameArea.appendChild(el);

  enemies.push({
    el,
    x,
    y,
    size: 30,
    speed: 1.8 + Math.min(score * 0.03, 3)
  });
}

function spawnCoin() {
  if (!gameRunning || coin) return;

  const el = document.createElement('div');
  el.className = 'coin';

  const x = Math.random() * (getAreaWidth() - 22);
  const y = Math.random() * (getAreaHeight() - 22);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  gameArea.appendChild(el);

  coin = {
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

function updatePlayer() {
  playerState.x += playerState.dx;
  playerState.y += playerState.dy;

  if (playerState.x < 0) playerState.x = 0;
  if (playerState.y < 0) playerState.y = 0;
  if (playerState.x > getAreaWidth() - playerState.size) {
    playerState.x = getAreaWidth() - playerState.size;
  }
  if (playerState.y > getAreaHeight() - playerState.size) {
    playerState.y = getAreaHeight() - playerState.size;
  }

  placePlayer();
}

function updateEnemies() {
  enemies.forEach(enemy => {
    const angle = Math.atan2(playerState.y - enemy.y, playerState.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed;
    enemy.y += Math.sin(angle) * enemy.speed;

    enemy.el.style.left = `${enemy.x}px`;
    enemy.el.style.top = `${enemy.y}px`;
  });
}

function checkCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (isColliding(playerState, enemies[i])) {
      enemies[i].el.remove();
      enemies.splice(i, 1);

      lives -= 1;
      livesEl.textContent = lives;

      if (lives <= 0) {
        endGame();
        return;
      }
    }
  }

  if (coin && isColliding(playerState, coin)) {
    coin.el.remove();
    coin = null;
    score += 10;
    scoreEl.textContent = score;
  }
}

function gameLoop() {
  if (!gameRunning) return;

  updatePlayer();
  updateEnemies();
  checkCollisions();

  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  resetGame();

  gameRunning = true;
  overlay.classList.add('hidden');

  spawnEnemy();
  spawnCoin();

  spawnInterval = setInterval(spawnEnemy, 1500);
  coinInterval = setInterval(() => {
    if (!coin) spawnCoin();
  }, 2000);

  gameLoop();
}

function endGame() {
  gameRunning = false;
  stopGameLoops();

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('neonDashBest', bestScore);
    bestScoreEl.textContent = bestScore;
  }

  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div class="overlay-card glass-inner">
      <h3>Game Over</h3>
      <p>Final Score: ${score}</p>
      <p class="tiny">Press Start Game to play again</p>
    </div>
  `;
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'arrowup' || key === 'w') playerState.dy = -playerState.speed;
  if (key === 'arrowdown' || key === 's') playerState.dy = playerState.speed;
  if (key === 'arrowleft' || key === 'a') playerState.dx = -playerState.speed;
  if (key === 'arrowright' || key === 'd') playerState.dx = playerState.speed;
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'arrowup' || key === 'w' || key === 'arrowdown' || key === 's') {
    playerState.dy = 0;
  }

  if (key === 'arrowleft' || key === 'a' || key === 'arrowright' || key === 'd') {
    playerState.dx = 0;
  }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

placePlayer();
