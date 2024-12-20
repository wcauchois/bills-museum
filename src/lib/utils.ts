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
