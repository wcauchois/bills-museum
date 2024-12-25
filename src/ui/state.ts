import { atom, createStore } from "jotai"

// https://jotai.org/docs/guides/using-store-outside-react
export const store = createStore()

export const scoreAtom = atom(0)

export const nightModeAtom = atom(false)
