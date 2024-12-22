import "./style.css"

import { Game } from "./game/Game"
import { worker } from "./worker/workerClient"

const game = new Game()
;(window as any).__game = game
game.start()

worker.getRelevantQuotes("death").then(deathQuotes => {
	console.log("Got death quotes:", deathQuotes)
})
