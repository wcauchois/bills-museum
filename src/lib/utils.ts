import _ from "lodash"

export type Result<S, F> =
	| { type: "success"; value: S }
	| { type: "failure"; error: F }

export function unreachable(x: never): never {
	throw new Error(`Expected value never to occur: ${JSON.stringify(x)}`)
}

export interface Deferred<T> {
	promise: Promise<T>
	resolve: (arg: T) => void
	reject: (err: Error) => void
}

export function makeDeferred<T>(): Deferred<T> {
	// https://dev.to/webduvet/deferred-promise-pattern-2j59
	let resolve: (arg: T) => void
	let reject: (err: Error) => void

	const promise = new Promise<T>((resolveArg, rejectArg) => {
		resolve = resolveArg
		reject = rejectArg
	})

	return {
		promise,
		resolve: resolve!,
		reject: reject!,
	}
}

export function make2DArray<T>(
	width: number,
	height: number,
	factory: () => T
): T[][] {
	return _.range(0, height).map(() => _.range(0, width).map(() => factory()))
}

export function choose<T>(arr: T[]): T {
	return arr[_.random(0, arr.length - 1)]
}

export function chooseN<T>(arr: T[], n: number): T[] {
	return _.shuffle(arr).slice(0, n)
}

export function hasQueryParam(name: string): boolean {
	return new URL(window.location.href).searchParams.has(name)
}

export function isMobile() {
	// https://stackoverflow.com/a/29509267
	return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}
