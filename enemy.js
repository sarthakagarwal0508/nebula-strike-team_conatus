// NEBULA STRIKE - ENEMY SYSTEM

const area = document.getElementById("game-area");
const enemyCountUI = document.getElementById("enemy-count");
const waveUI = document.getElementById("wave");
const bossHUD = document.getElementById("boss-hud");
const bossFill = document.getElementById("boss-fill");

const enemyState = {
    enemies: [], bullets: [], powerUps: [], boss: null,
    wave: 1, spawnTimer: 0, waveTimer: 0,
    bossActive: false, running: false
};

const types = {
    drone:   { emoji:"👾", hp:1, speed:1.4, points:100, shoot:false },
    shooter: { emoji:"🛸", hp:2, speed:.8, points:200, shoot:true },
    chaser:  { emoji:"👹", hp:2, speed:1.1, points:300, shoot:false },
    tank:    { emoji:"☄️", hp:5, speed:.45, points:500, shoot:true }
};

function gameRunning() {
    return window.NebulaGame && window.NebulaGame.isRunning();
}

function playerPos() {
    return window.NebulaGame.getPlayerPosition();
}

function damagePlayer(n) {
    window.NebulaGame.damagePlayer(n);
}

function killEnemy(points) {
    window.NebulaGame.registerEnemyKill(points);
}

function waveMessage(text) {
    const msg = document.createElement("div");
    msg.textContent = text;
    msg.style.cssText =
        "position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);" +
        "font-size:34px;font-weight:bold;color:#ff5577;text-shadow:0 0 15px #ff1744;" +
        "z-index:100;pointer-events:none;";
    area.appendChild(msg);
    setTimeout(() => msg.remove(), 1500);
}

function createEnemy(typeName) {
    const t = types[typeName];
    const el = document.createElement("div");

    el.className = `enemy enemy-${typeName}`;
    el.textContent = t.emoji;
    el.style.left = `${5 + Math.random() * 90}%`;
    el.style.top = "-8%";
    area.appendChild(el);

    enemyState.enemies.push({
        el, type:typeName, x:parseFloat(el.style.left),
        y:-8, hp:t.hp, maxHp:t.hp,
        speed:t.speed, points:t.points,
        cooldown:60 + Math.random() * 100
    });
}

function chooseType() {
    const r = Math.random();

    if (enemyState.wave >= 4 && r < .15) return "tank";
    if (enemyState.wave >= 3 && r < .35) return "chaser";
    if (enemyState.wave >= 2 && r < .55) return "shooter";
    return "drone";
}

function spawnEnemies() {
    const amount = Math.min(1 + Math.floor(enemyState.wave / 2), 4);
    for (let i = 0; i < amount; i++) createEnemy(chooseType());
}

function enemyShoot(e) {
    const b = document.createElement("div");
    b.className = "enemy-bullet";
    b.style.left = `${e.x}%`;
    b.style.top = `${e.y}%`;
    area.appendChild(b);

    enemyState.bullets.push({
        el:b, x:e.x, y:e.y,
        speed:.6 + enemyState.wave * .03,
        damage:1
    });
}

function updateEnemies() {
    const p = playerPos();

    for (let i = enemyState.enemies.length - 1; i >= 0; i--) {
        const e = enemyState.enemies[i];

        e.y += e.speed;

        if (e.type === "chaser")
            e.x += (p.x - e.x) * .008;

        if (e.type === "shooter" || e.type === "tank")
            e.x += Math.sin(e.y * .08) * .25;

        e.x = Math.max(3, Math.min(97, e.x));
        e.el.style.left = `${e.x}%`;
        e.el.style.top = `${e.y}%`;

        if (types[e.type].shoot) {
            e.cooldown--;

            if (e.cooldown <= 0 && e.y > 5 && e.y < 65) {
                enemyShoot(e);
                e.cooldown = Math.max(45, 130 - enemyState.wave * 4);
            }
        }

        if (e.y > 92) {
            damagePlayer(1);
            removeEnemy(e, false);
        }
    }
}

