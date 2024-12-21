import * as THREE from "three"
import { InputController } from "./InputController"
import { Sky } from "three/examples/jsm/objects/Sky.js"
import { MazeGenerator } from "./MazeGenerator"
import { Direction2D, DirectionName } from "./Direction2D"
import { CameraController } from "./camera/CameraController"
import { FreeCameraController } from "./camera/FreeCameraController"
import { WalkingCameraController } from "./camera/WalkingCameraController"

const FREE_CAMERA = true

export class Game {
	private scene: THREE.Scene
	private renderer: THREE.WebGLRenderer
	private camera: THREE.PerspectiveCamera
	private inputController: InputController
	private cameraController: CameraController

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

		this.inputController = new InputController(this.renderer.domElement, {
			managePointerLock: !FREE_CAMERA,
		})

		this.cameraController = FREE_CAMERA
			? new FreeCameraController({
					camera: this.camera,
					inputController: this.inputController,
					domElement: this.renderer.domElement,
			  })
			: new WalkingCameraController({
					camera: this.camera,
					inputController: this.inputController,
			  })
	}

	start() {
		this.renderer.setAnimationLoop(this.animate)
	}

	private pointLight!: THREE.PointLight

	private setupObjects() {
		// const light = new THREE.DirectionalLight(0xd5deff)
		// light.position.x = -50
		// light.position.y = 50
		// light.position.z = 25
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
		this.scene.add(ambientLight)

		this.pointLight = new THREE.PointLight(0xffffff, 1, 100)
		this.scene.add(this.pointLight)

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

		this.setupMaze()
	}

	setupMaze() {
		const wallGeometry = new THREE.PlaneGeometry(1, 1)
		const wallMaterial = new THREE.MeshLambertMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide,
		})

		const makeWall = (x: number, z: number, extraTransform: THREE.Matrix4) => {
			const mesh = new THREE.Mesh(wallGeometry, wallMaterial)
			const transform = new THREE.Matrix4()
			transform.multiply(new THREE.Matrix4().makeTranslation(x, 0, z))
			transform.multiply(extraTransform)
			transform.multiply(new THREE.Matrix4().makeTranslation(0.5, 0.5, 0))
			mesh.matrix = transform
			mesh.matrixAutoUpdate = false
			return mesh
		}

		const makeWestWall = (x: number, z: number) =>
			makeWall(
				x,
				z,
				new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(270))
			)

		const makeNorthWall = (x: number, z: number) =>
			makeWall(x, z, new THREE.Matrix4())

		const makeEastWall = (x: number, z: number) =>
			makeWall(
				x,
				z,
				new THREE.Matrix4()
					.makeRotationY(THREE.MathUtils.degToRad(270))
					.multiply(new THREE.Matrix4().makeTranslation(0, 0, -1))
			)

		const makeSouthWall = (x: number, z: number) =>
			makeWall(x, z, new THREE.Matrix4().makeTranslation(0, 0, 1))

		const directionToWallFactory: Record<
			DirectionName,
			(x: number, z: number) => THREE.Mesh
		> = {
			north: makeNorthWall,
			east: makeEastWall,
			south: makeSouthWall,
			west: makeWestWall,
		}

		// const helper = new THREE.AxesHelper()
		// this.scene.add(helper)

		const maze = new MazeGenerator(4)
		maze.generate()

		const group = new THREE.Group()

		for (const [y, row] of maze.grid.entries()) {
			for (const [x, cell] of row.entries()) {
				for (const direction of Direction2D.ALL) {
					if (!cell[direction.name]) {
						continue
					}

					const mesh = directionToWallFactory[direction.name](x, y)
					group.add(mesh)
				}
			}
		}

		this.scene.add(group)
	}

	private lastTime: number | undefined
	private animate = (time: number) => {
		let timeElapsedS = 0
		if (this.lastTime !== undefined) {
			timeElapsedS = (time - this.lastTime) / 1000
		}
		this.lastTime = time

		this.cameraController.update(timeElapsedS)

		this.pointLight.position.copy(this.camera.position)

		this.renderer.render(this.scene, this.camera)
	}
}
