import { atom, createStore } from "jotai"
import { atomWithStorage } from "jotai/utils"
import type { QuoteData } from "../worker/workerEntrypoint"

// https://jotai.org/docs/guides/using-store-outside-react
export const store = createStore()

export const scoreAtom = atom(0)

export const nightModeAtom = atom(false)

export const gameStateAtom = atom<"splash" | "play" | "over">("splash")

export const audioOnAtom = atomWithStorage("audioOn", true)

export const hideHelpAtom = atom(false)

export const quotesAtom = atom<QuoteData[]>([])
