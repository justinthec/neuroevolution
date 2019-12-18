class Genome {
    constructor() {
        this.nn = new NeuralNetwork(4, 15, 4);
    }

    async fingerprint() {
        const message = this.genes.toString();
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return hashHex;
    }

    crossover(g2) {
        let g1 = this;
        // Make sure g1 is the higher fitness genome
        // if (g2.fitness > g1.fitness) {
        //     let tempg = g1;
        //     g1 = g2;
        //     g2 = tempg;
        // }
 
        const child = new Genome();
        const childGenes = child.genes;
        const g1Genes = g1.genes;
        const g2Genes = g2.genes;
        for (let i = 0; i < childGenes.length; i++) {
            if (Math.random() < 0.5) {
                childGenes[i] = g1Genes[i];
            } else {
                childGenes[i] = g2Genes[i];
            }
        }
        child.genes = childGenes;
        return child;
    }

    get genes() {
        // extract genes
        const genes = [...this.nn.bias0.data[0], ...this.nn.bias1.data[0]];
        for (let i = 0; i < this.nn.weights0.data.length; i++) {
            for (let j = 0; j < this.nn.weights0.data[i].length; j++) {
                genes.push(this.nn.weights0.data[i][j]);
            }
        }
        for (let i = 0; i < this.nn.weights1.data.length; i++) {
            for (let j = 0; j < this.nn.weights1.data[i].length; j++) {
                genes.push(this.nn.weights1.data[i][j]);
            }
        }
        return genes;
    }

    set genes(newGenes) {
        for (let i = 0; i < this.nn.bias0.data.length; i++) {
            for (let j = 0; j < this.nn.bias0.data[i].length; j++) {
                this.nn.bias0.data[i][j] = newGenes.shift();
            }
        }
        for (let i = 0; i < this.nn.bias1.data.length; i++) {
            for (let j = 0; j < this.nn.bias1.data[i].length; j++) {
                this.nn.bias1.data[i][j] = newGenes.shift();
            }
        }
        for (let i = 0; i < this.nn.weights0.data.length; i++) {
            for (let j = 0; j < this.nn.weights0.data[i].length; j++) {
                this.nn.weights0.data[i][j] = newGenes.shift();
            }
        }
        for (let i = 0; i < this.nn.weights1.data.length; i++) {
            for (let j = 0; j < this.nn.weights1.data[i].length; j++) {
                this.nn.weights1.data[i][j] = newGenes.shift();
            }
        }
    }

    mutate(mutationRate, mutationRange) {
        const curGenes = this.genes;
        const mutation = 2 * Math.random() * mutationRange - mutationRange;
        for (let i = 0; i < curGenes.length; i++) {
            if (Math.random() < mutationRate) {
                curGenes[i] += mutation;
            }
        }
        this.genes = curGenes;
    }

    getHeldKeys(observations) {
        let output = this.nn.feedForward(observations);
        return output.data[0].map(x => Math.round(x));
    }
}