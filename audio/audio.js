const NebulaAudio = {
    sounds: {},
    music: null,
    enabled: true,
    wrapped: false,
    lastShotSound: 0,
    gameOverPlayed: false,
    bossWasPresent: false,

    init() {
        const names = [
            "shoot",
            "hit",
            "emp",
            "powerup",
            "boss-warning",
            "explosion",
            "game-over",
            "victory"
        ];

        names.forEach(function(name) {
            const audio = new Audio("audio/" + name + ".wav");
            audio.preload = "auto";
            NebulaAudio.sounds[name] = audio;
        });

        NebulaAudio.music = new Audio("audio/bg-music.wav");
        NebulaAudio.music.loop = true;
        NebulaAudio.music.volume = 0.16;

        NebulaAudio.setupControls();
        NebulaAudio.watchGame();
    },

    play(name, volume = 0.35) {
        if (!this.enabled || !this.sounds[name]) return;

        const sound = this.sounds[name].cloneNode();
        sound.volume = volume;
        sound.play().catch(function() {});
    },

    startMusic() {
        if (!this.music || !this.enabled) return;

        this.music.play().catch(function() {});
    },

    stopMusic() {
        if (!this.music) return;

        this.music.pause();
        this.music.currentTime = 0;
    },

    setupControls() {
        const startBtn = document.getElementById("start-btn");
        const restartBtn = document.getElementById("restart-btn");

        if (startBtn) {
            startBtn.addEventListener("click", function() {
                NebulaAudio.startMusic();
                NebulaAudio.gameOverPlayed = false;
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener("click", function() {
                NebulaAudio.startMusic();
                NebulaAudio.gameOverPlayed = false;
            });
        }

        window.addEventListener("nebula-emp", function() {
            NebulaAudio.play("emp", 0.4);
        });
    },

    watchGame() {
        const gameArea = document.getElementById("game-area");
        const player = document.getElementById("player");

        if (gameArea) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (!node.classList) return;

                        if (node.classList.contains("bullet")) {
                            const now = Date.now();

                            if (now - NebulaAudio.lastShotSound > 45) {
                                NebulaAudio.play("shoot", 0.25);
                                NebulaAudio.lastShotSound = now;
                            }
                        }

                        if (node.classList.contains("boss-ship")) {
                            NebulaAudio.bossWasPresent = true;
                            NebulaAudio.play("boss-warning", 0.5);
                        }
                    });

                    mutation.removedNodes.forEach(function(node) {
                        if (!node.classList) return;

                        if (node.classList.contains("boss-ship") &&
                            NebulaAudio.bossWasPresent) {
                            NebulaAudio.play("explosion", 0.5);

                            setTimeout(function() {
                                if (
                                    window.NebulaGame &&
                                    !window.NebulaGame.isRunning()
                                ) {
                                    NebulaAudio.play("victory", 0.45);
                                    NebulaAudio.stopMusic();
                                }
                            }, 30);

                            NebulaAudio.bossWasPresent = false;
                        }
                    });
                });
            });

            observer.observe(gameArea, {
                childList: true,
                subtree: false
            });
        }

        if (player) {
            const playerObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type !== "attributes") return;

                    const classes = player.classList;

                    if (classes.contains("player-damaged")) {
                        NebulaAudio.play("hit", 0.3);
                    }
                });
            });

            playerObserver.observe(player, {
                attributes: true,
                attributeFilter: ["class"]
            });
        }

        setInterval(function() {
            if (!window.NebulaGame) return;

            const gameOver = document.getElementById("game-over");
            const running = window.NebulaGame.isRunning();

            if (
                !running &&
                gameOver &&
                gameOver.style.display === "flex" &&
                !NebulaAudio.gameOverPlayed
            ) {
                NebulaAudio.gameOverPlayed = true;
                NebulaAudio.stopMusic();
                NebulaAudio.play("game-over", 0.45);
            }
        }, 100);
    },

    connectGame() {
        if (this.wrapped || !window.NebulaGame) return;

        const game = window.NebulaGame;

        if (typeof game.damagePlayer === "function") {
            const oldDamage = game.damagePlayer;

            game.damagePlayer = function(amount) {
                if (game.isRunning()) {
                    NebulaAudio.play("hit", 0.3);
                }

                oldDamage(amount);
            };
        }

        if (typeof game.collectPowerUp === "function") {
            const oldPowerUp = game.collectPowerUp;

            game.collectPowerUp = function(type) {
                NebulaAudio.play("powerup", 0.4);
                oldPowerUp(type);
            };
        }

        this.wrapped = true;
    }
};

window.NebulaAudio = NebulaAudio;

NebulaAudio.init();

setInterval(function() {
    NebulaAudio.connectGame();
}, 100);