import { ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { Game } from "../game/Game"
import { Provider, useAtom, useAtomValue } from "jotai"
import {
	audioOnAtom,
	gameStateAtom,
	hideHelpAtom,
	nightModeAtom,
	scoreAtom,
	store,
} from "./state"
import clsx from "clsx"
import React from "react"
import Sentiment from "sentiment"
import { isMobile } from "../lib/utils"

async function setNightMode(queryString: string) {
	const sentiment = new Sentiment()
	const result = sentiment.analyze(queryString)
	console.log("Sentiment analysis result:", result)
	const isPositive = result.score >= 0
	store.set(nightModeAtom, !isPositive)
}

function CenteredDialog(props: { children: ReactNode }) {
	return (
		<div className="w-full h-full flex flex-col items-center justify-center pointer-events-auto">
			<div className="w-[650px] min-h-[300px] text-white text-xl text-center border-2 p-3 rounded border-white flex flex-col justify-center">
				{props.children}
			</div>
		</div>
	)
}

function Button(props: {
	onClick?: () => void
	children?: ReactNode
	as?: "div" | "input" | "a"
	type?: "submit"
	value?: string
	className?: string
	href?: string
}) {
	return React.createElement(
		props.as ?? "div",
		{
			onClick: props.onClick,
			className: clsx(
				"border border-white rounded px-4 py-1 cursor-pointer hover:bg-gray-700",
				props.className
			),
			type: props.type,
			value: props.value,
			href: props.href,
		},
		props.as !== "input" ? props.children : undefined
	)
}

function SplashScreen(props: { onNext: () => void }) {
	const [queryString, setQueryString] = useState("")

	return (
		<CenteredDialog>
			<form
				className="flex flex-col gap-3"
				id="form"
				onSubmit={async e => {
					e.preventDefault()
					props.onNext()

					await setNightMode(queryString)

					const game = new Game({
						queryString,
					})
					;(window as any).__game = game
					game.start()
				}}
			>
				<div className="text-4xl font-semibold underline mb-4">
					Welcome to Bill’s Museum
				</div>
				<div className="text-2xl italic">What’s on your mind?</div>
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
				<div className="flex justify-center gap-3">
					<Button as="input" type="submit" value="Play" />
					<AudioButton />
				</div>
			</form>
		</CenteredDialog>
	)
}

function AudioButton() {
	const [audioOn, setAudioOn] = useAtom(audioOnAtom)

	return (
		<Button
			className="flex"
			onClick={() => {
				setAudioOn(!audioOn)
			}}
		>
			<img
				src={audioOn ? "/audio-on.svg" : "/audio-off.svg"}
				width="24"
				height="24"
				style={{ display: "block" }}
			/>
		</Button>
	)
}

function ScoreDisplay() {
	const score = useAtomValue(scoreAtom)
	const isNightMode = useAtomValue(nightModeAtom)

	return (
		<div
			className={clsx(
				"absolute top-0 right-0 w-[70px] h-[50px] rounded-bl-xl flex items-center justify-center text-green-600 text-2xl font-bold select-none",
				isNightMode ? "bg-white" : "bg-black"
			)}
		>
			{score}/5
		</div>
	)
}

function HelpText() {
	const isNightMode = useAtomValue(nightModeAtom)
	const hideHelp = useAtomValue(hideHelpAtom)

	return (
		<div
			className={clsx(
				"absolute bottom-0 w-full h-[30vh] flex items-start justify-center text-2xl select-none bg-transparent transition-opacity",
				isNightMode ? "text-white" : "text-black",
				hideHelp && "opacity-0"
			)}
			style={
				{
					// animationName: "fade-out",
					// animationDuration: "5s",
					// animationIterationCount: 1,
					// animationFillMode: "forwards",
				}
			}
		>
			Click to look around. WSAD to move.
		</div>
	)
}

function GameOverScreen() {
	return (
		<CenteredDialog>
			<div className="flex flex-col items-center gap-3">
				<div className="text-4xl font-semibold italic">You win</div>
				<div>
					You went on a tour of Bill’s Museum and collected{" "}
					{Game.NUM_MAZE_OBJECTS} objects.
				</div>
				<Button
					onClick={() => {
						location.reload()
					}}
				>
					Replay
				</Button>
			</div>
		</CenteredDialog>
	)
}

function AppInner() {
	const [gameState, setGameState] = useAtom(gameStateAtom)

	const [showEyes, setShowEyes] = useState(true)
	const onEyesDone = useCallback(() => {
		setShowEyes(false)
	}, [])

	return (
		<>
			{gameState === "splash" && (
				<SplashScreen onNext={() => setGameState("play")} />
			)}
			{gameState === "play" && (
				<>
					{showEyes && <EyesOpen onDone={onEyesDone} />}
					<ScoreDisplay />
					<HelpText />
				</>
			)}
			{gameState === "over" && <GameOverScreen />}
		</>
	)
}

function MobileMessage() {
	const subject = `Check out Bill’s museum`
	const body = `${location.href}`
	const mailLink = `mailto:?subject=${encodeURIComponent(
		subject
	)}&body=${encodeURIComponent(body)}`
	return (
		<div className="w-full h-full flex items-center justify-center text-white text-2xl text-center flex-col gap-3 pointer-events-auto">
			<div>Sorry, this game doesn’t work on mobile</div>
			<Button as="a" href={mailLink}>
				Email a link to yourself
			</Button>
		</div>
	)
}

function easeOutQuint(x: number): number {
	return 1 - Math.pow(1 - x, 5)
}

function EyesOpen(props: { onDone(): void }) {
	const { onDone } = props

	const canvasRef = useRef<HTMLCanvasElement>(null)

	const [w] = useState(() => window.innerWidth)
	const [h] = useState(() => window.innerHeight)

	useEffect(() => {
		const w2 = w / 2
		const h2 = h / 2

		let startTime = Date.now()
		let animationHandle = 0
		const durationS = 0.8
		function animate() {
			const seconds = (Date.now() - startTime) / 1000
			const t = easeOutQuint(Math.min(1, seconds / durationS))

			const ctx = canvasRef.current!.getContext("2d")!
			// ctx.strokeStyle = "white"
			ctx.fillStyle = "black"
			ctx.resetTransform()

			ctx.clearRect(0, 0, w, h)

			ctx.translate(-w2, -h2)
			ctx.scale(2, 2)

			ctx.beginPath()
			ctx.moveTo(0, h2)
			ctx.lineTo(0, 0)
			ctx.lineTo(w, 0)
			ctx.lineTo(w, h2)
			ctx.bezierCurveTo(w2, h2 - t * h2, w2, h2 - t * h2, 0, h2)
			ctx.fill()

			ctx.beginPath()
			ctx.moveTo(0, h2)
			ctx.lineTo(0, h)
			ctx.lineTo(w, h)
			ctx.lineTo(w, h2)
			ctx.bezierCurveTo(w2, h2 + t * h2, w2, h2 + t * h2, 0, h2)
			ctx.fill()

			animationHandle = requestAnimationFrame(animate)

			if (t >= 1) {
				onDone()
			}
		}

		animate()
		animationHandle = requestAnimationFrame(animate)
		return () => {
			cancelAnimationFrame(animationHandle)
		}
	}, [onDone])

	return (
		<canvas ref={canvasRef} width={w} height={h} className="w-full h-full" />
	)
}

function AppWithMobileCheck() {
	return isMobile() ? <MobileMessage /> : <AppInner />
}

export function App() {
	return (
		<Provider store={store}>
			<AppWithMobileCheck />
		</Provider>
	)
}
