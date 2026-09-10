const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d");

ctx.fillStyle = "red";
ctx.fillRect(200, 100, 40, 40);

const scoreElement = document.getElementById("score")
const waveElement = document.getElementById("wave")
const livesElement = document.getElementById("lives")

// ---------- Enemy ----------

const enemies = []

const enemyStats = {

    drone: {
        hp: 2,
        speed: 2,
        score: 100
    },

    shooter: {
        hp: 4,
        speed: 1,
        score: 200
    },

    chaser: {
        hp: 3,
        speed: 2.5,
        score: 300,
    },

    tank: {
        hp: 12,
        speed: 0.8,
        score: 500
    },
};

function createEnemy(type,x,y) {

    const stats = enemyStats[type];

    const enemy = {
        type: type,
        x: x,
        y: y,
        hp: stats.hp,
        speed: stats.speed,
        score: stats.score
    };

    enemies.push(enemy);
}

createEnemy("drone",100,50);
createEnemy("shooter",250,100);
createEnemy("tank",550,150);

function updateEnemies() {

    for (let i = 0; i < enemies.length; i++) {

        const enemy = enemies[i];

        enemy.y += enemy.speed;

    }
}
