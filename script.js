const player = document.getElementById("player");
const gameArea = document.getElementById("game-area");

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over");
const victoryScreen = document.getElementById("victory-screen");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const winScore = document.getElementById("win-score");
const winRestartBtn = document.getElementById("win-restart-btn");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const pauseScreen = document.getElementById("pause-screen");

const scoreUI = document.getElementById("score");
const waveUI = document.getElementById("wave");
const livesUI = document.getElementById("lives");
const comboUI = document.getElementById("combo");
const enemyCountUI = document.getElementById("enemy-count");

const energyFill = document.getElementById("energy-fill");
const energyValue = document.getElementById("energy-value");
const shieldFill = document.getElementById("shield-fill");
const shieldValue = document.getElementById("shield-value");
const empStatus = document.getElementById("emp-status");
const empEffect = document.getElementById("emp-effect");

const missionLabel = document.getElementById("mission-label");
const missionText = document.getElementById("mission-text");
const missionProgress = document.getElementById("mission-progress");

const finalScore = document.getElementById("final-score");
const finalWave = document.getElementById("final-wave");

const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const fireBtn = document.getElementById("fire-btn");
const mobileEmpBtn = document.getElementById("mobile-emp-btn");

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
    waveKills: 0,
    waveTarget: 10,
    rapidFire: false,
    rapidFireTimer: 0,
    bossMode: false
};

const waveTargets = { 1: 10, 2: 15, 3: 20, 4: 25 };
const playerSpeed = 0.75;
const bulletSpeed = 1.8;
const normalShotDelay = 100;
const bossShotDelay = 100;
const rapidShotDelay = 75;
const shotCost = 2;
const maxEnergy = 100;
const maxShield = 100;
const rapidFireDuration = 5000;

let fireTimer = null;

function startGame() {
    stopFiring();

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
    state.waveKills = 0;
    state.waveTarget = 10;
    state.rapidFire = false;
    state.rapidFireTimer = 0;
    state.bossMode = false;
    state.keys.Space = false;

    clearBullets();

    player.style.left = "50%";
    pauseScreen.style.display = "none";
    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    victoryScreen.style.display = "none";
    gameScreen.style.display = "flex";

    if (
        window.NebulaGame &&
        typeof window.NebulaGame.resetEnemySystem === "function"
    ) {
        window.NebulaGame.resetEnemySystem();
    }

    if (
        window.NebulaAudio &&
        typeof window.NebulaAudio.startMusic === "function"
    ) {
        window.NebulaAudio.startMusic();
    }

    updateMission();
    updateUI();
}

