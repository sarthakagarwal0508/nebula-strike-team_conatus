const area = document.getElementById("game-area");
const enemyCountUI = document.getElementById("enemy-count");
const bossHUD = document.getElementById("boss-hud");
const bossFill = document.getElementById("boss-fill");


const enemyState = {

    enemies: [],
    bullets: [],
    powerUps: [],

    boss: null,

    wave: 1,

    spawnTimer: 0,
    waveTimer: 0,

    bossActive: false,
    running: false
};


const types = {

    drone: {
        emoji: "👾",
        hp: 1,
        speed: 0.8,
        points: 100,
        shoot: false
    },

    shooter: {
        emoji: "🛸",
        hp: 2,
        speed: 0.55,
        points: 200,
        shoot: true
    },

    chaser: {
        emoji: "👹",
        hp: 2,
        speed: 0.7,
        points: 300,
        shoot: false
    },

    tank: {
        emoji: "☄️",
        hp: 5,
        speed: 0.3,
        points: 500,
        shoot: true
    }
};


function gameRunning() {

    if (!window.NebulaGame) {
        return false;
    }

    if (!window.NebulaGame.isRunning()) {
        return false;
    }

    if (
        typeof window.NebulaGame.isPaused === "function" &&
        window.NebulaGame.isPaused()
    ) {
        return false;
    }

    return true;
}


function playerPos() {

    return window.NebulaGame
        .getPlayerPosition();
}


function hurtPlayer(amount) {

    window.NebulaGame
        .damagePlayer(amount);
}


function killEnemy(points) {

    window.NebulaGame
        .registerEnemyKill(points);
}


function waveMessage(text) {

    const msg =
        document.createElement("div");

    msg.textContent = text;

    msg.style.cssText =
        "position:absolute;" +
        "top:45%;" +
        "left:50%;" +
        "transform:translate(-50%,-50%);" +
        "font-size:30px;" +
        "font-weight:bold;" +
        "color:#ff5577;" +
        "text-shadow:0 0 15px #ff1744;" +
        "z-index:100;" +
        "pointer-events:none;" +
        "letter-spacing:3px;";

    area.appendChild(msg);

    setTimeout(function() {
        msg.remove();
    }, 1500);
}


function createEnemy(typeName) {

    const t = types[typeName];

    if (!t) return;


    const el =
        document.createElement("div");

    el.className =
        "enemy enemy-" + typeName;

    el.textContent =
        t.emoji;


    const x =
        5 + Math.random() * 90;


    el.style.left =
        x + "%";

    el.style.top =
        "-8%";


    area.appendChild(el);


    enemyState.enemies.push({

        el: el,

        type: typeName,

        x: x,

        y: -8,

        hp: t.hp,

        maxHp: t.hp,

        speed: t.speed,

        points: t.points,

        cooldown:
            100 + Math.random() * 100
    });
}


function chooseType() {

    const r = Math.random();


    if (
        enemyState.wave >= 4 &&
        r < 0.10
    ) {
        return "tank";
    }


    if (
        enemyState.wave >= 3 &&
        r < 0.28
    ) {
        return "chaser";
    }


    if (
        enemyState.wave >= 2 &&
        r < 0.50
    ) {
        return "shooter";
    }


    return "drone";
}


function spawnEnemies() {

    const amount =
        Math.min(
            1 +
            Math.floor(enemyState.wave / 3),
            3
        );


    for (
        let i = 0;
        i < amount;
        i++
    ) {
        createEnemy(
            chooseType()
        );
    }
}


function enemyShoot(enemy) {

    const bullet =
        document.createElement("div");

    bullet.className =
        "enemy-bullet";


    bullet.style.left =
        enemy.x + "%";

    bullet.style.top =
        enemy.y + "%";


    area.appendChild(bullet);


    enemyState.bullets.push({

        el: bullet,

        x: enemy.x,

        y: enemy.y,

        speed:
            0.45 +
            enemyState.wave * 0.02,

        damage: 1
    });
}


