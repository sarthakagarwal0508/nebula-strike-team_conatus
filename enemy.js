const area = document.getElementById("game-area");
const enemyCountDisplay = document.getElementById("enemy-count");
const bossHUD = document.getElementById("boss-hud");
const bossFill = document.getElementById("boss-fill");
const bossPhaseUI = document.getElementById("boss-phase");

const enemyState = {
    enemies: [], bullets: [], powerUps: [], boss: null,
    wave: 1, kills: 0, spawnTimer: 0, maxAlive: 5,
    bossActive: false, bossPhase: 1, running: false
};

const waveData = {
    1: { target: 10, delay: 100, maxAlive: 4 },
    2: { target: 15, delay: 90, maxAlive: 5 },
    3: { target: 20, delay: 80, maxAlive: 6 },
    4: { target: 25, delay: 70, maxAlive: 7 }
};

const types = {
    drone: { emoji: "👾", hp: 1, speed: 0.15, points: 100, shoot: false },
    shooter: { emoji: "🛸", hp: 2, speed: 0.13, points: 200, shoot: true },
    chaser: { emoji: "👹", hp: 2, speed: 0.16, points: 300, shoot: false },
    tank: { emoji: "☄️", hp: 5, speed: 0.09, points: 500, shoot: true },
    bomber: { emoji: "💣", hp: 3, speed: 0.12, points: 450, shoot: false }
};

function gameRunning() {
    if (!window.NebulaGame) return false;
    if (!window.NebulaGame.isRunning()) return false;
    if (typeof window.NebulaGame.isPaused === "function" &&
        window.NebulaGame.isPaused()) return false;
    return true;
}

function playerPos() {
    return window.NebulaGame.getPlayerPosition();
}

function hurtPlayer(amount) {
    window.NebulaGame.damagePlayer(amount);
}

function killEnemy(points) {
    window.NebulaGame.registerEnemyKill(points);
}

function waveMessage(text) {
    const msg = document.createElement("div");
    msg.textContent = text;
    msg.style.cssText =
        "position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);" +
        "font-size:28px;font-weight:bold;color:#ff5577;" +
        "text-shadow:0 0 16px #ff1744;z-index:100;pointer-events:none;" +
        "letter-spacing:3px;white-space:nowrap;";
    area.appendChild(msg);

    setTimeout(() => {
        if (msg.parentNode) msg.remove();
    }, 1200);
}

function chooseType() {
    const wave = enemyState.wave;
    const r = Math.random();

    if (wave === 1) return "drone";

    if (wave === 2)
        return r < 0.6 ? "drone" : "shooter";

    if (wave === 3) {
        if (r < 0.3) return "drone";
        if (r < 0.7) return "shooter";
        return "chaser";
    }

    if (r < 0.18) return "tank";
    if (r < 0.40) return "bomber";
    if (r < 0.68) return "chaser";
    return "shooter";
}

function createEnemy(typeName) {
    const data = types[typeName];
    if (!data) return;

    const element = document.createElement("div");
    element.className = "enemy enemy-" + typeName;
    element.textContent = data.emoji;
    element.style.position = "absolute";
    element.style.display = "block";
    element.style.zIndex = "20";
    element.style.fontSize = "32px";
    element.style.lineHeight = "1";
    element.style.userSelect = "none";

    const x = 5 + Math.random() * 90;
    element.style.left = x + "%";
    element.style.top = "-8%";
    area.appendChild(element);

    enemyState.enemies.push({
        element, type: typeName, x, y: -8,
        hp: data.hp,
        speed: data.speed + Math.min(0.08, enemyState.wave * 0.01),
        points: data.points,
        cooldown: 100 + Math.random() * 100,
        drift: Math.random() * 6
    });
}

function spawnEnemy() {
    createEnemy(chooseType());
}

function enemyShoot(enemy) {
    const player = playerPos();
    let x = enemy.x;

    if (enemy.type === "shooter")
        x += (player.x - x) * 0.12;

    const bullet = document.createElement("div");
    bullet.className = "enemy-bullet";
    bullet.style.left = x + "%";
    bullet.style.top = (enemy.y + 4) + "%";
    area.appendChild(bullet);

    enemyState.bullets.push({
        element: bullet,
        x,
        y: enemy.y + 4,
        speed: 0.24 + enemyState.wave * 0.018,
        damage: 1
    });
}