function togglePause() {
    if (!state.running) return;

    state.paused = !state.paused;

    if (state.paused) {
        stopFiring();
        state.keys.Space = false;
    }

    pauseScreen.style.display = state.paused ? "flex" : "none";
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
winRestartBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
resumeBtn.addEventListener("click", togglePause);

document.addEventListener("keydown", function(event) {
    const key = event.key.toLowerCase();
    state.keys[key] = true;

    if (key === "enter" && !state.running) {
        startGame();
        return;
    }

    if (key === "p") {
        togglePause();
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();

        if (!state.paused && state.running) {
            state.keys.Space = true;
            startFiring();
        }
    }

    if (key === "e" && !state.paused) {
        useEMP();
    }
});

document.addEventListener("keyup", function(event) {
    const key = event.key.toLowerCase();
    state.keys[key] = false;

    if (event.code === "Space") {
        state.keys.Space = false;
        stopFiring();
    }
});

// MOBILE CONTROLS
function mobileHold(button, key) {
    if (!button) return;

    button.addEventListener("touchstart", function(event) {
        event.preventDefault();
        state.keys[key] = true;
    }, { passive: false });

    button.addEventListener("touchend", function(event) {
        event.preventDefault();
        state.keys[key] = false;
    }, { passive: false });

    button.addEventListener("touchcancel", function() {
        state.keys[key] = false;
    });
}

mobileHold(leftBtn, "arrowleft");
mobileHold(rightBtn, "arrowright");

if (fireBtn) {
    fireBtn.addEventListener("touchstart", function(event) {
        event.preventDefault();

        if (!state.running || state.paused) return;

        state.keys.Space = true;
        startFiring();
    }, { passive: false });

    fireBtn.addEventListener("touchend", function(event) {
        event.preventDefault();
        state.keys.Space = false;
        stopFiring();
    }, { passive: false });

    fireBtn.addEventListener("touchcancel", function() {
        state.keys.Space = false;
        stopFiring();
    });
}

if (mobileEmpBtn) {
    mobileEmpBtn.addEventListener("touchstart", function(event) {
        event.preventDefault();
        useEMP();
    }, { passive: false });
}

function startFiring() {
    if (fireTimer) return;

    shoot();

    fireTimer = setInterval(function() {
        if (!state.running || state.paused || !state.keys.Space) {
            stopFiring();
            return;
        }

        shoot();
    }, 100);
}

function stopFiring() {
    if (fireTimer) {
        clearInterval(fireTimer);
        fireTimer = null;
    }
}

function updatePlayer() {
    if (!state.running || state.paused) return;

    if (state.keys["arrowleft"] || state.keys["a"])
        state.playerX -= playerSpeed;

    if (state.keys["arrowright"] || state.keys["d"])
        state.playerX += playerSpeed;

    state.playerX = Math.max(5, Math.min(95, state.playerX));
    player.style.left = state.playerX + "%";
}

function shoot() {
    if (!state.running || state.paused) return;

    const now = Date.now();
    let delay = normalShotDelay;

    if (state.bossMode)
        delay = bossShotDelay;

    if (state.rapidFire)
        delay = rapidShotDelay;

    if (now - state.lastShot < delay || state.energy < shotCost)
        return;

    state.lastShot = now;
    state.energy -= shotCost;

    if (window.NebulaAudio)
        window.NebulaAudio.play("shoot", 0.25);

    const positions = state.bossMode ? [-3.5, 0, 3.5] : [0];

    positions.forEach(function(offset) {
        const bulletElement = document.createElement("div");

        bulletElement.className = "bullet";
        bulletElement.style.left = (state.playerX + offset) + "%";
        bulletElement.style.bottom = "75px";

        if (state.bossMode)
            bulletElement.style.height = "22px";

        gameArea.appendChild(bulletElement);

        state.bullets.push({
            element: bulletElement,
            x: state.playerX + offset,
            y: 88,
            damage: 1
        });
    });

    updateUI();
}

function updateBullets() {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];

        bullet.y -= bulletSpeed;
        bullet.element.style.left = bullet.x + "%";
        bullet.element.style.top = bullet.y + "%";

        if (bullet.y < -5)
            removeBullet(bullet);
    }
}

function removeBullet(bullet) {
    if (bullet.element.parentNode)
        bullet.element.remove();

    const index = state.bullets.indexOf(bullet);

    if (index !== -1)
        state.bullets.splice(index, 1);
}

function clearBullets() {
    state.bullets.forEach(function(bullet) {
        if (bullet.element.parentNode)
            bullet.element.remove();
    });

    state.bullets = [];
}

function regenerateEnergy() {
    if (!state.running || state.paused) return;

    state.energy = Math.min(
        maxEnergy,
        state.energy + (state.bossMode ? 0.45 : 0.35)
    );

    updateEnergyUI();
}

function updateEnergyUI() {
    const value = Math.round(state.energy);

    energyFill.style.width = value + "%";
    energyValue.textContent = value + "%";
}

function useEMP() {
    if (!state.running || state.paused || !state.empReady)
        return;

    state.empReady = false;
    empStatus.textContent = "RECHARGING...";

    if (window.NebulaAudio)
        window.NebulaAudio.play("emp", 0.4);

    empEffect.classList.remove("active");
    void empEffect.offsetWidth;
    empEffect.classList.add("active");

    window.dispatchEvent(new CustomEvent("nebula-emp"));

    setTimeout(function() {
        state.empReady = true;

        if (!state.paused)
            empStatus.textContent = "READY [E]";
    }, 6000);
}

