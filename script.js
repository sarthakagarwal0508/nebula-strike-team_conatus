const player = document.getElementById("player");
const gameArea = document.querySelector(".game-area");

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOver = document.getElementById("game-over");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

let playerX = 50;
const playerSpeed = 2;


// Start Game
startBtn.addEventListener("click", function() {
    startScreen.style.display = "none";
    gameScreen.style.display = "flex";
    gameOver.style.display = "none";
});


// Player Movement
document.addEventListener("keydown", function(event) {

    if (event.key === "ArrowLeft" || event.key === "a") {
        playerX -= playerSpeed;
    }

    if (event.key === "ArrowRight" || event.key === "d") {
        playerX += playerSpeed;
    }

    if (playerX < 5) {
        playerX = 5;
    }

    if (playerX > 95) {
        playerX = 95;
    }

    player.style.left = playerX + "%";
});


// Restart Game
restartBtn.addEventListener("click", function() {
    gameOver.style.display = "none";
    gameScreen.style.display = "flex";

    playerX = 50;
    player.style.left = playerX + "%";
});