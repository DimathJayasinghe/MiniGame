const box = document.getElementById("Box");
const container = document.getElementById("continer");
const scoreDisplay = document.getElementById("score");
const startScreen = document.getElementById("startScreen");
const gameOverDisplay = document.getElementById("gameOverDisplay");
const finalScore = document.getElementById("finalScore");
let position = {
  top: window.innerHeight - 120,
  left: window.innerWidth / 2 - 50,
};
const step = 10;
const keyPressed = {};
let animationId = null;
let obstacles = [];
let goodItems = [];
let score = 0;
let gameSpeed = 3;
let gameActive = false;
let gameStarted = false;

const bgAudio = document.getElementById("bgAudio");
const explosionAudio = document.getElementById("explosionAudio");
const collectAudio = document.getElementById("collectAudio");
explosionAudio.load();
collectAudio.load();

position.top = parseInt(box.style.top) || window.innerHeight - 170;
position.left = parseInt(box.style.left) || window.innerWidth / 2 - 75;
box.style.top = position.top + "px";
box.style.left = position.left + "px";

function updatePosition() {
  let moved = false;
  if (keyPressed["ArrowUp"]) {
    position.top -= step;
    moved = true;
  } else if (keyPressed["ArrowDown"]) {
    position.top += step;
    moved = true;
  }

  if (keyPressed["ArrowLeft"]) {
    position.left -= step;
    moved = true;
  } else if (keyPressed["ArrowRight"]) {
    position.left += step;
    moved = true;
  }

  if (position.top < 0) position.top = 0;
  if (position.left < 0) position.left = 0;
  if (position.left > container.offsetWidth - box.offsetWidth)
    position.left = container.offsetWidth - box.offsetWidth;
  if (position.top > window.innerHeight - box.offsetHeight)
    position.top = window.innerHeight - box.offsetHeight;

  box.style.top = position.top + "px";
  box.style.left = position.left + "px";

  if (moved) {
    animationId = requestAnimationFrame(updatePosition);
  } else {
    animationId = null;
  }
}

document.addEventListener("keydown", (event) => {
  if (!gameStarted && event.key === "ArrowUp") {
    startGame();
  }

  if (!gameActive) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    keyPressed[event.key] = true;

    if (animationId === null) {
      animationId = requestAnimationFrame(updatePosition);
    }
  }
});

document.addEventListener("keyup", (event) => {
  if (!gameActive) return;
  delete keyPressed[event.key];

  if (
    !Object.keys(keyPressed).some((key) =>
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)
    )
  ) {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
});

function startGame() {
  gameStarted = true;
  gameActive = true;

  score = 0;
  gameSpeed = 3;
  scoreDisplay.textContent = "Score: 0";

  obstacles.forEach((obstacle) => container.removeChild(obstacle.element));
  goodItems.forEach((item) => container.removeChild(item.element));
  obstacles = [];
  goodItems = [];

  position.top = window.innerHeight - 170;
  position.left = window.innerWidth / 2 - 75;
  box.style.top = position.top + "px";
  box.style.left = position.left + "px";

  setTimeout(createObstacle, 1000);
  setTimeout(createGoodItem, 2000);
  setInterval(() => {
    if (gameActive) {
      gameSpeed += 0.01;
    }
  }, 1000);

  requestAnimationFrame(gameLoop);

  bgAudio.play().catch((e) => console.log("Audio play failed:", e));
}

function createObstacle() {
  if (!gameActive) return;

  const obstacle = document.createElement("div");
  obstacle.className = "obstacle";

  const obstacleWidth = 200;
  const maxLeft = window.innerWidth - obstacleWidth;
  const left = Math.random() * maxLeft;

  obstacle.style.left = left + "px";
  obstacle.style.top = "-50px";
  container.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    left: left,
    top: -50,
  });

  setTimeout(createObstacle, Math.random() * 1500 + 500);
}

function createGoodItem() {
  if (!gameActive) return;

  const goodItem = document.createElement("div");
  goodItem.className = "goodItem";

  const goodItemWidth = 150;
  const maxLeft = window.innerWidth - goodItemWidth;
  const left = Math.random() * maxLeft;

  goodItem.style.left = left + "px";
  goodItem.style.top = "-40px";
  container.appendChild(goodItem);
  goodItems.push({
    element: goodItem,
    left: left,
    top: -40,
  });

  setTimeout(createGoodItem, Math.random() * 2000 + 1000);
}

function gameLoop() {
  if (!gameActive) return;
  startScreen.style.display = "none";
  gameOverDisplay.style.display = "none";
  scoreDisplay.style.display = "block";
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.top += gameSpeed;
    obstacle.element.style.top = obstacle.top + "px";

    if (obstacle.top > window.innerHeight) {
      container.removeChild(obstacle.element);
      obstacles.splice(i, 1);
      continue;
    }

    if (checkCollision(obstacle, box)) {
      gameActive = false;

      Object.keys(keyPressed).forEach((key) => delete keyPressed[key]);

      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }

      bgAudio.pause();
      explosionAudio.currentTime = 0;
      explosionAudio
        .play()
        .catch((e) => console.log("Explosion audio failed:", e));

      const boxRect = box.getBoundingClientRect();
      const centerX = (boxRect.left + boxRect.right) / 2;
      const centerY = (boxRect.top + boxRect.bottom) / 2;
      showExplosion(centerX, centerY);

      finalScore.textContent = score;
      setTimeout(() => {
        gameOverDisplay.style.display = "block";
        scoreDisplay.style.display = "none";
      }, 100);

      return;
    }
  }

  for (let i = goodItems.length - 1; i >= 0; i--) {
    const item = goodItems[i];
    item.top += gameSpeed;
    item.element.style.top = item.top + "px";

    if (item.top > window.innerHeight) {
      container.removeChild(item.element);
      goodItems.splice(i, 1);
      continue;
    }

    if (checkCollision(item, box)) {
      container.removeChild(item.element);
      goodItems.splice(i, 1);
      score += 10;
      scoreDisplay.textContent = "Score: " + score;
      collectAudio.currentTime = 0;
      collectAudio.play();
      if (score % 50 === 0) {
        gameSpeed += 0.02;
      }
    }
  }

  requestAnimationFrame(gameLoop);
}

function checkCollision(element1, element2) {
  const rect1 = element1.element.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  const circle1 = {
    x: rect1.left + rect1.width / 2,
    y: rect1.top + rect1.height / 2,
    radius: rect1.width / 2,
  };

  const circle2 = {
    x: rect2.left + rect2.width / 2,
    y: rect2.top + rect2.height / 2,
    radius: rect2.width / 2,
  };

  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < circle1.radius + circle2.radius - 70;
}

function showExplosion(x, y) {
  const explosion = document.createElement("div");
  explosion.className = "explosion";
  explosion.style.left = x - 75 + "px";
  explosion.style.top = y - 75 + "px";
  container.appendChild(explosion);

  setTimeout(() => {
    container.removeChild(explosion);
  }, 3000);
}

document.addEventListener("keydown", (event) => {
  if (!gameActive && gameStarted && event.key === "ArrowUp") {
    startGame();
  }
});