function damagePlayer(amount) {
    if (!state.running) return;

    if (window.NebulaAudio)
        window.NebulaAudio.play("hit", 0.3);

    if (state.shield > 0) {
        state.shield -= amount * 12;

        if (state.shield < 0)
            state.shield = 0;
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

    if (state.lives <= 0)
        endGame();
}

function regenerateShield() {
    if (!state.running || state.paused) return;

    state.shield = Math.min(
        maxShield,
        state.shield + (state.bossMode ? 0.08 : 0.05)
    );

    shieldFill.style.width = state.shield + "%";
    shieldValue.textContent = Math.round(state.shield) + "%";
}

function addScore(amount) {
    state.score += amount * state.combo;
    updateScoreUI();
}

function registerEnemyKill(points) {
    state.waveKills++;

    if (state.waveKills % 5 === 0)
        state.combo++;

    addScore(points);
    updateMission();
}

function updateScoreUI() {
    scoreUI.textContent = state.score;
    comboUI.textContent = "x" + state.combo;
}

function setWave(wave) {
    state.wave = wave;
    state.waveKills = 0;
    state.waveTarget = waveTargets[wave] || 25;
    state.bossMode = wave >= 5;

    waveUI.textContent = wave;
    updateMission();
}

function updateMission() {
    if (state.wave >= 5) {
        missionLabel.textContent = "FINAL OBJECTIVE";
        missionText.textContent = "DEFEAT THE BOSS";
        missionProgress.textContent = "BOSS";
        return;
    }

    missionLabel.textContent =
        "WAVE " + state.wave + " OBJECTIVE";

    missionText.textContent =
        "Destroy " + state.waveTarget + " enemies";

    missionProgress.textContent =
        state.waveKills + " / " + state.waveTarget;
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
    state.bossMode = false;
    state.keys.Space = false;

    stopFiring();
    clearBullets();

    if (window.NebulaAudio) {
        window.NebulaAudio.stopMusic();
        window.NebulaAudio.play("game-over", 0.45);
    }

    finalScore.textContent = state.score;
    finalWave.textContent = state.wave;

    gameScreen.style.display = "none";
    pauseScreen.style.display = "none";
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

    empStatus.textContent =
        state.empReady ? "READY [E]" : "RECHARGING...";

    updateMission();
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
        return state.bullets.map(function(bullet) {
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
        });
    },

    isRunning: function() {
        return state.running;
    },

    isPaused: function() {
        return state.paused;
    },

    setWave: function(wave) {
        setWave(wave);
    },

    setBossMode: function(active) {
        state.bossMode = active;
        updateUI();
    },

    collectPowerUp: function(type) {
        if (window.NebulaAudio)
            window.NebulaAudio.play("powerup", 0.4);

        if (type === "energy") {
            state.energy = Math.min(
                maxEnergy,
                state.energy + 35
            );
        }

        if (type === "shield") {
            state.shield = Math.min(
                maxShield,
                state.shield + 40
            );
        }

        if (type === "rapid") {
            state.rapidFire = true;
            state.rapidFireTimer = rapidFireDuration;
        }

        if (type === "emp")
            state.empReady = true;

        updateUI();
    },

    resetEnemySystem: function() {
        if (typeof window.resetEnemySystem === "function")
            window.resetEnemySystem();
    },

    winGame: function() {
        state.running = false;
        state.paused = false;
        state.bossMode = false;
        state.keys.Space = false;

        stopFiring();
        clearBullets();

        if (window.NebulaAudio) {
            window.NebulaAudio.stopMusic();
            window.NebulaAudio.play("victory", 0.45);
        }

        winScore.textContent = state.score;
        gameScreen.style.display = "none";
        pauseScreen.style.display = "none";
        victoryScreen.style.display = "flex";
    }
};

function gameLoop() {
    if (state.running && !state.paused) {
        updatePlayer();
        updateBullets();
        regenerateEnergy();
        regenerateShield();
        updateRapidFire();
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();