function updateEnemies() {
    const player = playerPos();

    for (let i = enemyState.enemies.length - 1; i >= 0; i--) {
        const enemy = enemyState.enemies[i];
        enemy.y += enemy.speed;

        if (enemy.type === "chaser")
            enemy.x += (player.x - enemy.x) *
                (0.003 + enemyState.wave * 0.0004);

        if (enemy.type === "shooter")
            enemy.x += Math.sin((enemy.y + enemy.drift) * 0.08) * 0.15;

        if (enemy.type === "tank")
            enemy.x += Math.sin((enemy.y + enemy.drift) * 0.04) * 0.08;

        if (enemy.type === "bomber")
            enemy.x += (player.x - enemy.x) * 0.0015;

        enemy.x = Math.max(3, Math.min(97, enemy.x));
        enemy.element.style.left = enemy.x + "%";
        enemy.element.style.top = enemy.y + "%";

        if (enemy.type === "shooter" || enemy.type === "tank") {
            enemy.cooldown--;

            if (enemy.cooldown <= 0 && enemy.y > 5 && enemy.y < 65) {
                enemyShoot(enemy);
                enemy.cooldown = Math.max(95, 190 - enemyState.wave * 5) +
                    Math.random() * 30;
            }
        }

        if (enemy.type === "bomber" && enemy.y > 90) {
            hurtPlayer(2);
            removeEnemy(enemy, false);
            continue;
        }

        if (enemy.y > 92) {
            hurtPlayer(1);
            removeEnemy(enemy, false);
        }
    }
}

function updateEnemyBullets() {
    const player = playerPos();

    for (let i = enemyState.bullets.length - 1; i >= 0; i--) {
        const bullet = enemyState.bullets[i];
        bullet.y += bullet.speed;
        bullet.element.style.top = bullet.y + "%";

        if (Math.abs(bullet.x - player.x) < 4 &&
            Math.abs(bullet.y - player.y) < 7) {
            hurtPlayer(bullet.damage);
            removeEnemyBullet(bullet);
        } else if (bullet.y > 105) {
            removeEnemyBullet(bullet);
        }
    }
}

function removeEnemyBullet(bullet) {
    if (bullet.element.parentNode) bullet.element.remove();

    const index = enemyState.bullets.indexOf(bullet);
    if (index !== -1) enemyState.bullets.splice(index, 1);
}

function removeEnemy(enemy, reward = true) {
    if (enemy.element.parentNode) enemy.element.remove();

    const index = enemyState.enemies.indexOf(enemy);
    if (index !== -1) enemyState.enemies.splice(index, 1);

    if (reward) {
        enemyState.kills++;
        killEnemy(enemy.points);

        if (Math.random() < 0.12 + enemyState.wave * 0.02)
            createPowerUp(enemy.x, enemy.y);

        checkWaveComplete();
    }
}

function damageEnemy(enemy, amount = 1) {
    enemy.hp -= amount;
    enemy.element.classList.add("enemy-hit");

    setTimeout(() => {
        enemy.element.classList.remove("enemy-hit");
    }, 100);

    if (enemy.hp <= 0)
        removeEnemy(enemy);
}

function checkPlayerBullets() {
    const bullets = window.NebulaGame.getPlayerBullets();

    for (let i = enemyState.enemies.length - 1; i >= 0; i--) {
        const enemy = enemyState.enemies[i];

        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];

            if (Math.abs(bullet.x - enemy.x) < 5 &&
                Math.abs(bullet.y - enemy.y) < 7) {
                damageEnemy(enemy, bullet.damage);

                if (bullet.hit) bullet.hit();
                else if (bullet.destroy) bullet.destroy();

                break;
            }
        }
    }
}

function createPowerUp(x, y) {
    const names = ["energy", "shield", "rapid", "emp"];
    const type = names[Math.floor(Math.random() * names.length)];

    const icons = {
        energy: "⚡",
        shield: "🛡️",
        rapid: "🔥",
        emp: "✦"
    };

    const element = document.createElement("div");
    element.className = "power-up";
    element.textContent = icons[type];
    element.style.left = x + "%";
    element.style.top = y + "%";
    area.appendChild(element);

    enemyState.powerUps.push({
        element, x, y, type
    });
}

