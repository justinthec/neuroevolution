// window.onload = main;

const MAX_SPEED = true;
const MAX_GENERATIONS = 20;
const POPULATION_SIZE = 50;
const CROSSOVER_CHANCE = 0.75;
const MUTATION_RATE = 0.1;
const MUTATION_RANGE = 0.5;
const DEBUG = false;
let engine;
let end = false;

async function main(seedGenome) {
    // Evolution setup

    // Create Physics Engine
    engine = Engine.create();

    // Create the renderer
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

    // // run the renderer
    Render.run(render);

    let generationFitness = [];

    // Initial genome/population and equal fitness.
    let population = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
        population.push(new Genome());
    }
    if (seedGenome) {
        population[0] = seedGenome;
    }

    // Generation Loop
    for (let generationNum = 0; generationNum < MAX_GENERATIONS; generationNum++) {
        // Genome Loop
        for (const genome of population) {
            // Game Loop
            const numGames = 4;
            // const enemyStartingPositions = [
            //     {x: 80, y: 100},
            //     {x: 200, y: 100},
            //     {x: 300, y: 100},
            //     {x: 400, y: 100},
            //     {x: 520, y: 100}
            // ];
            const enemyStartingPositions = [
                // {x: 100, y: 100},
                {x: 300, y: 100},
                {x: 500, y: 300},
                {x: 300, y: 500},
                {x: 100, y: 300},
            ];
            let wins = 0;
            let winSignature = [];
            console.log("=== New Genome ===");
            for (let i = 0; i < numGames; i++) {
                const game = new Game(engine, genome, enemyStartingPositions[i], MAX_SPEED);
                const win = await game.run();
                if (win) {
                    wins++;
                    winSignature.push(1);
                } else {
                    winSignature.push(0);
                }
                if (end) {
                    console.log("Evolution ended");
                    return;
                }
            }
            // Record fitness
            genome.fitness = wins/numGames;
            genome.winSignature = winSignature;
        }
        // Record generation fitness
        fitnessSum = population.map(x => x.fitness).reduce((a,b) => a+b, 0);
        maxFitness = Math.max(...population.map(x => x.fitness));
        generationFitness.push(fitnessSum/population.length);
        console.log("Generation "+ generationNum + ": " + generationFitness[generationFitness.length-1] + " with max fitness: "+ maxFitness +" and size "+population.length);

        // Report Best Genomes
        let bestGenomes = population.filter(x => x.fitness === maxFitness);
        console.log("Genetic Diversity:")
        for (const genome of bestGenomes) {
            console.log(genome.winSignature);
        }
        let randIndex = Math.floor(Math.random()*bestGenomes.length);
        console.log(`Random Top Genome with a signature of ${bestGenomes[randIndex].winSignature}:`);
        console.log(bestGenomes[randIndex].genes.toString());

        // Select new genomes based on fitness
        let matingPool = population.sort((a,b) => b.fitness - a.fitness);
        matingPool = matingPool.slice(0, matingPool.length*0.9);
        population = [];
        // Preserve Elitism
        for (let i = 0; i < POPULATION_SIZE * 0.2; i++) {
            population.push(matingPool[i]);
        }
        // Breeding
        for (let i = 0; i < POPULATION_SIZE * 0.4; i++) {
            let randIndex = Math.floor(Math.random()*matingPool.length);
            const g1 = matingPool[randIndex];
            // Crossover
            let child;
            if (Math.random() < CROSSOVER_CHANCE) {
                randIndex = Math.floor(Math.random()*matingPool.length);
                const g2 = matingPool[randIndex];
                child = g1.crossover(g2);
            } else {
                child = new Genome();
                child.genes = g1.genes;
            }
            // Mutation
            child.mutate(MUTATION_RATE, MUTATION_RANGE);

            population.push(child);
        }
        // Random genomes
        for (let i = 0; i < POPULATION_SIZE * 0.4; i++) {
            population.push(new Genome());
        }
        // population for next generation finalized
    }
}

async function testAgent(genes) {
    const genome = new Genome();
    genome.genes = genes;
    const numGames = 5;
    const enemyStartingPositions = [
        {x: 100, y: 100},
        {x: 300, y: 100},
        {x: 500, y: 300},
        {x: 300, y: 500},
        {x: 100, y: 300},
    ];
    let wins = 0;
    for (let i = 0; i < numGames; i++) {
        const game = new Game(engine, genome, enemyStartingPositions[i], false);
        const win = await game.run();
        if (win)
            wins++;
    }
    console.log("Winrate: "+wins/numGames);
}