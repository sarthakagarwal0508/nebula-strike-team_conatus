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

// 2. GAME STATE

const state = {

    // Is the game currently running?
    running: false,

    // Player horizontal position
    playerX: 50,

    // Main game information
    score: 0,
    wave: 1,
    lives: 3,
    combo: 1,

    // Energy
    energy: 100,

    // Shield
    shield: 100,

    // EMP
    empReady: true,

    // Shooting
    lastShot: 0,

    // Player bullets
    bullets: [],

    // Keyboard keys currently being pressed
    keys: {},

    // Mission
    missionKills: 0,
    missionTarget: 10,

    // Rapid fire power-up
    rapidFire: false,
    rapidFireTimer: 0
};
// 3. CONSTANTS

const playerSpeed = 0.75;

const bulletSpeed = 1.8;

const normalShotDelay = 180;

const rapidShotDelay = 70;

const shotCost = 4;

const maxEnergy = 100;

const maxShield = 100;

const rapidFireDuration = 5000;

// 4. START GAME

function startGame() {

    // Start the game
    state.running = true;

    // Reset player
    state.playerX = 50;

    // Reset score
    state.score = 0;

    // Reset wave
    state.wave = 1;

    // Reset lives
    state.lives = 3;

    // Reset combo
    state.combo = 1;

    // Reset energy
    state.energy = 100;

    // Reset shield
    state.shield = 100;

    // Reset EMP
    state.empReady = true;

    // Reset mission
    state.missionKills = 0;
    state.missionTarget = 10;

    // Reset rapid fire
    state.rapidFire = false;
    state.rapidFireTimer = 0;

    // Remove old player bullets
    clearBullets();

    // Reset enemy system

    if (
        window.NebulaGame &&
        typeof window.NebulaGame.resetEnemySystem === "function"
    ) {

        window.NebulaGame.resetEnemySystem();

    }

    // Put player in the middle
    player.style.left = "50%";


    // Update all UI
    updateUI();


    // Show game screen
    startScreen.style.display = "none";

    gameOverScreen.style.display = "none";

    gameScreen.style.display = "flex";
}


// Start button
startBtn.addEventListener("click", startGame);


// Restart button
restartBtn.addEventListener("click", startGame);

// 5. KEYBOARD CONTROLS

document.addEventListener("keydown", function(event) {

    // Convert the key to lowercase
    const key = event.key.toLowerCase();

    // Remember that this key is being pressed
    state.keys[key] = true;

    // SPACE = SHOOT

    if (event.code === "Space") {

        event.preventDefault();

        shoot();

    }

    // E = EMP
    
    if (key === "e") {

        useEMP();

    }
});


document.addEventListener("keyup", function(event) {

    const key = event.key.toLowerCase();

    // Key is no longer being pressed
    state.keys[key] = false;

});

// 6. PLAYER MOVEMENT


function updatePlayer() {

    // Don't move if game isn't running
    if (!state.running) return;


    // Move left
    if (
        state.keys["arrowleft"] ||
        state.keys["a"]
    ) {

        state.playerX -= playerSpeed;

    }

    // Move right
    if (
        state.keys["arrowright"] ||
        state.keys["d"]
    ) {

        state.playerX += playerSpeed;
    }

    // Don't allow player to leave left side
    if (state.playerX < 5) {

        state.playerX = 5;
    }

    // Don't allow player to leave right side
    if (state.playerX > 95) {

        state.playerX = 95;
    }

    // Apply position to HTML element
    player.style.left = state.playerX + "%";
}

// 7. PLAYER SHOOTING
function shoot() {

    // Can't shoot if game isn't running
    if (!state.running) return;


    // Get current time
    const now = Date.now();

    // RAPID FIRE

    let shotDelay = normalShotDelay;

    if (state.rapidFire) {

        shotDelay = rapidShotDelay;

    }
    // Prevent shooting too quickly
    if (now - state.lastShot < shotDelay) {

        return;

    }
    // Not enough energy
    if (state.energy < shotCost) {

        return;

    }

    // Remember shooting time
    state.lastShot = now;


    // Use energy
    state.energy -= shotCost;

    // CREATE BULLET HTML

    const bulletElement = document.createElement("div");

    bulletElement.className = "bullet";

    bulletElement.style.left =
        state.playerX + "%";

    bulletElement.style.bottom =
        "75px";


    // Put bullet inside game area
    gameArea.appendChild(bulletElement);

    // SAVE BULLET DATA

    state.bullets.push({

        element: bulletElement,

        x: state.playerX,

        y: 88,

        damage: 1

    });

    // Update energy display
    updateUI();
}

// 8. UPDATE PLAYER BULLETS

