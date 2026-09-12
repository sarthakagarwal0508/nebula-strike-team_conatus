const player = document.getElementById("player");
const gameArea = document.getElementById("game-area");

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

const scoreUI = document.getElementById("score");
const waveUI = document.getElementById("wave");
const livesUI = document.getElementById("lives");
const comboUI = document.getElementById("combo");

const energyFill = document.getElementById("energy-fill");
const energyValue = document.getElementById("energy-value");

const shieldFill = document.getElementById("shield-fill");
const shieldValue = document.getElementById("shield-value");

const empStatus = document.getElementById("emp-status");
const empEffect = document.getElementById("emp-effect");

const missionProgress = document.getElementById("mission-progress");
const missionText = document.getElementById("mission-text");

const finalScore = document.getElementById("final-score");
const finalWave = document.getElementById("final-wave");


const state = {
    running: false,
    playerX: 50,
    score: 0,
    wave: 1,
    lives: 3,
    combo: 1,
    energy: 100,
    shield: 100,
    empReady: true,
    lastShot: 0,
    bullets: [],
    keys: {},
    missionKills: 0,
    missionTarget: 10
};

const playerSpeed = 0.75;
const bulletSpeed = 1.8;
const shotCost = 4;
const maxEnergy = 100;
const maxShield = 100;


function startGame() {
    state.running = true;
    state.playerX = 50;
    state.score = 0;
    state.wave = 1;
    state.lives = 3;
    state.combo = 1;
    state.energy = 100;
    state.shield = 100;
    state.empReady = true;
    state.missionKills = 0;
    state.missionTarget = 10;

    clearBullets();

    player.style.left = "50%";

    updateUI();

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    gameScreen.style.display = "flex";
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);


document.addEventListener("keydown", function(event) {

    state.keys[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
        event.preventDefault();
        shoot();
    }

    if (event.key.toLowerCase() === "e") {
        useEMP();
    }
});

document.addEventListener("keyup", function(event) {
    state.keys[event.key.toLowerCase()] = false;
});


function updatePlayer() {

    if (!state.running) return;

    if (state.keys["arrowleft"] || state.keys["a"]) {
        state.playerX -= playerSpeed;
    }

    if (state.keys["arrowright"] || state.keys["d"]) {
        state.playerX += playerSpeed;
    }

    if (state.playerX < 5) {
        state.playerX = 5;
    }

    if (state.playerX > 95) {
        state.playerX = 95;
    }

    player.style.left = state.playerX + "%";
}


function shoot() {

    if (!state.running) return;

    let now = Date.now();

    if (now - state.lastShot < 180) return;

    if (state.energy < shotCost) return;

    state.lastShot = now;
    state.energy -= shotCost;

    let bulletElement = document.createElement("div");

    bulletElement.className = "bullet";
    bulletElement.style.left = state.playerX + "%";
    bulletElement.style.bottom = "75px";

    gameArea.appendChild(bulletElement);

    state.bullets.push({
        element: bulletElement,
        x: state.playerX,
        y: 88,
        damage: 1
    });

    updateUI();
}


function updateBullets() {

    for (let i = state.bullets.length - 1; i >= 0; i--) {

        let bullet = state.bullets[i];

        bullet.y -= bulletSpeed;

        bullet.element.style.left = bullet.x + "%";
        bullet.element.style.top = bullet.y + "%";

        if (bullet.y < -5) {
            removeBullet(bullet);
        }
    }
}


function removeBullet(bullet) {

    if (bullet.element.parentNode) {
        bullet.element.remove();
    }

    let index = state.bullets.indexOf(bullet);

    if (index !== -1) {
        state.bullets.splice(index, 1);
    }
}


function clearBullets() {

    state.bullets.forEach(function(bullet) {
        bullet.element.remove();
    });

    state.bullets = [];
}


function regenerateEnergy() {

    if (!state.running) return;

    if (state.energy < maxEnergy) {
        state.energy += 0.08;
    }

    if (state.energy > maxEnergy) {
        state.energy = maxEnergy;
    }

    updateEnergyUI();
}


function updateEnergyUI() {

    let value = Math.round(state.energy);

    energyFill.style.width = value + "%";
    energyValue.textContent = value + "%";
}


