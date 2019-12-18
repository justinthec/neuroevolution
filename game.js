// module aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Vector = Matter.Vector,
      Body = Matter.Body,
      Bounds = Matter.Bounds,
      Composite = Matter.Composite,
      Bodies = Matter.Bodies;

const MAX_INPUT_MAGNITUDE = 0.002;
const INPUT_MAGNITUDE = 0.002;
const DASH_MULTIPLIER = 20;
const IDLE_TIMEOUT_DURATION = 1000;
const GAME_TIMEOUT_DURATION = 5000;
const UP_KEY = "KeyW";
const LEFT_KEY = "KeyA";
const DOWN_KEY = "KeyS";
const RIGHT_KEY = "KeyD";
const DASH_KEY = "Space";
const INPUT_KEYS = [UP_KEY, LEFT_KEY, DOWN_KEY, RIGHT_KEY, DASH_KEY];
const DIRECTION_VECTORS = {
    [UP_KEY]: Vector.create(0, -INPUT_MAGNITUDE),
    [LEFT_KEY]: Vector.create(-INPUT_MAGNITUDE, 0),
    [DOWN_KEY]: Vector.create(0, INPUT_MAGNITUDE),
    [RIGHT_KEY]: Vector.create(INPUT_MAGNITUDE, 0)
};


class Game {
    constructor(engine, genome, enemyStartingPos, isMaxSpeed) {
        this.engine = engine;
        this.genome = genome;
        // create player
        this.player = this.createPlayer(300, 300, "blue");
        this.playerHeldKeys = new Set([]);
        this.playerDashAvailable = true;

        // create enemy
        // const enemyX = Math.random() * 500 + 51;
        this.enemy = this.createPlayer(0, 0, "red");
        Body.setPosition(this.enemy, enemyStartingPos);

        // create arena
        this.arena = Bodies.rectangle(300, 300, 500, 500, {render: {fillStyle: "#dddddd"}});
        this.arena.collisionFilter.mask = 0; // No collisions

        // add all of the bodies to the world
        World.add(this.engine.world, [this.arena, this.enemy, this.player]);

        // general game settings
        this.engine.world.gravity.y = 0;
        this.isMaxSpeed = isMaxSpeed;
        this.gameOver = false;
    }

    run() {
        // console.log("starting game");
        return new Promise(resolve => {
            // document.addEventListener("keydown", event => {
            //     console.log("keydown: "+event.code);
            //     heldKeys.add(event.code);
            // });
            // document.addEventListener("keyup", event => {
            //     heldKeys.delete(event.code);
            //     if (event.code === DASH_KEY) {
            //         dashAvailable = true;
            //     }
            // });
            // let iter = 0;
            // Setup
            this.prevPlayerX = Math.round(this.player.position.x);
            this.prevPlayerY = Math.round(this.player.position.y);
            this.idleTimerOn = false;
            this.gameDeadline = this.engine.timing.timestamp + GAME_TIMEOUT_DURATION;
            this.idleDeadline = Math.inf;
            this.resolve = resolve;
            if (this.isMaxSpeed) {
                while (!this.gameOver) {
                    this.tick.bind(this, false)();
                // setInterval(this.tick.bind(this, false), 0);
                }
            } else {
                this.rAFId = window.requestAnimationFrame(this.tick.bind(this, true));
            }
            return;
            // Game is now running
        });
    }