function updateEnemies() {

    const player =
        playerPos();


    for (
        let i =
            enemyState.enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemyState.enemies[i];


        enemy.y +=
            enemy.speed;


        if (
            enemy.type ===
            "chaser"
        ) {

            enemy.x +=
                (player.x - enemy.x)
                * 0.006;
        }


        if (
            enemy.type === "shooter" ||
            enemy.type === "tank"
        ) {

            enemy.x +=
                Math.sin(
                    enemy.y * 0.08
                ) * 0.20;
        }


        enemy.x =
            Math.max(
                3,
                Math.min(97, enemy.x)
            );


        enemy.el.style.left =
            enemy.x + "%";

        enemy.el.style.top =
            enemy.y + "%";


        if (
            types[enemy.type].shoot
        ) {

            enemy.cooldown--;


            if (
                enemy.cooldown <= 0 &&
                enemy.y > 5 &&
                enemy.y < 65
            ) {

                enemyShoot(enemy);


                enemy.cooldown =
                    Math.max(
                        80,
                        180 -
                        enemyState.wave * 5
                    );
            }
        }


        if (enemy.y > 92) {

            hurtPlayer(1);

            removeEnemy(
                enemy,
                false
            );
        }
    }
}


function updateEnemyBullets() {

    const player =
        playerPos();


    for (
        let i =
            enemyState.bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            enemyState.bullets[i];


        bullet.y +=
            bullet.speed;


        bullet.el.style.top =
            bullet.y + "%";


        if (
            Math.abs(
                bullet.x - player.x
            ) < 4 &&

            Math.abs(
                bullet.y - player.y
            ) < 7
        ) {

            hurtPlayer(
                bullet.damage
            );

            removeEnemyBullet(
                bullet
            );

        }

        else if (
            bullet.y > 105
        ) {

            removeEnemyBullet(
                bullet
            );
        }
    }
}


function removeEnemyBullet(bullet) {

    if (bullet.el.parentNode) {
        bullet.el.remove();
    }


    const index =
        enemyState.bullets
            .indexOf(bullet);


    if (index !== -1) {

        enemyState.bullets
            .splice(index, 1);
    }
}


function removeEnemy(
    enemy,
    reward = true
) {

    if (enemy.el.parentNode) {
        enemy.el.remove();
    }


    const index =
        enemyState.enemies
            .indexOf(enemy);


    if (index !== -1) {

        enemyState.enemies
            .splice(index, 1);
    }


    if (reward) {

        killEnemy(
            enemy.points
        );


        if (
            Math.random() < 0.18
        ) {
            createPowerUp(
                enemy.x,
                enemy.y
            );
        }
    }
}


function damageEnemy(
    enemy,
    amount = 1
) {

    enemy.hp -= amount;


    enemy.el.classList
        .add("enemy-hit");


    setTimeout(function() {

        enemy.el.classList
            .remove("enemy-hit");

    }, 120);


    if (enemy.hp <= 0) {

        removeEnemy(enemy);
    }
}


function checkPlayerBullets() {

    const bullets =
        window.NebulaGame
            .getPlayerBullets();


    for (
        let i =
            enemyState.enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemyState.enemies[i];


        for (
            let j =
                bullets.length - 1;
            j >= 0;
            j--
        ) {

            const bullet =
                bullets[j];


            if (

                Math.abs(
                    bullet.x - enemy.x
                ) < 5 &&

                Math.abs(
                    bullet.y - enemy.y
                ) < 7

            ) {

                damageEnemy(
                    enemy,
                    bullet.damage
                );


                if (
                    bullet.hit
                ) {

                    bullet.hit();

                } else if (
                    bullet.destroy
                ) {

                    bullet.destroy();
                }


                break;
            }
        }
    }
}


function createPowerUp(
    x,
    y
) {

    const names = [
        "energy",
        "shield",
        "rapid",
        "emp"
    ];


    const type =
        names[
            Math.floor(
                Math.random() *
                names.length
            )
        ];


    const icons = {

        energy: "⚡",

        shield: "🛡️",

        rapid: "🔥",

        emp: "💥"
    };


    const el =
        document.createElement("div");


    el.className =
        "power-up";


    el.textContent =
        icons[type];


    el.style.left =
        x + "%";

    el.style.top =
        y + "%";


    area.appendChild(el);


    enemyState.powerUps.push({

        el: el,

        x: x,

        y: y,

        type: type
    });
}


