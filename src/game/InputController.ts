/**
 * https://mdn.github.io/dom-examples/pointer-lock/
 */
export class InputController {
	private canvas: HTMLCanvasElement
	public keys: Record<string, boolean> = {}
	public mouseDeltaX: number = 0
	public mouseDeltaY: number = 0

	resetMouseDelta() {
		this.mouseDeltaX = 0
		this.mouseDeltaY = 0
	}

	constructor(
		canvas: HTMLCanvasElement,
		options: { managePointerLock: boolean }
	) {
		this.canvas = canvas

		if (options.managePointerLock) {
			canvas.addEventListener("click", async () => {
				if (!document.pointerLockElement) {
					try {
						await canvas.requestPointerLock({
							unadjustedMovement: true,
						})
					} catch (error) {
						if ((error as any).name === "NotSupportedError") {
							// Platform may not support unadjusted movement.
							await canvas.requestPointerLock()
						} else {
							throw error
						}
					}
				}
			})
			document.addEventListener("pointerlockchange", this.onPointerLockChange)
		}

		document.addEventListener("keydown", this.onKeyDown)
		document.addEventListener("keyup", this.onKeyUp)
	}

	private onPointerLockChange = (evt: Event) => {
		if (document.pointerLockElement === this.canvas) {
			document.addEventListener("mousemove", this.onMouseMove)
		} else {
			document.removeEventListener("mousemove", this.onMouseMove)
		}
	}

	private onMouseMove = (evt: MouseEvent) => {
		this.mouseDeltaX += evt.movementX
		this.mouseDeltaY += evt.movementY
	}

	private onKeyDown = (evt: KeyboardEvent) => {
		this.keys[evt.key] = true
	}

	private onKeyUp = (evt: KeyboardEvent) => {
		this.keys[evt.key] = false
	}
}