function updatePowerUps() {
    const player = playerPos();

    for (let i = enemyState.powerUps.length - 1; i >= 0; i--) {
        const power = enemyState.powerUps[i];
        power.y += 0.22;
        power.element.style.top = power.y + "%";

        if (Math.abs(power.x - player.x) < 5 &&
            Math.abs(power.y - player.y) < 7) {
            window.NebulaGame.collectPowerUp(power.type);

            if (power.element.parentNode) power.element.remove();
            enemyState.powerUps.splice(i, 1);
        } else if (power.y > 105) {
            if (power.element.parentNode) power.element.remove();
            enemyState.powerUps.splice(i, 1);
        }
    }
}

function startWave() {
    const data = waveData[enemyState.wave];
    if (!data) return;

    enemyState.kills = 0;
    enemyState.spawnTimer = 0;
    enemyState.maxAlive = data.maxAlive;
    spawnEnemy();

    if (enemyState.wave > 1)
        waveMessage("WAVE " + enemyState.wave);
}

function checkWaveComplete() {
    if (enemyState.bossActive) return;

    const data = waveData[enemyState.wave];
    if (!data) return;

    if (enemyState.kills >= data.target)
        nextWave();
}

function nextWave() {
    if (enemyState.bossActive) return;

    if (enemyState.wave >= 4) {
        enemyState.wave = 5;

        if (window.NebulaGame.setWave)
            window.NebulaGame.setWave(5);

        startBoss();
        return;
    }

    enemyState.wave++;

    if (window.NebulaGame.setWave)
        window.NebulaGame.setWave(enemyState.wave);

    startWave();
}

function startBoss() {
    enemyState.bossActive = true;
    enemyState.bossPhase = 1;
    waveMessage("⚠ FINAL BOSS INCOMING ⚠");

    const element = document.createElement("div");
    element.className = "boss-ship";
    element.innerHTML =
        '<div class="boss-core"></div>' +
        '<div class="boss-fin boss-fin-left"></div>' +
        '<div class="boss-fin boss-fin-right"></div>';

    element.style.left = "50%";
    element.style.top = "5%";
    area.appendChild(element);

    const hp = 240;

    enemyState.boss = {
        element,
        x: 50,
        y: 5,
        hp,
        maxHp: hp,
        direction: 1,
        cooldown: 120
    };

    bossHUD.style.display = "block";

    if (bossPhaseUI)
        bossPhaseUI.textContent = "PHASE 1 // HUNTER";

    if (window.NebulaGame.setBossMode)
        window.NebulaGame.setBossMode(true);

    updateBossBar();
}

function updateBoss() {
    const boss = enemyState.boss;
    if (!boss) return;

    const ratio = boss.hp / boss.maxHp;
    let phase = 1;

    if (ratio <= 0.66) phase = 2;
    if (ratio <= 0.33) phase = 3;

    if (phase !== enemyState.bossPhase) {
        enemyState.bossPhase = phase;

        if (bossPhaseUI) {
            bossPhaseUI.textContent =
                phase === 2 ? "PHASE 2 // OVERDRIVE" :
                "PHASE 3 // RAMPAGE";
        }

        waveMessage(
            phase === 2 ? "BOSS OVERDRIVE" : "BOSS RAMPAGE"
        );
    }

    const speed =
        phase === 3 ? 0.48 :
        phase === 2 ? 0.38 : 0.28;

    boss.x += boss.direction * speed;

    if (boss.x >= 84 || boss.x <= 16)
        boss.direction *= -1;

    boss.element.style.left = boss.x + "%";
    boss.cooldown--;

    if (boss.cooldown <= 0) {
        bossShoot();

        boss.cooldown =
            phase === 1 ? 115 :
            phase === 2 ? 80 : 55;
    }

    checkBossHit();
    updateBossBar();

    if (boss.hp <= 0)
        defeatBoss();
}