function updatePowerUps() {

    const player =
        playerPos();


    for (
        let i =
            enemyState.powerUps.length - 1;
        i >= 0;
        i--
    ) {

        const power =
            enemyState.powerUps[i];


        power.y += 0.28;


        power.el.style.top =
            power.y + "%";


        if (

            Math.abs(
                power.x - player.x
            ) < 5 &&

            Math.abs(
                power.y - player.y
            ) < 7

        ) {

            window.NebulaGame
                .collectPowerUp(
                    power.type
                );


            if (
                power.el.parentNode
            ) {
                power.el.remove();
            }


            enemyState.powerUps
                .splice(i, 1);
        }


        else if (
            power.y > 105
        ) {

            if (
                power.el.parentNode
            ) {
                power.el.remove();
            }


            enemyState.powerUps
                .splice(i, 1);
        }
    }
}


function nextWave() {

    enemyState.wave++;

    enemyState.waveTimer = 0;


    if (
        window.NebulaGame.setWave
    ) {

        window.NebulaGame
            .setWave(
                enemyState.wave
            );
    }


    if (
        enemyState.wave % 5 === 0
    ) {

        startBoss();

    } else {

        waveMessage(
            "WAVE " +
            enemyState.wave
        );
    }
}


function updateWave() {

    if (
        enemyState.bossActive ||
        enemyState.enemies.length
    ) {
        return;
    }


    enemyState.waveTimer++;


    const wait =
        Math.max(
            500,
            1050 -
            enemyState.wave * 35
        );


    if (
        enemyState.waveTimer >= wait
    ) {

        nextWave();
    }
}


function startBoss() {

    enemyState.bossActive = true;


    waveMessage(
        "⚠ BOSS INCOMING ⚠"
    );


    const el =
        document.createElement("div");


    el.className =
        "boss";


    el.textContent =
        "👾";


    el.style.left =
        "50%";

    el.style.top =
        "5%";


    area.appendChild(el);


    const hp =
        85 +
        enemyState.wave * 12;


    enemyState.boss = {

        el: el,

        x: 50,

        y: 5,

        hp: hp,

        maxHp: hp,

        direction: 1,

        cooldown: 120
    };


    bossHUD.style.display =
        "block";


    updateBossBar();
}


function updateBoss() {

    const boss =
        enemyState.boss;


    if (!boss) return;


    boss.x +=
        boss.direction *
        0.28;


    if (
        boss.x >= 88 ||
        boss.x <= 12
    ) {

        boss.direction *= -1;
    }


    boss.el.style.left =
        boss.x + "%";


    boss.cooldown--;


    if (
        boss.cooldown <= 0
    ) {

        bossShoot();


        boss.cooldown =
            Math.max(
                70,
                140 -
                enemyState.wave * 3
            );
    }


    checkBossHit();

    updateBossBar();


    if (
        boss.hp <= 0
    ) {

        defeatBoss();
    }
}


function bossShoot() {

    const boss =
        enemyState.boss;


    [-6, 0, 6].forEach(
        function(offset) {

            const el =
                document.createElement("div");


            el.className =
                "enemy-bullet";


            el.style.left =
                (boss.x + offset) +
                "%";

            el.style.top =
                (boss.y + 8) +
                "%";


            area.appendChild(el);


            enemyState.bullets.push({

                el: el,

                x:
                    boss.x +
                    offset,

                y:
                    boss.y +
                    8,

                speed: 0.60,

                damage: 1
            });
        }
    );
}


function checkBossHit() {

    const boss =
        enemyState.boss;


    if (!boss) return;


    const bullets =
        window.NebulaGame
            .getPlayerBullets();


    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        if (

            Math.abs(
                bullet.x - boss.x
            ) < 10 &&

            Math.abs(
                bullet.y - boss.y
            ) < 10

        ) {

            boss.hp -=
                bullet.damage;


            if (bullet.hit) {
                bullet.hit();
            }

            else if (
                bullet.destroy
            ) {
                bullet.destroy();
            }
        }
    }
}


