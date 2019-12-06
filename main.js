window.onload = main;

// module aliases
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Vector = Matter.Vector,
    Body = Matter.Body,
    Bounds = Matter.Bounds,
    Bodies = Matter.Bodies;

const MAX_INPUT_MAGNITUDE = 0.002;
const INPUT_MAGNITUDE = 0.002;
const DASH_MULTIPLIER = 20;
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

function capMagnitude(vec, maxMagnitude) {
    const magnitude = Vector.magnitude(vec);
    if (magnitude <= maxMagnitude)
        return vec;
    return Vector.mult(vec, maxMagnitude / magnitude);
}

function createPlayer(x, y, fillStyle) {
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

function main() {

    // create an engine
    let engine = Engine.create();

    // create a renderer
    let render = Render.create({
        element: document.getElementById("renderer"),
        engine: engine,
        options: {
            height: 600,
            width: 600,
            wireframes: false,
            background: "#222222",
        }
    });

    // create two boxes and a ground
    let player = createPlayer(300, 500, "blue");
    let enemy = createPlayer(300, 100, "red");
    let arena = Bodies.rectangle(300, 300, 500, 500, {render: {fillStyle: "#dddddd"}});
    arena.collisionFilter.mask = 0;
    // var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

    // add all of the bodies to the world
    World.add(engine.world, [arena, enemy, player]);
    engine.world.gravity.y = 0;

    // run the engine
    Engine.run(engine);

    // // run the renderer
    Render.run(render);

    // let upDownKeys = new Set(["KeyW", "KeyS"]);
    // let leftRightKeys = new Set(["KeyA", "KeyD"]);
    // let directionKeys = new Set([...upDownKeys, ...leftRightKeys]);
    let heldKeys = new Set([]);
    let dashAvailable = true;

    document.addEventListener("keydown", event => {
        console.log("keydown: "+event.code);
        heldKeys.add(event.code);
    });
    document.addEventListener("keyup", event => {
        heldKeys.delete(event.code);
        if (event.code === DASH_KEY) {
            dashAvailable = true;
        }
    });

    let gameOver = false;


    let nn = new NeuralNetwork(8, 10, 5);
    let iter = 0;
    (function run() {
        if (!gameOver && !Bounds.contains(arena.bounds, player.position)) {
            gameOver = true;
            alert("You Lose!");
        }
        if (!gameOver && !Bounds.contains(arena.bounds, enemy.position)) {
            gameOver = true;
            alert("You Win!");
        }

        if (!gameOver) {
            // iter = (iter+1)%120;
            if (iter === 0) {
            
                // Inputs
                let px = player.position.x;
                let py = player.position.y;
                let pvx = player.velocity.x;
                let pvy = player.velocity.y;
                let ex = enemy.position.x;
                let ey = enemy.position.y;
                let evx = enemy.velocity.x;
                let evy = enemy.velocity.y;
                let input = [px, py, pvx, pvy, ex, ey, evx, evy];

                // Output
                let output = nn.feedForward(input);
                // console.table(output.data[0]);

                let outputKeys = output.data[0].map(x => Math.round(x));
                let dashKeyHeld = outputKeys[4];

                // console.table([wHeld, aHeld, sHeld, dHeld, spaceHeld]);
                if (heldKeys.has(DASH_KEY) && !dashKeyHeld) { // Releasing dash key
                    dashAvailable = true;
                }
                heldKeys.clear();
                for (const [key_index, held] of outputKeys.entries()) {
                    if (held)
                        heldKeys.add(INPUT_KEYS[key_index]);
                }
                console.log(heldKeys);
            }
        }


        let inputForce = Vector.create(0,0);
        for (let key of INPUT_KEYS) {
            // console.log(key in DIRECTION_VECTORS.keys());
            if (heldKeys.has(key) && (key in DIRECTION_VECTORS)) {
                inputForce = Vector.add(inputForce, DIRECTION_VECTORS[key]);
            }
        }
        inputForce = capMagnitude(inputForce, MAX_INPUT_MAGNITUDE);
        Body.applyForce(player, player.position, inputForce);

        if (heldKeys.has(DASH_KEY) && dashAvailable) {
            let dashVector = Vector.mult(inputForce, DASH_MULTIPLIER);
            Body.applyForce(player, player.position, dashVector);
            heldKeys.delete(DASH_KEY);
            dashAvailable = false;
        }
        window.requestAnimationFrame(run);
        Engine.update(engine, 1000 / 60);
    })();
}