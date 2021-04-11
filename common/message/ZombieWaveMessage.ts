import nengi from 'nengi'

class ZombieWaveMessage {
    constructor(
        public currentWave: number,
        public waveSize: number,
        public remainingZombiesInWave: number,
        public playersAlive: number,
        public playersTotal: number,
        public gameStatus : string
    ) {}
}

//@ts-ignore
ZombieWaveMessage.protocol = {
    currentWave: nengi.UInt8,
    waveSize: nengi.UInt16,
    remainingZombiesInWave: nengi.UInt16,
    playersAlive: nengi.UInt8,
    playersTotal: nengi.UInt8,
    gameStatus: nengi.String,
}

export default ZombieWaveMessage
