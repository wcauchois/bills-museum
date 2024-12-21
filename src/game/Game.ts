import * as THREE from "three"
import { InputController } from "./InputController"
import { FirstPersonCamera } from "./FirstPersonCamera"
import { Sky } from "three/examples/jsm/objects/Sky.js"

export class Game {
	private scene: THREE.Scene
	private renderer: THREE.WebGLRenderer
	private inputController: InputController
	private camera: THREE.PerspectiveCamera
	private firstPersonCamera: FirstPersonCamera

	constructor() {
		this.scene = new THREE.Scene()

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		)

		this.setupObjects()

		this.renderer = new THREE.WebGLRenderer()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(this.renderer.domElement)

		this.inputController = new InputController(this.renderer.domElement)
		this.firstPersonCamera = new FirstPersonCamera(
			this.inputController,
			this.camera
		)
	}

	start() {
		this.renderer.setAnimationLoop(this.animate)
	}

	private setupObjects() {
		const light = new THREE.DirectionalLight(0xd5deff)
		light.position.x = -50
		light.position.y = 50
		light.position.z = 25
		this.scene.add(light)

		const geometry = new THREE.BoxGeometry(1, 1, 1)
		const material = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			wireframe: true,
		})
		const cube = new THREE.Mesh(geometry, material)
		cube.position.x = 0
		cube.position.y = 0
		cube.position.z = 0
		this.scene.add(cube)

		const sky = new Sky()
		sky.scale.setScalar(450000)
		const phi = THREE.MathUtils.degToRad(90)
		const theta = THREE.MathUtils.degToRad(180)
		const sunPosition = new THREE.Vector3().setFromSphericalCoords(
			1,
			phi,
			theta
		)
		sky.material.uniforms.sunPosition.value = sunPosition
		this.scene.add(sky)
	}

	private lastTime: number | undefined
	private animate = (time: number) => {
		let timeElapsedS = 0
		if (this.lastTime !== undefined) {
			timeElapsedS = (time - this.lastTime) / 1000
		}
		this.lastTime = time

		this.firstPersonCamera.update(timeElapsedS)
		this.renderer.render(this.scene, this.camera)
	}
}
