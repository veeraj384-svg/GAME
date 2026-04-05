const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const livesEl = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const overlay = document.getElementById('overlay');

const areaWidth = () => gameArea.clientWidth;
const areaHeight = () => gameArea.clientHeight;

let gameRunning = false;
let animationId = null;
let spawnInterval = null;
let coinInterval = null;
let score = 0;
let lives = 3;
let bestScore = Number(localStorage.getItem('neonDashBest')) || 0;

const playerState = {
  x: 80,
  y: 80,
  size: 34,
  speed: 7,
  dx: 0,
  dy: 0,
};

const enemies = [];
let coin = null;

bestScoreEl.textContent = bestScore;

function placePlayer() {
  player.style.left = `${playerState.x}px`;
  player.style.top = `${playerState.y}px`;
}

function resetGame() {
  cancelAnimationFrame(animationId);
  clearInterval(spawnInterval);
  clearInterval(coinInterval);
  gameRunning = false;
  score = 0;
  lives = 3;
  playerState.x = 80;
  playerState.y = 80;
  playerState.dx = 0;
  playerState.dy = 0;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  enemies.forEach(enemy => enemy.el.remove());
  enemies.length = 0;
  if (coin?.el) coin.el.remove();
placePlayer();
