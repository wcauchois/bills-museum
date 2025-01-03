import * as THREE from "three"
import { clamp } from "lodash"
import { InputController } from "../InputController"
import { CameraController } from "./CameraController"
import _ from "lodash"
import { AudioManager } from "../AudioManager"
import { hideHelpAtom, store } from "../../ui/state"

/**
 * https://www.youtube.com/watch?v=oqKzxPMLWxo
 */
export class WalkingCameraController implements CameraController {
	private camera: THREE.Camera
	private rotation: THREE.Quaternion
	public translation: THREE.Vector3
	private phi: number
	private theta: number
	private input: InputController
	private headBobActive: boolean
	private headBobTimer: number
	private isJumping: boolean
	private velocityY: number
	private floorY: number
	private audioManager: AudioManager

	constructor(args: {
		inputController: InputController
		camera: THREE.Camera
		initialPosition: THREE.Vector3
		initialYRotation: number
		audioManager: AudioManager
	}) {
		this.input = args.inputController
		this.camera = args.camera
		this.rotation = new THREE.Quaternion()
		this.translation = args.initialPosition.clone()
		this.floorY = args.initialPosition.y
		this.phi = args.initialYRotation
		this.theta = 0
		this.headBobActive = false
		this.headBobTimer = 0
		this.isJumping = false
		this.velocityY = 0
		this.audioManager = args.audioManager
	}

	update(timeElapsedS: number) {
		this.updateRotation()
		this.updateTranslation(timeElapsedS)
		this.updateHeadBob(timeElapsedS)
		this.updateJump()
		this.updateCamera()
		this.playFootsteps(timeElapsedS)
	}

	private nextFootstep = 0
	private playFootsteps(timeElapsedS: number) {
		if (!this.headBobActive) {
			return
		}

		if (this.nextFootstep <= 0) {
			this.audioManager.playOnce("footstep", {
				volume: 2,
			})
			this.nextFootstep = 0.4 + Math.random() * 0.1
		}
		this.nextFootstep -= timeElapsedS
	}

	private updateCamera() {
		this.camera.quaternion.copy(this.rotation)
		this.camera.position.copy(this.translation)
		this.camera.position.y += Math.sin(this.headBobTimer * 10) * 0.2
	}

	private simulateJumpPhysicsThrottled = _.throttle(() => {
		this.translation.y += this.velocityY
		this.velocityY -= 0.02
	}, 16)

	private whichJumpSound = false
	private updateJump() {
		if (!this.isJumping) {
			if (this.input.keys[" "]) {
				this.isJumping = true
				this.velocityY = 0.25
				this.audioManager.playOnce(this.whichJumpSound ? "jump1" : "jump2")
				this.whichJumpSound = !this.whichJumpSound
			}
		} else {
			this.simulateJumpPhysicsThrottled()
			if (this.translation.y < this.floorY) {
				this.translation.y = this.floorY
				this.isJumping = false
				this.velocityY = 0
			}
		}
	}

	private updateHeadBob(timeElapsedS: number) {
		if (this.headBobActive) {
			const wavelength = Math.PI
			const nextStep =
				1 + Math.floor(((this.headBobTimer + 0.000001) * 10) / wavelength)
			const nextStepTime = (nextStep * wavelength) / 10
			this.headBobTimer = Math.min(
				this.headBobTimer + timeElapsedS,
				nextStepTime
			)

			if (this.headBobTimer === nextStepTime) {
				this.headBobActive = false
			}
		}
	}

	private updateTranslation(timeElapsedS: number) {
		const forwardVelocity =
			(this.input.keys["w"] || this.input.keys["ArrowUp"] ? 1 : 0) +
			(this.input.keys["s"] || this.input.keys["ArrowDown"] ? -1 : 0)
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

		const angularVelocity =
			(this.input.keys["ArrowLeft"] ? 1 : 0) +
			(this.input.keys["ArrowRight"] ? -1 : 0)
		this.phi += angularVelocity * timeElapsedS * 5

		if (forwardVelocity !== 0 || strafeVelocity !== 0) {
			this.headBobActive = true
			store.set(hideHelpAtom, () => true)
		}
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
