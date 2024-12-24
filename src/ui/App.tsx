import { useState } from "react"
import { Game } from "../game/Game"

function SplashScreen(props: { onNext: () => void }) {
	const [queryString, setQueryString] = useState("")

	return (
		<div
			id="container"
			className="w-full h-full flex flex-col items-center justify-center pointer-events-auto"
		>
			<div className="w-[650px] min-h-[300px] text-white text-xl text-center border p-3 rounded border-white flex flex-col justify-center">
				<form
					className="flex flex-col gap-3"
					id="form"
					onSubmit={e => {
						e.preventDefault()
						props.onNext()

						const game = new Game({
							queryString,
						})
						;(window as any).__game = game
						game.start()
					}}
				>
					<div className="text-2xl font-semibold italic">
						What’s on your mind?
					</div>
					<div>
						<input
							type="text"
							className="text-black p-2 min-w-[500px] rounded outline-none"
							minLength={3}
							required
							placeholder="Enter a few words"
							autoFocus={true}
							value={queryString}
							onChange={e => setQueryString(e.currentTarget.value)}
						/>
					</div>
					<div>
						<input
							type="submit"
							className="border border-white rounded px-4 py-1 cursor-pointer"
						/>
					</div>
				</form>
			</div>
		</div>
	)
}

export function App() {
	const [gameState, setGameState] = useState<"splash" | "play">("splash")

	return (
		<>
			{gameState === "splash" && (
				<SplashScreen onNext={() => setGameState("play")} />
			)}
		</>
	)
}
