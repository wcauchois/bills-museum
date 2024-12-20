import { clamp } from "lodash"
import "./style.css"

import { worker } from "./worker/workerClient"
import * as THREE from "three"

// console.log(await worker.getRelevantQuotes("death"))

const scene = new THREE.Scene()
;(window as any).globalScene = scene

const light = new THREE.DirectionalLight(0xd5deff)
light.position.x = 4
light.position.y = 5
light.position.z = 1
scene.add(light)
// const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
// scene.add(light)

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshLambertMaterial({
	color: 0x00ff00,
})
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

/**
 * https://mdn.github.io/dom-examples/pointer-lock/
 */
class InputController {
	private canvas: HTMLCanvasElement
	public keys: Record<string, boolean> = {}
	public mouseDeltaX: number = 0
	public mouseDeltaY: number = 0

	resetMouseDelta() {
		this.mouseDeltaX = 0
		this.mouseDeltaY = 0
	}

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas

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

/**
 * https://www.youtube.com/watch?v=oqKzxPMLWxo
 */
class FirstPersonCamera {
	private camera: THREE.Camera
	private rotation: THREE.Quaternion
	private translation: THREE.Vector3
	private phi: number
	private theta: number
	private input: InputController

	constructor(inputController: InputController, camera: THREE.Camera) {
		this.input = inputController
		this.camera = camera
		this.rotation = new THREE.Quaternion()
		this.translation = new THREE.Vector3(0, 0, 4)
		this.phi = 0
		this.theta = 0
	}

	update(timeElapsedS: number) {
		this.updateRotation()
		this.updateTranslation(timeElapsedS)

		this.updateCamera()
	}

	private updateCamera() {
		this.camera.quaternion.copy(this.rotation)
		this.camera.position.copy(this.translation)
	}

	private updateTranslation(timeElapsedS: number) {
		const forwardVelocity =
			(this.input.keys["w"] ? 1 : 0) + (this.input.keys["s"] ? -1 : 0)
		const strafeVelocity =
			(this.input.keys["a"] ? 1 : 0) + (this.input.keys["d"] ? -1 : 0)

		const qx = new THREE.Quaternion()
		qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi)

		const forward = new THREE.Vector3(0, 0, -1)
		forward.applyQuaternion(qx)
		forward.multiplyScalar(forwardVelocity * timeElapsedS * 10)

		const left = new THREE.Vector3(-1, 0, 0)
		left.applyQuaternion(qx)
		left.multiplyScalar(strafeVelocity * timeElapsedS * 10)

		this.translation.add(forward)
		this.translation.add(left)
	}

	private updateRotation() {
		const xh = this.input.mouseDeltaX / window.innerWidth
		const yh = this.input.mouseDeltaY / window.innerHeight
		this.input.resetMouseDelta()

		this.phi += -xh * 5
		this.theta = clamp(this.theta + -yh * 5, -Math.PI / 3, Math.PI / 3)

		const qx = new THREE.Quaternion()
		qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi)
		const qz = new THREE.Quaternion()
		qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta)

		const q = new THREE.Quaternion()
		q.multiply(qx)
		q.multiply(qz)

		this.rotation.copy(q)
	}
}

const inputController = new InputController(renderer.domElement)
const firstPersonCamera = new FirstPersonCamera(inputController, camera)

let lastTime = 0
function animate(time: number) {
	const timeElapsedS = (time - lastTime) / 1000
	lastTime = time

	firstPersonCamera.update(timeElapsedS)
	renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)
