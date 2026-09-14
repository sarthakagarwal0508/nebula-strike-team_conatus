const player = document.getElementById("player");
const gameArea = document.getElementById("game-area");

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const pauseScreen = document.getElementById("pause-screen");

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
    paused: false,

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
    missionTarget: 10,

    rapidFire: false,
    rapidFireTimer: 0
};


const playerSpeed = 0.75;
const bulletSpeed = 1.8;

const normalShotDelay = 180;
const rapidShotDelay = 70;

const shotCost = 4;

const maxEnergy = 100;
const maxShield = 100;

const rapidFireDuration = 5000;


function startGame() {

    state.running = true;
    state.paused = false;

    state.playerX = 50;

    state.score = 0;
    state.wave = 1;
    state.lives = 3;
    state.combo = 1;

    state.energy = 100;
    state.shield = 100;

    state.empReady = true;

    state.lastShot = 0;

    state.missionKills = 0;
    state.missionTarget = 10;

    state.rapidFire = false;
    state.rapidFireTimer = 0;

    clearBullets();

    if (
        window.NebulaGame &&
        typeof window.NebulaGame.resetEnemySystem === "function"
    ) {
        window.NebulaGame.resetEnemySystem();
    }

    player.style.left = "50%";

    pauseScreen.style.display = "none";

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    gameScreen.style.display = "flex";

    updateUI();
}


startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);


function togglePause() {

    if (!state.running) return;

    state.paused = !state.paused;

    if (state.paused) {

        pauseScreen.style.display = "flex";

    } else {

        pauseScreen.style.display = "none";
    }
}


pauseBtn.addEventListener("click", togglePause);
resumeBtn.addEventListener("click", togglePause);


document.addEventListener("keydown", function(event) {

    const key = event.key.toLowerCase();

    state.keys[key] = true;


    if (key === "p") {

        togglePause();
        return;
    }


    if (event.code === "Space") {

        event.preventDefault();

        if (!state.paused) {
            shoot();
        }
    }


    if (key === "e") {

        if (!state.paused) {
            useEMP();
        }
    }
});


document.addEventListener("keyup", function(event) {

    const key = event.key.toLowerCase();

    state.keys[key] = false;
});


