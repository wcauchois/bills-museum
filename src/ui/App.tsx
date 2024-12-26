import { ReactNode, useState } from "react"
import { Game } from "../game/Game"
import { Provider, useAtom, useAtomValue } from "jotai"
import {
	audioOnAtom,
	gameStateAtom,
	nightModeAtom,
	scoreAtom,
	store,
} from "./state"
import clsx from "clsx"
import React from "react"
import Sentiment from "sentiment"

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
			<div className="w-[650px] min-h-[300px] text-white text-xl text-center border p-3 rounded border-white flex flex-col justify-center">
				{props.children}
			</div>
		</div>
	)
}

function Button(props: {
	onClick?: () => void
	children?: ReactNode
	as?: "div" | "input"
	type?: "submit"
	value?: string
	className?: string
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

function GameOverScreen() {
	return (
		<CenteredDialog>
			<div className="flex flex-col items-center gap-3">
				<div className="text-2xl font-semibold italic">You win</div>
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

	return (
		<>
			{gameState === "splash" && (
				<SplashScreen onNext={() => setGameState("play")} />
			)}
			{gameState === "play" && <ScoreDisplay />}
			{gameState === "over" && <GameOverScreen />}
		</>
	)
}
export function App() {
	return (
		<Provider store={store}>
			<AppInner />
		</Provider>
	)
}