function updateEnemyBullets() {
    const p = playerPos();

    for (let i = enemyState.bullets.length - 1; i >= 0; i--) {
        const b = enemyState.bullets[i];
        b.y += b.speed;

        b.el.style.top = `${b.y}%`;

        if (Math.abs(b.x - p.x) < 4 && Math.abs(b.y - p.y) < 7) {
            damagePlayer(b.damage);
            removeBullet(b);
        } else if (b.y > 105) {
            removeBullet(b);
        }
    }
}

function removeBullet(b) {
    b.el.remove();
    const i = enemyState.bullets.indexOf(b);
    if (i !== -1) enemyState.bullets.splice(i, 1);
}

function removeEnemy(e, reward = true) {
    e.el.remove();

    const i = enemyState.enemies.indexOf(e);
    if (i !== -1) enemyState.enemies.splice(i, 1);

    if (reward) {
        killEnemy(e.points);
        if (Math.random() < .16) createPowerUp(e.x, e.y);
    }
}

function damageEnemy(e, amount = 1) {
    e.hp -= amount;
    e.el.classList.add("enemy-hit");

    setTimeout(() => e.el.classList.remove("enemy-hit"), 120);

    if (e.hp <= 0) removeEnemy(e);
}

function checkPlayerBullets() {
    const bullets = window.NebulaGame.getPlayerBullets();

    for (let i = enemyState.enemies.length - 1; i >= 0; i--) {
        const e = enemyState.enemies[i];

        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];

            if (
                Math.abs(b.x - e.x) < 5 &&
                Math.abs(b.y - e.y) < 7
            ) {
                damageEnemy(e, b.damage);

                if (b.hit) b.hit();
                else if (b.destroy) b.destroy();

                break;
            }
        }
    }
}

function createPowerUp(x, y) {
    const names = ["energy", "shield", "rapid", "emp"];
    const type = names[Math.floor(Math.random() * names.length)];

    const icons = {
        energy:"⚡", shield:"🛡️", rapid:"🔥", emp:"💥"
    };

    const el = document.createElement("div");
    el.className = "power-up";
    el.textContent = icons[type];
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    area.appendChild(el);

    enemyState.powerUps.push({ el, x, y, type });
}

function updatePowerUps() {
    const p = playerPos();

    for (let i = enemyState.powerUps.length - 1; i >= 0; i--) {
        const power = enemyState.powerUps[i];

        power.y += .35;
        power.el.style.top = `${power.y}%`;

        if (
            Math.abs(power.x - p.x) < 5 &&
            Math.abs(power.y - p.y) < 7
        ) {
            window.NebulaGame.collectPowerUp(power.type);
            power.el.remove();
            enemyState.powerUps.splice(i, 1);
        } else if (power.y > 105) {
            power.el.remove();
            enemyState.powerUps.splice(i, 1);
        }
    }
}

function nextWave() {
    enemyState.wave++;
    enemyState.waveTimer = 0;

    if (window.NebulaGame.setWave)
        window.NebulaGame.setWave(enemyState.wave);

    if (enemyState.wave % 5 === 0) startBoss();
    else waveMessage(`WAVE ${enemyState.wave}`);
}

function updateWave() {
    if (enemyState.bossActive || enemyState.enemies.length) return;

    enemyState.waveTimer++;

    const wait = Math.max(700, 1500 - enemyState.wave * 50);

    if (enemyState.waveTimer >= wait)
        nextWave();
}

function startBoss() {
    enemyState.bossActive = true;

    waveMessage("⚠ BOSS INCOMING ⚠");

    const el = document.createElement("div");
    el.className = "boss";
    el.textContent = "👾";
    el.style.left = "50%";
    el.style.top = "5%";
    area.appendChild(el);

    const hp = 100 + enemyState.wave * 15;

    enemyState.boss = {
        el, x:50, y:5,
        hp, maxHp:hp,
        direction:1,
        cooldown:100
    };

    bossHUD.style.display = "block";
    updateBossBar();
}