function updateBossBar() {

    if (!enemyState.boss) {
        return;
    }


    const percent =
        Math.max(
            0,
            enemyState.boss.hp /
            enemyState.boss.maxHp *
            100
        );


    bossFill.style.width =
        percent + "%";
}


function defeatBoss() {

    const boss =
        enemyState.boss;


    if (!boss) return;


    if (
        boss.el.parentNode
    ) {
        boss.el.remove();
    }


    enemyState.boss =
        null;

    enemyState.bossActive =
        false;


    bossHUD.style.display =
        "none";


    killEnemy(5000);


    waveMessage(
        "BOSS DEFEATED!"
    );


    enemyState.wave++;


    if (
        window.NebulaGame.setWave
    ) {

        window.NebulaGame
            .setWave(
                enemyState.wave
            );
    }
}


window.addEventListener(
    "nebula-emp",
    function() {

        const player =
            playerPos();


        for (
            let i =
                enemyState.enemies.length - 1;
            i >= 0;
            i--
        ) {

            const enemy =
                enemyState.enemies[i];


            const dx =
                enemy.x -
                player.x;

            const dy =
                enemy.y -
                player.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <= 25
            ) {

                damageEnemy(
                    enemy,
                    2
                );
            }
        }


        for (
            let i =
                enemyState.bullets.length - 1;
            i >= 0;
            i--
        ) {

            removeEnemyBullet(
                enemyState.bullets[i]
            );
        }
    }
);


function updateEnemyCount() {

    if (!enemyCountUI) {
        return;
    }


    enemyCountUI.textContent =
        enemyState.enemies.length +
        (
            enemyState.boss
                ? " + BOSS"
                : ""
        );
}


function clearEnemyObjects() {

    enemyState.enemies
        .forEach(function(enemy) {

            if (
                enemy.el.parentNode
            ) {
                enemy.el.remove();
            }
        });


    enemyState.bullets
        .forEach(function(bullet) {

            if (
                bullet.el.parentNode
            ) {
                bullet.el.remove();
            }
        });


    enemyState.powerUps
        .forEach(function(power) {

            if (
                power.el.parentNode
            ) {
                power.el.remove();
            }
        });


    if (
        enemyState.boss &&
        enemyState.boss.el.parentNode
    ) {

        enemyState.boss.el.remove();
    }


    enemyState.enemies = [];
    enemyState.bullets = [];
    enemyState.powerUps = [];

    enemyState.boss = null;

    enemyState.bossActive = false;


    if (bossHUD) {
        bossHUD.style.display =
            "none";
    }
}


function resetEnemySystem() {

    clearEnemyObjects();


    enemyState.wave = 1;

    enemyState.spawnTimer = 0;

    enemyState.waveTimer = 0;

    enemyState.running = true;


    if (
        window.NebulaGame &&
        window.NebulaGame.setWave
    ) {

        window.NebulaGame
            .setWave(1);
    }


    updateEnemyCount();
}


window.resetEnemySystem =
    resetEnemySystem;


function enemyLoop() {

    if (gameRunning()) {

        enemyState.running =
            true;


        if (
            !enemyState.bossActive
        ) {

            enemyState.spawnTimer++;


            const delay =
                Math.max(
                    85,
                    190 -
                    enemyState.wave * 4
                );


            if (

                enemyState.spawnTimer >=
                delay &&

                enemyState.enemies.length <
                8

            ) {

                spawnEnemies();

                enemyState.spawnTimer = 0;
            }
        }


        updateEnemies();

        updateEnemyBullets();

        updatePowerUps();

        checkPlayerBullets();


        if (
            enemyState.bossActive
        ) {

            updateBoss();
        }


        updateWave();

        updateEnemyCount();

    } else {

        enemyState.running =
            false;
    }


    requestAnimationFrame(
        enemyLoop
    );
}


enemyLoop();