function updateBullets() {

    // Go backwards through the array
    // This makes deleting bullets safer.
    for (
        let i = state.bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = state.bullets[i];


        // Move bullet upward
        bullet.y -= bulletSpeed;


        // Update bullet position
        bullet.element.style.left =
            bullet.x + "%";

        bullet.element.style.top =
            bullet.y + "%";


        // Remove bullet if it leaves screen
        if (bullet.y < -5) {

            removeBullet(bullet);

        }

    }
}

// 9. REMOVE ONE BULLET

function removeBullet(bullet) {

    // Remove HTML element
    if (bullet.element.parentNode) {

        bullet.element.remove();

    }

    // Find bullet inside array
    const index =
        state.bullets.indexOf(bullet);


    // Remove from array
    if (index !== -1) {

        state.bullets.splice(index, 1);

    }
}

// 10. REMOVE ALL PLAYER BULLETS
function clearBullets() {

    state.bullets.forEach(function(bullet) {

        if (bullet.element.parentNode) {

            bullet.element.remove();

        }

    });
    // Empty array
    state.bullets = [];
}

// 11. ENERGY REGENERATION

function regenerateEnergy() {

    if (!state.running) return;


    // Slowly regenerate energy
    if (state.energy < maxEnergy) {

        state.energy += 0.08;

    }
    // Prevent energy from going above maximum
    if (state.energy > maxEnergy) {

        state.energy = maxEnergy;

    }

    // Update energy UI
    updateEnergyUI();
}
// 12. ENERGY UI
function updateEnergyUI() {

    const value = Math.round(state.energy);


    // Change bar width
    energyFill.style.width =
        value + "%";


    // Change text
    energyValue.textContent =
        value + "%";
}

// 13. EMP ABILITY

function useEMP() {

    // Can't use EMP if game isn't running
    if (!state.running) return;


    // Can't use EMP while recharging
    if (!state.empReady) return;


    // EMP is now unavailable
    state.empReady = false;


    // Change UI
    empStatus.textContent =
        "RECHARGING...";


    // Restart EMP animation
    empEffect.classList.remove("active");

    void empEffect.offsetWidth;

    empEffect.classList.add("active");


    // Tell enemy system that EMP happened
    window.dispatchEvent(
        new CustomEvent("nebula-emp")
    );


    // Recharge after 6 seconds
    setTimeout(function() {

        state.empReady = true;

        empStatus.textContent =
            "READY [E]";

    }, 6000);
}

// 14. PLAYER DAMAGE

function damagePlayer(amount) {

    // Ignore damage when game isn't running
    if (!state.running) return;

    // SHIELD TAKES DAMAGE FIRST

    if (state.shield > 0) {

        state.shield -= amount * 20;


        // Prevent negative shield
        if (state.shield < 0) {

            state.shield = 0;

        }
    }

    // IF SHIELD IS ALREADY ZERO

    else {

        loseLife();

    }

    // Damage animation
    player.classList.remove(
        "player-damaged"
    );

    void player.offsetWidth;

    player.classList.add(
        "player-damaged"
    );


    // Getting hit resets combo
    state.combo = 1;


    // Update interface
    updateUI();
}

// 15. LOSE LIFE

function loseLife() {

    state.lives--;

    // Give player a fresh shield
    state.shield = maxShield;


    // If no lives remain
    if (state.lives <= 0) {

        endGame();

    }
}

// 16. SHIELD REGENERATION
function regenerateShield() {

    if (!state.running) return;


    // Slowly regenerate shield
    if (state.shield < maxShield) {

        state.shield += 0.03;

    }

    // Prevent shield from going above maximum
    if (state.shield > maxShield) {

        state.shield = maxShield;

    }

    // Update shield UI
    shieldFill.style.width =
        state.shield + "%";

    shieldValue.textContent =
        Math.round(state.shield) + "%";
}

// 17. SCORE

function addScore(amount) {

    // Combo multiplies score
    state.score +=
        amount * state.combo;


    // Update score UI
    updateScoreUI();
}

// 18. REGISTER ENEMY KILL

function registerEnemyKill(points) {

    // Count enemy kill for mission
    state.missionKills++;


    // Every 5 kills increases combo
    if (state.missionKills % 5 === 0) {

        state.combo++;

    }

    // Give score
    addScore(points);


    // Update mission
    updateMissionUI();
}

// 19. SCORE UI

function updateScoreUI() {

    scoreUI.textContent =
        state.score;

    comboUI.textContent =
        "x" + state.combo;
}

// 20. MISSION

function updateMissionUI() {

    missionProgress.textContent =
        state.missionKills +
        " / " +
        state.missionTarget;


    // Mission completed
    if (
        state.missionKills >=
        state.missionTarget
    ) {

        // Bonus score
        state.score += 1000;


        // Start next mission
        state.missionKills = 0;

        state.missionTarget += 10;


        // Update mission text
        missionText.textContent =
            "Destroy " +
            state.missionTarget +
            " enemies";


        // Update score
        updateScoreUI();

    }
}