function bossShoot() {
    const boss = enemyState.boss;
    if (!boss) return;

    let offsets = [-7, 0, 7];

    if (enemyState.bossPhase === 2)
        offsets = [-10, -5, 0, 5, 10];

    if (enemyState.bossPhase === 3)
        offsets = [-13, -6.5, 0, 6.5, 13];

    offsets.forEach(offset => {
        const element = document.createElement("div");
        element.className = "enemy-bullet boss-bullet";
        element.style.left = (boss.x + offset) + "%";
        element.style.top = (boss.y + 9) + "%";
        area.appendChild(element);

        enemyState.bullets.push({
            element,
            x: boss.x + offset,
            y: boss.y + 9,
            speed: enemyState.bossPhase === 3 ? 0.72 : 0.56,
            damage: 1
        });
    });
}

function checkBossHit() {
    const boss = enemyState.boss;
    if (!boss) return;

    const bullets = window.NebulaGame.getPlayerBullets();

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        if (Math.abs(bullet.x - boss.x) < 12 &&
            Math.abs(bullet.y - boss.y) < 12) {
            boss.hp -= bullet.damage;

            if (bullet.hit) bullet.hit();
            else if (bullet.destroy) bullet.destroy();
        }
    }
}

function updateBossBar() {
    if (!enemyState.boss) return;

    const percent = Math.max(
        0,
        (enemyState.boss.hp / enemyState.boss.maxHp) * 100
    );

    bossFill.style.width = percent + "%";
}

function defeatBoss() {
    const boss = enemyState.boss;
    if (!boss) return;

    if (boss.element.parentNode)
        boss.element.remove();

    enemyState.boss = null;
    enemyState.bossActive = false;
    bossHUD.style.display = "none";

    if (window.NebulaGame.setBossMode)
        window.NebulaGame.setBossMode(false);

    window.NebulaGame.addScore(5000);
    waveMessage("BOSS DEFEATED!");

    if (window.NebulaGame.winGame)
        window.NebulaGame.winGame();
}

window.addEventListener("nebula-emp", () => {
    const player = playerPos();

    for (let i = enemyState.enemies.length - 1; i >= 0; i--) {
        const enemy = enemyState.enemies[i];
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 28)
            damageEnemy(enemy, 3);
    }

    for (let i = enemyState.bullets.length - 1; i >= 0; i--)
        removeEnemyBullet(enemyState.bullets[i]);
});

function clearEnemyObjects() {
    enemyState.enemies.forEach(enemy => {
        if (enemy.element.parentNode) enemy.element.remove();
    });

    enemyState.bullets.forEach(bullet => {
        if (bullet.element.parentNode) bullet.element.remove();
    });

    enemyState.powerUps.forEach(power => {
        if (power.element.parentNode) power.element.remove();
    });

    if (enemyState.boss &&
        enemyState.boss.element.parentNode) {
        enemyState.boss.element.remove();
    }

    enemyState.enemies = [];
    enemyState.bullets = [];
    enemyState.powerUps = [];
    enemyState.boss = null;
    enemyState.bossActive = false;
    enemyState.bossPhase = 1;
}

function resetEnemySystem() {
    clearEnemyObjects();

    enemyState.wave = 1;
    enemyState.kills = 0;
    enemyState.spawnTimer = 0;
    enemyState.running = true;

    if (window.NebulaGame.setWave)
        window.NebulaGame.setWave(1);

    startWave();
    updateEnemyCount();
}

window.resetEnemySystem = resetEnemySystem;

function updateEnemyCount() {
    if (!enemyCountDisplay) return;

    enemyCountDisplay.textContent =
        enemyState.enemies.length +
        (enemyState.boss ? " + BOSS" : "");
}

function enemyLoop() {
    if (gameRunning()) {
        enemyState.running = true;

        if (!enemyState.bossActive) {
            const data = waveData[enemyState.wave];

            if (data) {
                enemyState.spawnTimer++;

                if (enemyState.spawnTimer >= data.delay &&
                    enemyState.enemies.length < data.maxAlive) {
                    spawnEnemy();
                    enemyState.spawnTimer = 0;
                }
            }
        }

        updateEnemies();
        updateEnemyBullets();
        updatePowerUps();
        checkPlayerBullets();

        if (enemyState.bossActive)
            updateBoss();

        updateEnemyCount();
    } else {
        enemyState.running = false;
    }

    requestAnimationFrame(enemyLoop);
}

enemyLoop();