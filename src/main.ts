import "./style.css"

import { Game } from "./game/Game"
import { MazeGenerator } from "./game/MazeGenerator"

const game = new Game()
;(window as any).__game = game
game.start()

const maze = new MazeGenerator(4)
maze.generate()
console.log(maze.print())
