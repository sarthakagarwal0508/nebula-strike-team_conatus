/*
    NEBULA STRIKE - ISHAN ENEMY MODULE

    Ownership:
    - Enemy spawning and movement
    - Enemy types
    - Enemy bullets
    - Waves
    - Boss
    - Power-ups

    Integration rule:
    This module does NOT create or control Sarthak's player.
    It only reads the player position and calls optional hooks.

    Expected hooks from Sarthak:
        window.NebulaGame.getPlayerPosition()
        window.NebulaGame.damagePlayer(amount)
        window.NebulaGame.addScore(amount)
        window.NebulaGame.getPlayerBullets()
        window.NebulaGame.isRunning()

    If those hooks are not present, this file still runs in demo mode.
*/

const enemyGameArea = document.getElementById("game-area");
const enemyCountUI = document.getElementById("enemy-count");
const waveUI = document.getElementById("wave");
const scoreUI = document.getElementById("score");
const bossHUD = document.getElementById("boss-hud");
const bossFill = document.getElementById("boss-fill");

const enemyState = {
    enemies: [],
    bullets: [],
    powerUps: [],
    boss: null,
    wave: 1,
    score: 0,
    spawnTimer: 0,
    waveTimer: 0,
    bossActive: false,
    running: true
};

const enemyTypes = {
    drone: {
        emoji: "👾",
        hp: 1,
        speed: 1.4,
        points: 100,
        shoot: false
    },
    shooter: {
        emoji: "🛸",
        hp: 2,
        speed: 0.8,
        points: 200,
        shoot: true
    },
    chaser: {
        emoji: "👹",
        hp: 2,
        speed: 1.1,
        points: 300,
        shoot: false
    },
    tank: {
        emoji: "☄️",
        hp: 5,
        speed: 0.45,
        points: 500,
        shoot: true
    }
};

function getPlayerPosition() {
    if (window.NebulaGame && typeof window.NebulaGame.getPlayerPosition === "function") {
        return window.NebulaGame.getPlayerPosition();
    }

    const player = document.getElementById("player");
    if (!player) return { x: 50, y: 85 };

    return {
        x: parseFloat(player.style.left) || 50,
        y: 85
    };
}

function damagePlayer(amount) {
    if (window.NebulaGame && typeof window.NebulaGame.damagePlayer === "function") {
        window.NebulaGame.damagePlayer(amount);
    }
}

function addScore(amount) {
    enemyState.score += amount;

    if (window.NebulaGame && typeof window.NebulaGame.addScore === "function") {
        window.NebulaGame.addScore(amount);
    } else if (scoreUI) {
        scoreUI.textContent = enemyState.score;
    }
}

function isGameRunning() {
    if (window.NebulaGame && typeof window.NebulaGame.isRunning === "function") {
        return window.NebulaGame.isRunning();
    }

    return enemyState.running;
}

function showWaveMessage(text) {
    let message = document.querySelector(".wave-message");

    if (!message) {
        message = document.createElement("div");
        message.className = "wave-message";
        enemyGameArea.appendChild(message);
    }

    message.textContent = text;
    message.classList.add("show");

    setTimeout(() => message.classList.remove("show"), 1200);
}

function createEnemy(type) {
    const data = enemyTypes[type];
    if (!data) return;

    const element = document.createElement("div");
    element.className = "enemy enemy-" + type;
    element.textContent = data.emoji;

    const x = Math.random() * 90 + 5;
    const y = -8;

    element.style.left = x + "%";
    element.style.top = y + "%";

    enemyGameArea.appendChild(element);

    enemyState.enemies.push({
        element,
        type,
        x,
        y,
        hp: data.hp,
        speed: data.speed,
        points: data.points,
        shootCooldown: 80 + Math.random() * 100
    });
}

function chooseEnemyType() {
    const wave = enemyState.wave;
    const choices = ["drone"];

    if (wave >= 2) choices.push("shooter");
    if (wave >= 3) choices.push("chaser");
    if (wave >= 4) choices.push("tank");

    return choices[Math.floor(Math.random() * choices.length)];
}

function spawnEnemies() {
    const amount = Math.min(1 + Math.floor(enemyState.wave / 2), 4);

    for (let i = 0; i < amount; i++) {
        createEnemy(chooseEnemyType());
    }
}

function createEnemyBullet(enemy) {
    const bullet = document.createElement("div");
    bullet.className = "enemy-bullet";

    bullet.style.left = enemy.x + "%";
    bullet.style.top = (enemy.y + 5) + "%";

    enemyGameArea.appendChild(bullet);

    enemyState.bullets.push({
        element: bullet,
        x: enemy.x,
        y: enemy.y + 5,
        speed: 1.3 + enemyState.wave * 0.05,
        damage: 1
    });
}

