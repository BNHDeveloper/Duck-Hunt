// Easy Code DZ — Duck Hunt
// The game uses simple DOM elements and vanilla JavaScript.

const gameArea = document.querySelector("#game-area");
const duck = document.querySelector("#duck");
const scoreDisplay = document.querySelector("#score");
const roundDisplay = document.querySelector("#round");
const ammoDisplay = document.querySelector("#ammo");
const timeDisplay = document.querySelector("#time");
const statusDisplay = document.querySelector("#status");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startButton = document.querySelector("#start-btn");
const crosshair = document.querySelector("#crosshair");
const hitFlash = document.querySelector("#hit-flash");

const ROUND_SECONDS = 30;
const STARTING_AMMO = 10;
const POINTS_PER_HIT = 100;

let score = 0;
let round = 1;
let ammo = STARTING_AMMO;
let timeLeft = ROUND_SECONDS;
let gameRunning = false;
let timerId = null;
let moveId = null;
let duckX = 0;
let duckY = 0;
let velocityX = 2.2;
let velocityY = 1.3;
let lastFrame = 0;

// Place the duck at a random position inside the game field.
function placeDuck() {
  const maxX = Math.max(0, gameArea.clientWidth - duck.offsetWidth);
  const maxY = Math.max(0, gameArea.clientHeight * 0.72 - duck.offsetHeight);
  duckX = Math.random() * maxX;
  duckY = Math.random() * maxY;
  duck.style.left = `${duckX}px`;
  duck.style.top = `${duckY}px`;

  // Randomize its flight direction and speed.
  velocityX = (Math.random() > 0.5 ? 1 : -1) * (1.7 + Math.random() * 1.6 + round * 0.25);
  velocityY = (Math.random() > 0.5 ? 1 : -1) * (0.7 + Math.random() * 1.2 + round * 0.12);
  duck.classList.toggle("fly-left", velocityX < 0);
}

// Move the duck and bounce it off the game area's edges.
function animateDuck(timestamp) {
  if (!gameRunning) return;

  if (!lastFrame) lastFrame = timestamp;
  const delta = Math.min((timestamp - lastFrame) / 16.67, 2);
  lastFrame = timestamp;

  const maxX = Math.max(0, gameArea.clientWidth - duck.offsetWidth);
  const maxY = Math.max(0, gameArea.clientHeight * 0.72 - duck.offsetHeight);

  duckX += velocityX * delta;
  duckY += velocityY * delta;

  if (duckX <= 0 || duckX >= maxX) {
    velocityX *= -1;
    duckX = Math.max(0, Math.min(duckX, maxX));
    duck.classList.toggle("fly-left", velocityX < 0);
  }
  if (duckY <= 0 || duckY >= maxY) {
    velocityY *= -1;
    duckY = Math.max(0, Math.min(duckY, maxY));
  }

  duck.style.left = `${duckX}px`;
  duck.style.top = `${duckY}px`;
  moveId = requestAnimationFrame(animateDuck);
}

function updateHUD() {
  scoreDisplay.textContent = String(score).padStart(4, "0");
  roundDisplay.textContent = String(round).padStart(2, "0");
  ammoDisplay.textContent = String(ammo).padStart(2, "0");
  timeDisplay.textContent = String(timeLeft).padStart(2, "0");
}

function startGame() {
  stopLoops();
  score = 0;
  round = 1;
  ammo = STARTING_AMMO;
  timeLeft = ROUND_SECONDS;
  gameRunning = true;
  lastFrame = 0;

  updateHUD();
  overlay.classList.add("hidden");
  duck.hidden = false;
  placeDuck();
  statusDisplay.textContent = "Good luck! Click the duck to score.";
  moveId = requestAnimationFrame(animateDuck);
  timerId = window.setInterval(tick, 1000);
}

function tick() {
  if (!gameRunning) return;
  timeLeft -= 1;
  updateHUD();

  if (timeLeft <= 0) {
    endGame("TIME'S UP!");
  }
}

function shoot(event) {
  if (!gameRunning) return;

  // Position the crosshair and hit marker where the player clicked.
  const bounds = gameArea.getBoundingClientRect();
  const clickX = event.clientX - bounds.left;
  const clickY = event.clientY - bounds.top;
  crosshair.style.left = `${clickX}px`;
  crosshair.style.top = `${clickY}px`;
  crosshair.style.display = "block";

  ammo -= 1;

  const duckBounds = duck.getBoundingClientRect();
  const hit = event.clientX >= duckBounds.left &&
    event.clientX <= duckBounds.right &&
    event.clientY >= duckBounds.top &&
    event.clientY <= duckBounds.bottom;

  if (hit) {
    score += POINTS_PER_HIT;
    statusDisplay.textContent = `Direct hit! +${POINTS_PER_HIT} points.`;
    hitFlash.style.left = `${clickX}px`;
    hitFlash.style.top = `${clickY}px`;
    hitFlash.classList.remove("show");
    // Force a style recalculation so the flash animation can replay.
    void hitFlash.offsetWidth;
    hitFlash.classList.add("show");
    placeDuck();
  } else {
    statusDisplay.textContent = "Missed! Make every shot count.";
  }

  updateHUD();

  if (ammo <= 0) {
    endGame("OUT OF AMMO!");
  }
}

function endGame(title) {
  if (!gameRunning) return;
  gameRunning = false;
  stopLoops();
  duck.hidden = true;
  crosshair.style.display = "none";

  overlayTitle.textContent = title;
  overlayText.textContent = `Final score: ${score}. You reached round ${round}. Press play again to try for a better score.`;
  startButton.innerHTML = 'Play again <span>↻</span>';
  overlay.classList.remove("hidden");
  statusDisplay.textContent = "Game over. Start again when you're ready.";
}

function stopLoops() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
  if (moveId !== null) {
    cancelAnimationFrame(moveId);
    moveId = null;
  }
}

gameArea.addEventListener("click", shoot);

gameArea.addEventListener("mousemove", (event) => {
  if (!gameRunning) return;
  const bounds = gameArea.getBoundingClientRect();
  crosshair.style.left = `${event.clientX - bounds.left}px`;
  crosshair.style.top = `${event.clientY - bounds.top}px`;
  crosshair.style.display = "block";
});

gameArea.addEventListener("mouseleave", () => {
  crosshair.style.display = "none";
});

startButton.addEventListener("click", (event) => {
  event.stopPropagation();
  startGame();
});

// Keep the duck inside the board when the browser window changes size.
window.addEventListener("resize", () => {
  if (!gameRunning) return;
  duckX = Math.min(duckX, gameArea.clientWidth - duck.offsetWidth);
  duckY = Math.min(duckY, gameArea.clientHeight * 0.72 - duck.offsetHeight);
  duck.style.left = `${Math.max(0, duckX)}px`;
  duck.style.top = `${Math.max(0, duckY)}px`;
});

updateHUD();
