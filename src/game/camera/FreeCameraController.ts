import * as THREE from "three"
import { InputController } from "../InputController"
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js"
import { CameraController } from "./CameraController"

export class FreeCameraController implements CameraController {
	private pointerLockControls: PointerLockControls
	private inputController: InputController
	private camera: THREE.Camera

	public static readonly SPEED = 7

	constructor(args: {
		inputController: InputController
		camera: THREE.Camera
		domElement: HTMLElement
	}) {
		this.inputController = args.inputController
		this.camera = args.camera

		this.pointerLockControls = new PointerLockControls(
			this.camera,
			document.body
		)
		args.domElement.addEventListener("click", () => {
			this.pointerLockControls.lock()
		})
	}

	/** Object should be added to the scene. */
	get object() {
		return this.pointerLockControls.object
	}

	update(timeElapsedS: number) {
		const moveAmount = FreeCameraController.SPEED * timeElapsedS

		const forward = this.pointerLockControls.getDirection(new THREE.Vector3())
		const forwardAmount =
			moveAmount *
			((this.inputController.keys["w"] ? 1 : 0) +
				(this.inputController.keys["s"] ? -1 : 0))
		this.camera.position.add(forward.clone().multiplyScalar(forwardAmount))

		// Calculating right/up vectors: https://gamedev.stackexchange.com/a/139704
		const worldUp = new THREE.Vector3(0, 1, 0)
		const right = forward.clone().cross(worldUp).normalize()
		const strafeAmount =
			moveAmount *
			((this.inputController.keys["d"] ? 1 : 0) +
				(this.inputController.keys["a"] ? -1 : 0))
		this.camera.position.add(right.clone().multiplyScalar(strafeAmount))

		const up = right.clone().cross(forward).normalize()
		const verticalAmount =
			moveAmount *
			((this.inputController.keys["q"] ? 1 : 0) +
				(this.inputController.keys["e"] ? -1 : 0))
		this.camera.position.add(up.clone().multiplyScalar(verticalAmount))
	}
}
