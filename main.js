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

    let up = Vector.create(0, -INPUT_MAGNITUDE);
    let left = Vector.create(-INPUT_MAGNITUDE, 0);
    let down = Vector.create(0, INPUT_MAGNITUDE);
    let right = Vector.create(INPUT_MAGNITUDE, 0);
    // let upDownKeys = new Set(["KeyW", "KeyS"]);
    // let leftRightKeys = new Set(["KeyA", "KeyD"]);
    // let directionKeys = new Set([...upDownKeys, ...leftRightKeys]);
    let heldKeys = new Set([]);
    let dashUp = true;

    document.addEventListener("keydown", event => {
        console.log("keydown: "+event.code);
        heldKeys.add(event.code);
    });
    document.addEventListener("keyup", event => {
        heldKeys.delete(event.code);
        if (event.code === "Space") {
            dashUp = true;
        }
    });

    let gameOver = false;
    (function run() {
        if (!gameOver && !Bounds.contains(arena.bounds, player.position)) {
            gameOver = true;
            alert("You Lose!");
        }
        if (!gameOver && !Bounds.contains(arena.bounds, enemy.position)) {
            gameOver = true;
            alert("You Win!");
        }


        let inputForce = Vector.create(0,0);
        if (heldKeys.has("KeyW"))
            inputForce = Vector.add(inputForce, up);
        if (heldKeys.has("KeyA"))
            inputForce = Vector.add(inputForce, left);
        if (heldKeys.has("KeyS"))
            inputForce = Vector.add(inputForce, down);
        if (heldKeys.has("KeyD"))
            inputForce = Vector.add(inputForce, right);
        inputForce = capMagnitude(inputForce, MAX_INPUT_MAGNITUDE);
        Body.applyForce(player, player.position, inputForce);

        if (heldKeys.has("Space") && dashUp) {
            let dashVector = Vector.mult(inputForce, DASH_MULTIPLIER);
            Body.applyForce(player, player.position, dashVector);
            heldKeys.delete("Space");
            dashUp = false;
        }
        window.requestAnimationFrame(run);
        Engine.update(engine, 1000 / 60);
    })();
}