export const config = {
    zombies: {
        waveLength: 10,
        initialAmount: 10,
        // Zombies added per wave passed
        perWave : 5,
        // Zombies per actively participating player
        perPlayer: 100,
        timeoutBetweenWave: 3,
        // Start high, and modify as rounds pass
        spawnRate: 0.1,
            // Start low, and modify as rounds pass
        maxCount:  200,
        maxRounds:  10,
    }
};