function updatePlayer() {

    if (!state.running || state.paused) return;


    if (
        state.keys["arrowleft"] ||
        state.keys["a"]
    ) {
        state.playerX -= playerSpeed;
    }


    if (
        state.keys["arrowright"] ||
        state.keys["d"]
    ) {
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

    if (!state.running || state.paused) return;


    const now = Date.now();

    let shotDelay = normalShotDelay;


    if (state.rapidFire) {
        shotDelay = rapidShotDelay;
    }


    if (now - state.lastShot < shotDelay) {
        return;
    }


    if (state.energy < shotCost) {
        return;
    }


    state.lastShot = now;

    state.energy -= shotCost;


    const bulletElement = document.createElement("div");

    bulletElement.className = "bullet";

    bulletElement.style.left =
        state.playerX + "%";

    bulletElement.style.bottom =
        "75px";


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

    for (
        let i = state.bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = state.bullets[i];

        bullet.y -= bulletSpeed;


        bullet.element.style.left =
            bullet.x + "%";

        bullet.element.style.top =
            bullet.y + "%";


        if (bullet.y < -5) {
            removeBullet(bullet);
        }
    }
}


function removeBullet(bullet) {

    if (bullet.element.parentNode) {
        bullet.element.remove();
    }


    const index =
        state.bullets.indexOf(bullet);


    if (index !== -1) {
        state.bullets.splice(index, 1);
    }
}


function clearBullets() {

    state.bullets.forEach(function(bullet) {

        if (bullet.element.parentNode) {
            bullet.element.remove();
        }

    });


    state.bullets = [];
}


function regenerateEnergy() {

    if (!state.running || state.paused) return;


    if (state.energy < maxEnergy) {

        state.energy += 0.10;
    }


    if (state.energy > maxEnergy) {

        state.energy = maxEnergy;
    }


    updateEnergyUI();
}


function updateEnergyUI() {

    const value =
        Math.round(state.energy);


    energyFill.style.width =
        value + "%";

    energyValue.textContent =
        value + "%";
}


function useEMP() {

    if (!state.running || state.paused) return;

    if (!state.empReady) return;


    state.empReady = false;

    empStatus.textContent =
        "RECHARGING...";


    empEffect.classList.remove("active");

    void empEffect.offsetWidth;

    empEffect.classList.add("active");


    window.dispatchEvent(
        new CustomEvent("nebula-emp")
    );


    setTimeout(function() {

        state.empReady = true;

        if (!state.paused) {
            empStatus.textContent = "READY [E]";
        }

    }, 6000);
}


function damagePlayer(amount) {

    if (!state.running) return;


    if (state.shield > 0) {

        state.shield -= amount * 14;


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

    if (!state.running || state.paused) return;


    if (state.shield < maxShield) {

        state.shield += 0.06;
    }


    if (state.shield > maxShield) {

        state.shield = maxShield;
    }


    shieldFill.style.width =
        state.shield + "%";

    shieldValue.textContent =
        Math.round(state.shield) + "%";
}


function addScore(amount) {

    state.score +=
        amount * state.combo;


    updateScoreUI();
}


function registerEnemyKill(points) {

    state.missionKills++;


    if (
        state.missionKills % 5 === 0
    ) {
        state.combo++;
    }


    addScore(points);

    updateMissionUI();
}


function updateScoreUI() {

    scoreUI.textContent =
        state.score;

    comboUI.textContent =
        "x" + state.combo;
}


function updateMissionUI() {

    missionProgress.textContent =
        state.missionKills +
        " / " +
        state.missionTarget;


    if (
        state.missionKills >=
        state.missionTarget
    ) {

        state.score += 1000;

        state.missionKills = 0;

        state.missionTarget += 10;


        missionText.textContent =
            "Destroy " +
            state.missionTarget +
            " enemies";


        updateScoreUI();
    }
}


function setWave(wave) {

    state.wave = wave;

    waveUI.textContent =
        wave;
}


function updateRapidFire() {

    if (!state.rapidFire) return;

    state.rapidFireTimer -= 16.67;


    if (state.rapidFireTimer <= 0) {

        state.rapidFire = false;

        state.rapidFireTimer = 0;
    }
}


function endGame() {

    state.running = false;
    state.paused = false;

    state.rapidFire = false;
    state.rapidFireTimer = 0;

    clearBullets();


    finalScore.textContent =
        state.score;

    finalWave.textContent =
        state.wave;


    gameScreen.style.display =
        "none";

    pauseScreen.style.display =
        "none";

    gameOverScreen.style.display =
        "flex";
}


function updateUI() {

    scoreUI.textContent =
        state.score;

    waveUI.textContent =
        state.wave;

    livesUI.textContent =
        state.lives;

    comboUI.textContent =
        "x" + state.combo;


    updateEnergyUI();


    shieldFill.style.width =
        state.shield + "%";

    shieldValue.textContent =
        Math.round(state.shield) + "%";


    if (state.empReady) {

        empStatus.textContent =
            "READY [E]";

    } else {

        empStatus.textContent =
            "RECHARGING...";
    }


    updateMissionUI();
}


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

        return state.bullets.map(
            function(bullet) {

                return {

                    x: bullet.x,

                    y: bullet.y,

                    damage: bullet.damage,

                    hit: function() {
                        removeBullet(bullet);
                    },

                    destroy: function() {
                        removeBullet(bullet);
                    }
                };
            }
        );
    },


    isRunning: function() {

        return state.running;
    },


    isPaused: function() {

        return state.paused;
    },


    collectPowerUp: function(type) {

        if (type === "energy") {

            state.energy =
                Math.min(
                    maxEnergy,
                    state.energy + 35
                );
        }


        if (type === "shield") {

            state.shield =
                Math.min(
                    maxShield,
                    state.shield + 40
                );
        }


        if (type === "rapid") {

            state.rapidFire = true;

            state.rapidFireTimer =
                rapidFireDuration;
        }


        if (type === "emp") {

            state.empReady = true;

            empStatus.textContent =
                "READY [E]";
        }


        updateUI();
    },


    setWave: function(wave) {

        setWave(wave);
    },


    resetEnemySystem: function() {

        if (
            typeof window.resetEnemySystem ===
            "function"
        ) {

            window.resetEnemySystem();
        }
    },


    winGame: function() {

        endGame();
    }
};


function gameLoop() {

    if (
        state.running &&
        !state.paused
    ) {

        updatePlayer();

        updateBullets();

        regenerateEnergy();

        regenerateShield();

        updateRapidFire();
    }


    requestAnimationFrame(gameLoop);
}


gameLoop();