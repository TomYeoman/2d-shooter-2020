import nengi from 'nengi'
import nengiConfig from '../../../common/config/nengiConfig'
import MoveCommand from '../../../common/command/MoveCommand'
import RequestJoinGame from '../../../common/command/RequestJoinGame'

const nengiClient:any = nengi

const protocolMap = new nengiClient.ProtocolMap(nengiConfig, nengiClient.metaConfig)

const address = 'ws://localhost:8079'
const numberOfBots = 10
const bots = new Map()

function connectNewBot(id:any) {
    let bot = new nengiClient.Bot(nengiConfig, protocolMap)
    bot.id = id

    bot.controls = {
        w: false,
        a: false,
        s: false,
        d: false,
        rotation: 0,
        delta: 1 / 60
    }

    bot.onConnect((response: any) => {
        console.log('Bot attempted connection, response:', response)
        bot.tick = 0
    })

    bot.onClose(() => {
        bots.delete(bot.id)
    })

    bots.set(bot.id, bot)
    bot.connect(address, {})


    const RequestJoinGameCommand = new RequestJoinGame("")
    bot.addCommand(RequestJoinGameCommand)
    bot.update()

}

for (let i = 0; i < numberOfBots; i++) {
    connectNewBot(i)
}

function randomBool() {
    return Math.random() > 0.5
}

const loop = function () {
    bots.forEach(bot => {
        if (bot.websocket) {
            bot.readNetwork()
            // small percent chance of changing which keys are being held down
            // this causes the bots to travel in straight lines, for the most part
            if (Math.random() > 0.95) {
                bot.controls = {
                    w: randomBool(),
                    a: randomBool(),
                    s: randomBool(),
                    d: randomBool(),
                    rotation: Math.random() * Math.PI * 2,
                    delta: 1 / 60
                }
            }

            const input = new MoveCommand(
                bot.controls.w,
                bot.controls.a,
                bot.controls.s,
                bot.controls.d,
                bot.controls.rotation,
                bot.controls.delta
            )

            if (Math.random() > 0.7) {
                // bot.addCommand(new FireCommand(500, 500))
            }
            bot.addCommand(input)
            bot.update()
            bot.tick++
        }
    })
}

setInterval(loop, 16)