function useEMP() {

    if (!state.running || !state.empReady) return;

    state.empReady = false;
    empStatus.textContent = "RECHARGING...";

    empEffect.classList.remove("active");

    void empEffect.offsetWidth;

    empEffect.classList.add("active");

    window.dispatchEvent(new CustomEvent("nebula-emp"));

    setTimeout(function() {

        state.empReady = true;
        empStatus.textContent = "READY [E]";

    }, 6000);
}


function damagePlayer(amount) {

    if (!state.running) return;

    if (state.shield > 0) {

        state.shield -= amount * 20;

        if (state.shield < 0) {
            state.shield = 0;
        }

    } else {
        loseLife();
    }

    player.classList.remove("player-damaged");
    void player.offsetWidth;
    player.classList.add("player-damaged");

    state.combo = 1;

    updateUI();
}


function loseLife() {

    state.lives--;
    state.shield = maxShield;

    if (state.lives <= 0) {
        endGame();
    }
}


function regenerateShield() {

    if (!state.running) return;

    if (state.shield < maxShield) {
        state.shield += 0.03;
    }

    if (state.shield > maxShield) {
        state.shield = maxShield;
    }

    shieldFill.style.width = state.shield + "%";
    shieldValue.textContent = Math.round(state.shield) + "%";
}


function addScore(amount) {

    state.score += amount * state.combo;

    updateScoreUI();
}


function registerEnemyKill(points) {

    state.missionKills++;

    if (state.missionKills % 5 === 0) {
        state.combo++;
    }

    addScore(points);
    updateMissionUI();
}


function updateScoreUI() {

    scoreUI.textContent = state.score;
    comboUI.textContent = "x" + state.combo;
}


function updateMissionUI() {

    missionProgress.textContent =
        state.missionKills + " / " + state.missionTarget;

    if (state.missionKills >= state.missionTarget) {

        state.score += 1000;

        state.missionKills = 0;
        state.missionTarget += 10;

        missionText.textContent =
            "Destroy " + state.missionTarget + " enemies";

        updateScoreUI();
    }
}


function setWave(wave) {

    state.wave = wave;
    waveUI.textContent = wave;
}


function endGame() {

    state.running = false;

    clearBullets();

    finalScore.textContent = state.score;
    finalWave.textContent = state.wave;

    gameScreen.style.display = "none";
    gameOverScreen.style.display = "flex";
}


function updateUI() {

    scoreUI.textContent = state.score;
    waveUI.textContent = state.wave;
    livesUI.textContent = state.lives;
    comboUI.textContent = "x" + state.combo;

    updateEnergyUI();

    shieldFill.style.width = state.shield + "%";
    shieldValue.textContent = Math.round(state.shield) + "%";

    if (state.empReady) {
        empStatus.textContent = "READY [E]";
    } else {
        empStatus.textContent = "RECHARGING...";
    }

    updateMissionUI();
}


/* Connection with Ishan's enemy code */

window.NebulaGame = {

    getPlayerPosition: function() {
        return {
            x: state.playerX,
            y: 88
        };
    },

    damagePlayer: function(amount) {
        damagePlayer(amount);
    },

    addScore: function(amount) {
        addScore(amount);
    },

    registerEnemyKill: function(points) {
        registerEnemyKill(points);
    },

    getPlayerBullets: function() {

        return state.bullets.map(function(bullet) {

            return {
                x: bullet.x,
                y: bullet.y,
                damage: bullet.damage,

                destroy: function() {
                    removeBullet(bullet);
                }
            };

        });
    },

    isRunning: function() {
        return state.running;
    },

    collectPowerUp: function(type) {

        if (type === "energy") {
            state.energy = Math.min(100, state.energy + 35);
        }

        if (type === "shield") {
            state.shield = Math.min(100, state.shield + 40);
        }

        if (type === "rapid") {
            state.lastShot = 0;
        }

        if (type === "emp") {
            state.empReady = true;
            empStatus.textContent = "READY [E]";
        }

        updateUI();
    }
};


function gameLoop() {

    if (state.running) {

        updatePlayer();
        updateBullets();
        regenerateEnergy();
        regenerateShield();

    }

    requestAnimationFrame(gameLoop);
}

gameLoop();