    tick(selfCall) {
        if (DEBUG) {
            console.log("Tick:", this.engine.timing.timestamp);
            console.log("Enemy:", Object.values(this.enemy.position).join(","));
            console.log("Player:", Object.values(this.player.position).join(","));
        }
        // Check for Timeouts
        const curTime = this.engine.timing.timestamp;
        if (curTime > this.gameDeadline || (this.idleTimerOn && curTime > this.idleDeadline)) {
            this.gameOver = true;
            // alert("You Lose!");
            console.log("Timeout...");
            this.cleanup();
            this.resolve(false);
            return;
        }
        // Idle Timer
        if (Math.round(this.player.position.x) == this.prevPlayerX 
            && Math.round(this.player.position.y) == this.prevPlayerY) {
            if (!this.idleTimerOn) {
                this.idleTimerOn = true;
                this.idleDeadline = curTime + IDLE_TIMEOUT_DURATION;
            }
        } else {
            this.idleTimerOn = false;
        }
        if (!this.gameOver && !Bounds.contains(this.arena.bounds, this.player.position)) {
            this.gameOver = true;
            // alert("You Lose!");
            console.log("LOSER!");
            this.cleanup();
            this.resolve(false);
            return;
        }
        if (!this.gameOver && !Bounds.contains(this.arena.bounds, this.enemy.position)) {
            this.gameOver = true;
            // alert("You Win!");
            // console.log("WINNER!");
            console.log("WINNER!: "+Array.from(this.playerHeldKeys).toString());
            this.cleanup();
            this.resolve(true);
            return;
        }

        // Get Player Held Keys
        if (!this.gameOver) {
            // iter = (iter+1)%120;
            // Inputs
            const px = this.player.position.x;
            const py = this.player.position.y;
            const pvx = this.player.velocity.x;
            const pvy = this.player.velocity.y;
            const ex = this.enemy.position.x;
            const ey = this.enemy.position.y;
            const evx = this.enemy.velocity.x;
            const evy = this.enemy.velocity.y;
            // const input = [px, py, pvx, pvy, ex, ey, evx, evy];
            const input = [px, py, ex, ey];
            // Normalize input coords
            const normal_input = input.map(x => (x-300)/300);


            // Output
            const outputKeys = this.genome.getHeldKeys(normal_input);
            // const dashKeyHeld = outputKeys[4];

            // if (this.playerHeldKeys.has(DASH_KEY) && !dashKeyHeld) { // Releasing dash key
            //     this.playerDashAvailable = true;
            // }
            this.playerHeldKeys.clear();
            for (let [key_index, held] of outputKeys.entries()) {
                if (held) {
                    this.playerHeldKeys.add(INPUT_KEYS[key_index]);
                }
            }
        }

        // Apply Movement Forces to player
        let inputForce = Vector.create(0,0);
        for (const key of INPUT_KEYS) {
            // console.log(key in DIRECTION_VECTORS.keys());
            if (this.playerHeldKeys.has(key) && (key in DIRECTION_VECTORS)) {
                inputForce = Vector.add(inputForce, DIRECTION_VECTORS[key]);
            }
        }
        inputForce = this.capMagnitude(inputForce, MAX_INPUT_MAGNITUDE);
        Body.applyForce(this.player, this.player.position, inputForce);

        // Apply Dash Force to player
        if (this.playerHeldKeys.has(DASH_KEY) && this.playerDashAvailable) {
            const dashVector = Vector.mult(inputForce, DASH_MULTIPLIER);
            Body.applyForce(this.player, this.player.position, dashVector);
            this.playerHeldKeys.delete(DASH_KEY);
            this.playerDashAvailable = false;
        }
        this.prevPlayerX = Math.round(this.player.position.x);
        this.prevPlayerY = Math.round(this.player.position.y);
        Engine.update(this.engine, 1000/60);
        if (selfCall) {
            this.rAFId = window.requestAnimationFrame(this.tick.bind(this, true));
        }
    }

    cleanup() {
        Composite.remove(this.engine.world, this.arena);
        Composite.remove(this.engine.world, this.player);
        Composite.remove(this.engine.world, this.enemy);
        Engine.clear(this.engine);
        window.cancelAnimationFrame(this.rAFId);
    }

    capMagnitude(vec, maxMagnitude) {
        const magnitude = Vector.magnitude(vec);
        if (magnitude <= maxMagnitude)
            return vec;
        return Vector.mult(vec, maxMagnitude / magnitude);
    }

    createPlayer(x, y, fillStyle) {
        let player = Bodies.circle(x, y, 20, {
            render: {
                fillStyle: fillStyle,
            }
        });
        // Body.setDensity(player, 0.001);
        player.frictionAir = 0.05;
        player.restitution = 0.99999;
        return player;
    }
}