function updateEnemies() {
    const player = getPlayerPosition();

    enemyState.enemies.forEach((enemy) => {
        enemy.y += enemy.speed;

        if (enemy.type === "chaser") {
            enemy.x += (player.x - enemy.x) * 0.008;
        } else if (enemy.type === "shooter" || enemy.type === "tank") {
            enemy.x += Math.sin(enemy.y * 0.08) * 0.08;
        }

        enemy.x = Math.max(3, Math.min(97, enemy.x));

        enemy.element.style.left = enemy.x + "%";
        enemy.element.style.top = enemy.y + "%";

        if (enemy.shootCooldown > 0) {
            enemy.shootCooldown--;
        }

        if (
            enemyTypes[enemy.type].shoot &&
            enemy.shootCooldown <= 0 &&
            enemy.y > 5 &&
            enemy.y < 65
        ) {
            createEnemyBullet(enemy);
            enemy.shootCooldown = Math.max(45, 150 - enemyState.wave * 8);
        }

        if (enemy.y > 92) {
            damagePlayer(1);
            removeEnemy(enemy, false);
        }
    });
}

function updateEnemyBullets() {
    const player = getPlayerPosition();

    enemyState.bullets.forEach((bullet) => {
        bullet.y += bullet.speed;

        bullet.element.style.left = bullet.x + "%";
        bullet.element.style.top = bullet.y + "%";

        const dx = Math.abs(bullet.x - player.x);
        const dy = Math.abs(bullet.y - player.y);

        if (dx < 4 && dy < 6) {
            damagePlayer(bullet.damage);
            removeBullet(bullet);
        } else if (bullet.y > 105) {
            removeBullet(bullet);
        }
    });
}

function removeEnemy(enemy, reward = true) {
    if (!enemy.element.parentNode) return;

    enemy.element.remove();

    const index = enemyState.enemies.indexOf(enemy);
    if (index !== -1) enemyState.enemies.splice(index, 1);

    if (reward) {
        addScore(enemy.points);

        if (Math.random() < 0.16) {
            createPowerUp(enemy.x, enemy.y);
        }
    }
}

function removeBullet(bullet) {
    if (bullet.element.parentNode) {
        bullet.element.remove();
    }

    const index = enemyState.bullets.indexOf(bullet);
    if (index !== -1) enemyState.bullets.splice(index, 1);
}

function damageEnemy(enemy, amount = 1) {
    enemy.hp -= amount;

    enemy.element.classList.add("enemy-hit");
    setTimeout(() => enemy.element.classList.remove("enemy-hit"), 120);

    if (enemy.hp <= 0) {
        removeEnemy(enemy);
    }
}

function checkPlayerBullets() {
    if (!window.NebulaGame || typeof window.NebulaGame.getPlayerBullets !== "function") {
        return;
    }

    const bullets = window.NebulaGame.getPlayerBullets();

    if (!Array.isArray(bullets)) return;

    enemyState.enemies.forEach((enemy) => {
        bullets.forEach((bullet) => {
            const bx = Number(bullet.x);
            const by = Number(bullet.y);

            if (
                Math.abs(bx - enemy.x) < 5 &&
                Math.abs(by - enemy.y) < 7
            ) {
                damageEnemy(enemy, Number(bullet.damage) || 1);

                if (typeof bullet.destroy === "function") {
                    bullet.destroy();
                }
            }
        });
    });

    if (enemyState.boss) {
        bullets.forEach((bullet) => {
            const bx = Number(bullet.x);
            const by = Number(bullet.y);
            const boss = enemyState.boss;

            if (
                Math.abs(bx - boss.x) < 9 &&
                Math.abs(by - boss.y) < 10
            ) {
                boss.hp -= Number(bullet.damage) || 1;

                if (typeof bullet.destroy === "function") {
                    bullet.destroy();
                }

                updateBossBar();

                if (boss.hp <= 0) {
                    defeatBoss();
                }
            }
        });
    }
}

function createPowerUp(x, y) {
    const types = [
        { type: "energy", emoji: "⚡" },
        { type: "shield", emoji: "🛡️" },
        { type: "rapid", emoji: "🔥" },
        { type: "emp", emoji: "💜" }
    ];

    const item = types[Math.floor(Math.random() * types.length)];

    const element = document.createElement("div");
    element.className = "power-up power-" + item.type;
    element.textContent = item.emoji;
    element.style.left = x + "%";
    element.style.top = y + "%";

    enemyGameArea.appendChild(element);

    enemyState.powerUps.push({
        element,
        type: item.type,
        x,
        y,
        speed: 0.55
    });
}

