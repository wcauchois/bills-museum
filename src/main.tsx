import "./style.css"

import { Game } from "./game/Game"
import { worker } from "./worker/workerClient"
import { createRoot } from "react-dom/client"
import { App } from "./ui/App"

/*
const form = document.getElementById("form")!
const container = document.getElementById("container")!
form.addEventListener("submit", e => {
	e.preventDefault()
	container.remove()

	const textValue = (
		form.querySelector("input[type='text']")! as HTMLInputElement
	).value

	const game = new Game({
		queryString: textValue,
	})
	;(window as any).__game = game
	game.start()
})
	*/

createRoot(document.getElementById("app")!).render(<App />)