// 21. WAVE
function setWave(wave) {

    state.wave = wave;

    waveUI.textContent =
        wave;
}

// 22. RAPID FIRE UPDATE
function updateRapidFire() {

    // Rapid fire isn't active
    if (!state.rapidFire) return;


    // Reduce timer
    state.rapidFireTimer -= 16.67;


    // Rapid fire finished
    if (state.rapidFireTimer <= 0) {

        state.rapidFire = false;

        state.rapidFireTimer = 0;

    }
}

// 23. GAME OVER

function endGame() {

    // Stop game
    state.running = false;


    // Stop rapid fire
    state.rapidFire = false;

    state.rapidFireTimer = 0;


    // Remove player bullets
    clearBullets();


    // Show final statistics
    finalScore.textContent =
        state.score;

    finalWave.textContent =
        state.wave;


    // Hide game
    gameScreen.style.display =
        "none";


    // Show game over
    gameOverScreen.style.display =
        "flex";
}

// 24. UPDATE ALL UI
function updateUI() {

    // Score
    scoreUI.textContent =
        state.score;


    // Wave
    waveUI.textContent =
        state.wave;


    // Lives
    livesUI.textContent =
        state.lives;


    // Combo
    comboUI.textContent =
        "x" + state.combo;


    // Energy
    updateEnergyUI();


    // Shield
    shieldFill.style.width =
        state.shield + "%";

    shieldValue.textContent =
        Math.round(state.shield) + "%";


    // EMP
    if (state.empReady) {

        empStatus.textContent =
            "READY [E]";

    }
    else {

        empStatus.textContent =
            "RECHARGING...";

    }


    // Mission
    updateMissionUI();
}
// 25. CONNECTION WITH ISHAN'S ENEMY SYSTEM

window.NebulaGame = {

    // PLAYER POSITION

    getPlayerPosition: function() {

        return {

            x: state.playerX,

            y: 88

        };

    },

    // DAMAGE PLAYER
    damagePlayer: function(amount) {

        damagePlayer(amount);

    },

    // ADD SCORE

    addScore: function(amount) {

        addScore(amount);

    },

    // REGISTER ENEMY KILL
    registerEnemyKill: function(points) {

        registerEnemyKill(points);

    },

    // GET PLAYER BULLETS

    getPlayerBullets: function() {

        return state.bullets.map(
            function(bullet) {

                return {

                    x: bullet.x,

                    y: bullet.y,

                    damage: bullet.damage,


                    // New function used by enemy system
                    hit: function() {

                        removeBullet(bullet);

                    },


                    // Keep destroy as an alias
                    destroy: function() {

                        removeBullet(bullet);

                    }

                };

            }
        );

    },

    // CHECK IF GAME IS RUNNING
    isRunning: function() {

        return state.running;

    },

    // COLLECT POWER-UP

    collectPowerUp: function(type) {


        // ENERGY POWER-UP
        if (type === "energy") {

            state.energy =
                Math.min(
                    maxEnergy,
                    state.energy + 35
                );

        }


        // SHIELD POWER-UP
        if (type === "shield") {

            state.shield =
                Math.min(
                    maxShield,
                    state.shield + 40
                );

        }


        // RAPID FIRE POWER-UP
        if (type === "rapid") {

            state.rapidFire = true;

            state.rapidFireTimer =
                rapidFireDuration;

        }


        // EMP POWER-UP
        if (type === "emp") {

            state.empReady = true;

            empStatus.textContent =
                "READY [E]";

        }


        // Update interface
        updateUI();

    },

    // SET WAVE

    setWave: function(wave) {

        setWave(wave);

    },

    // WIN GAME
    winGame: function() {

        // Stop game
        state.running = false;


        // Remove player bullets
        clearBullets();


        // Stop rapid fire
        state.rapidFire = false;

        state.rapidFireTimer = 0;

        alert(
            "BOSS DEFEATED!\n\nYOU WIN!"
        );

    },

    // RESET ENEMY SYSTEM
    resetEnemySystem: function() {

        if (
            typeof window.resetEnemySystem ===
            "function"
        ) {

            window.resetEnemySystem();
        }
    }
};

// 26. MAIN PLAYER GAME LOOP
function gameLoop() {

    // Only update gameplay while running
    if (state.running) {

        // Move player
        updatePlayer();


        // Move player bullets
        updateBullets();


        // Regenerate energy
        regenerateEnergy();


        // Regenerate shield
        regenerateShield();


        // Update rapid fire timer
        updateRapidFire();

    }


    // Ask browser to run this again
    requestAnimationFrame(gameLoop);
}

// 27. START MAIN LOOP

gameLoop();