function updateBoss() {
    const b = enemyState.boss;
    if (!b) return;

    b.x += b.direction * .35;

    if (b.x >= 88 || b.x <= 12)
        b.direction *= -1;

    b.el.style.left = `${b.x}%`;

    b.cooldown--;

    if (b.cooldown <= 0) {
        bossShoot();
        b.cooldown = Math.max(50, 110 - enemyState.wave * 4);
    }

    checkBossHit();
    updateBossBar();

    if (b.hp <= 0)
        defeatBoss();
}

function bossShoot() {
    const b = enemyState.boss;

    [-6, 0, 6].forEach(offset => {
        const el = document.createElement("div");
        el.className = "enemy-bullet";
        el.style.left = `${b.x + offset}%`;
        el.style.top = `${b.y + 8}%`;
        area.appendChild(el);

        enemyState.bullets.push({
            el,
            x:b.x + offset,
            y:b.y + 8,
            speed:.8,
            damage:1
        });
    });
}

function checkBossHit() {
    const boss = enemyState.boss;
    const bullets = window.NebulaGame.getPlayerBullets();

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        if (
            Math.abs(b.x - boss.x) < 10 &&
            Math.abs(b.y - boss.y) < 10
        ) {
            boss.hp -= b.damage;

            if (b.hit) b.hit();
            else if (b.destroy) b.destroy();
        }
    }
}

function updateBossBar() {
    if (!enemyState.boss) return;

    const percent =
        Math.max(0, enemyState.boss.hp /
        enemyState.boss.maxHp * 100);

    bossFill.style.width = `${percent}%`;
}

function defeatBoss() {
    enemyState.boss.el.remove();
    enemyState.boss = null;
    enemyState.bossActive = false;

    bossHUD.style.display = "none";

    killEnemy(5000);
    waveMessage("BOSS DEFEATED!");

    enemyState.wave++;

    if (window.NebulaGame.setWave)
        window.NebulaGame.setWave(enemyState.wave);
}

function updateEMP() {
    // EMP is triggered by script.js.
    // This listener damages nearby enemies and removes enemy bullets.
}

window.addEventListener("nebula-emp", () => {
    const p = playerPos();

    for (let i = enemyState.enemies.length - 1; i >= 0; i--) {
        const e = enemyState.enemies[i];

        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 25)
            damageEnemy(e, 2);
    }

    for (let i = enemyState.bullets.length - 1; i >= 0; i--)
        removeBullet(enemyState.bullets[i]);
});

function updateEnemyCount() {
    if (enemyCountUI)
        enemyCountUI.textContent =
            enemyState.enemies.length +
            (enemyState.boss ? " + BOSS" : "");
}

function clearEnemyObjects() {
    enemyState.enemies.forEach(e => e.el.remove());
    enemyState.bullets.forEach(b => b.el.remove());
    enemyState.powerUps.forEach(p => p.el.remove());

    if (enemyState.boss)
        enemyState.boss.el.remove();

    enemyState.enemies = [];
    enemyState.bullets = [];
    enemyState.powerUps = [];
    enemyState.boss = null;
    enemyState.bossActive = false;

    if (bossHUD)
        bossHUD.style.display = "none";
}

function resetEnemySystem() {
    clearEnemyObjects();

    enemyState.wave = 1;
    enemyState.spawnTimer = 0;
    enemyState.waveTimer = 0;
    enemyState.running = true;

    if (waveUI) waveUI.textContent = "1";
    updateEnemyCount();
}

window.resetEnemySystem = resetEnemySystem;

function enemyLoop() {
    if (gameRunning()) {
        enemyState.running = true;

        if (!enemyState.bossActive) {
            enemyState.spawnTimer++;

            const delay =
                Math.max(45, 130 - enemyState.wave * 5);

            if (
                enemyState.spawnTimer >= delay &&
                enemyState.enemies.length < 12
            ) {
                spawnEnemies();
                enemyState.spawnTimer = 0;
            }
        }

        updateEnemies();
        updateEnemyBullets();
        updatePowerUps();
        checkPlayerBullets();

        if (enemyState.bossActive)
            updateBoss();

        updateWave();
        updateEnemyCount();
    } else {
        enemyState.running = false;
    }

    requestAnimationFrame(enemyLoop);
}

enemyLoop();