function updatePowerUps() {
    const player = getPlayerPosition();

    enemyState.powerUps.forEach((power) => {
        power.y += power.speed;

        power.element.style.left = power.x + "%";
        power.element.style.top = power.y + "%";

        if (
            Math.abs(power.x - player.x) < 5 &&
            Math.abs(power.y - player.y) < 7
        ) {
            collectPowerUp(power);
        } else if (power.y > 105) {
            removePowerUp(power);
        }
    });
}

function collectPowerUp(power) {
    if (window.NebulaGame && typeof window.NebulaGame.collectPowerUp === "function") {
        window.NebulaGame.collectPowerUp(power.type);
    }

    removePowerUp(power);
}

function removePowerUp(power) {
    if (power.element.parentNode) {
        power.element.remove();
    }

    const index = enemyState.powerUps.indexOf(power);
    if (index !== -1) enemyState.powerUps.splice(index, 1);
}

function nextWave() {
    enemyState.wave++;
    waveUI.textContent = enemyState.wave;

    if (enemyState.wave % 5 === 0) {
        startBoss();
    } else {
        showWaveMessage("WAVE " + enemyState.wave);
    }
}

function updateWave() {
    enemyState.waveTimer++;

    const waveLength = Math.max(700, 1500 - enemyState.wave * 50);

    if (enemyState.waveTimer >= waveLength && !enemyState.bossActive) {
        enemyState.waveTimer = 0;
        nextWave();
    }
}

function startBoss() {
    enemyState.bossActive = true;

    const element = document.createElement("div");
    element.className = "boss";
    element.textContent = "👹";
    element.style.left = "50%";
    element.style.top = "5%";

    enemyGameArea.appendChild(element);

    enemyState.boss = {
        element,
        x: 50,
        y: 5,
        hp: 100 + enemyState.wave * 15,
        maxHp: 100 + enemyState.wave * 15,
        direction: 1,
        cooldown: 100
    };

    bossHUD.style.display = "block";
    updateBossBar();
    showWaveMessage("⚠ BOSS INCOMING ⚠");
}

function updateBoss() {
    const boss = enemyState.boss;
    if (!boss) return;

    boss.x += boss.direction * 0.25;

    if (boss.x > 88 || boss.x < 12) {
        boss.direction *= -1;
    }

    boss.element.style.left = boss.x + "%";

    boss.cooldown--;

    if (boss.cooldown <= 0) {
        createBossBullets();
        boss.cooldown = Math.max(45, 110 - enemyState.wave * 4);
    }
}

function createBossBullets() {
    const boss = enemyState.boss;

    [-6, 0, 6].forEach((offset) => {
        const bullet = document.createElement("div");
        bullet.className = "enemy-bullet";

        bullet.style.left = (boss.x + offset) + "%";
        bullet.style.top = (boss.y + 8) + "%";

        enemyGameArea.appendChild(bullet);

        enemyState.bullets.push({
            element: bullet,
            x: boss.x + offset,
            y: boss.y + 8,
            speed: 1.6,
            damage: 1
        });
    });
}

function updateBossBar() {
    if (!enemyState.boss) return;

    const percent =
        Math.max(0, enemyState.boss.hp / enemyState.boss.maxHp) * 100;

    bossFill.style.width = percent + "%";
}

function defeatBoss() {
    const boss = enemyState.boss;

    if (!boss) return;

    boss.element.remove();
    enemyState.boss = null;
    enemyState.bossActive = false;

    bossHUD.style.display = "none";

    addScore(5000);
    showWaveMessage("BOSS DEFEATED!");

    enemyState.waveTimer = 0;
}

function updateEnemyCount() {
    enemyCountUI.textContent = enemyState.enemies.length;
}

function enemyLoop() {
    if (!isGameRunning()) {
        requestAnimationFrame(enemyLoop);
        return;
    }

    enemyState.spawnTimer++;

    const spawnDelay = Math.max(45, 130 - enemyState.wave * 5);

    if (
        enemyState.spawnTimer >= spawnDelay &&
        !enemyState.bossActive &&
        enemyState.enemies.length < 12
    ) {
        enemyState.spawnTimer = 0;
        spawnEnemies();
    }

    updateEnemies();
    updateEnemyBullets();
    updatePowerUps();
    checkPlayerBullets();
    updateWave();

    if (enemyState.bossActive) {
        updateBoss();
    }

    updateEnemyCount();

    requestAnimationFrame(enemyLoop);
}

enemyLoop();
