import * as THREE from "three"
import { InputController } from "./InputController"
import { Sky } from "three/examples/jsm/objects/Sky.js"
import { MazeGenerator } from "./MazeGenerator"
import { Direction2D, DirectionName } from "./Direction2D"
import { CameraController } from "./camera/CameraController"
import { FreeCameraController } from "./camera/FreeCameraController"
import { WalkingCameraController } from "./camera/WalkingCameraController"
import { choose, chooseN, make2DArray, unreachable } from "../lib/utils"
import _ from "lodash"
import { worker } from "../worker/workerClient"
import { getBrokenLinesForCanvas } from "./gameUtils"

const FREE_CAMERA = false

abstract class Entity {
	update(timeElapsedS: number) {}
}

type RotatingShapeType = "cube" | "sphere" | "cylinder"
const allRotatingShapeTypes = Object.keys({
	cube: true,
	cylinder: true,
	sphere: true,
} satisfies Record<RotatingShapeType, true>) as RotatingShapeType[]

class RotatingShape extends Entity {
	private mesh: THREE.Mesh

	constructor(args: {
		scene: THREE.Scene
		position: THREE.Vector3
		shapeType: RotatingShapeType
	}) {
		super()
		const { shapeType } = args

		const size = 1
		let geometry: THREE.BufferGeometry

		if (shapeType === "cube") {
			geometry = new THREE.BoxGeometry(size, size)
		} else if (shapeType === "sphere") {
			geometry = new THREE.SphereGeometry(size)
		} else if (shapeType === "cylinder") {
			geometry = new THREE.CylinderGeometry(size)
		} else {
			unreachable(shapeType)
		}

		const material = new THREE.MeshLambertMaterial({
			color: 0x00ff00,
			// wireframe: true,
		})
		this.mesh = new THREE.Mesh(geometry, material)
		this.mesh.position.copy(args.position)
		args.scene.add(this.mesh)
	}

	override update(timeElapsedS: number) {
		this.mesh.rotation.x += 0.8 * timeElapsedS
		this.mesh.rotation.z += 0.8 * timeElapsedS
	}
}

export class Game {
	private scene: THREE.Scene
	private renderer: THREE.WebGLRenderer
	private camera: THREE.PerspectiveCamera
	private inputController: InputController
	private cameraController: CameraController
	private textureLoader: THREE.TextureLoader
	private entities: Entity[] = []
	private queryString: string

	constructor(args: { queryString: string }) {
		this.queryString = args.queryString

		this.scene = new THREE.Scene()
		this.textureLoader = new THREE.TextureLoader()

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
					initialPosition: this.mazeToWorld(
						Game.MAZE_SIZE / 2,
						Game.MAZE_SIZE / 2
					).setY(1),
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

		this.pointLight = new THREE.PointLight(0xffffff, 10)
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
		this.setupMazeObjects()

		// Floor
		const floorGeometry = new THREE.PlaneGeometry(1000, 1000)
		const floorMaterial = new THREE.MeshLambertMaterial({
			color: 0xaaaaaa,
			side: THREE.DoubleSide,
		})
		const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
		floorMesh.rotation.x = Math.PI / 2
		this.scene.add(floorMesh)
	}

	setupMaze() {
		const wallGeometry = new THREE.PlaneGeometry(1, 1)
		const wallMaterial = new THREE.MeshLambertMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide,
			bumpScale: 50,
		})

		const allWallMeshes: THREE.Mesh[] = []
		const makeWall = (x: number, z: number, extraTransform: THREE.Matrix4) => {
			const mesh = new THREE.Mesh(wallGeometry, wallMaterial)
			const transform = new THREE.Matrix4()
			transform.multiply(new THREE.Matrix4().makeTranslation(x, 0, z))
			transform.multiply(extraTransform)
			transform.multiply(new THREE.Matrix4().makeTranslation(0.5, 0.5, 0))
			mesh.matrix = transform
			mesh.matrixAutoUpdate = false
			allWallMeshes.push(mesh)
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

		// const helper = new THREE.AxesHelper()
		// this.scene.add(helper)

		const maze = new MazeGenerator(Game.MAZE_SIZE)
		maze.generate()
		console.log(maze.grid)
		console.log(maze.print())

		const group = new THREE.Group()

		for (let x = 0; x < maze.width; x++) {
			group.add(makeNorthWall(x, 0))
		}

		for (let y = 0; y < maze.height; y++) {
			group.add(makeWestWall(0, y))
			for (let x = 0; x < maze.width; x++) {
				if (!maze.grid[y][x].south) {
					group.add(makeSouthWall(x, y))
				}
				if (!maze.grid[y][x].east) {
					group.add(makeEastWall(x, y))
				}
			}
		}

		group.scale.x = group.scale.z = Game.MAZE_XZ_SCALE
		group.scale.y = 3
		this.scene.add(group)

		this.setupQuotes({ allWallMeshes, group, wallGeometry })
	}

	async setupQuotes(args: {
		allWallMeshes: THREE.Mesh[]
		group: THREE.Group
		wallGeometry: THREE.PlaneGeometry
	}) {
		const { allWallMeshes, group, wallGeometry } = args

		// https://www.1001fonts.com/shockwave-font.html
		const font = new FontFace("Shockwave", `url("/Shockwave.woff")`)
		document.fonts.add(font)
		font.load()

		const quotes = await worker.getRelevantQuotes(this.queryString)
		await document.fonts.ready

		for (const [i, mesh] of chooseN(allWallMeshes, 10).entries()) {
			const quote = quotes[i]
			const frontCanvas = document.createElement("canvas")
			frontCanvas.width = 512
			frontCanvas.height = 512
			const frontContext = frontCanvas.getContext("2d")!
			frontContext.fillStyle = "white"
			frontContext.fillRect(0, 0, 512, 512)
			frontContext.fillStyle = "black"
			const fontSize = 48
			frontContext.font = `${fontSize}px 'Shockwave'`

			const inlineMargin = 10
			const lines = getBrokenLinesForCanvas(
				frontContext,
				quote,
				512 - inlineMargin * 2
			)
			const blockMargin = Math.max(
				0,
				Math.ceil((512 - lines.length * fontSize) / 2)
			)
			for (const [lineNumber, line] of lines.entries()) {
				frontContext.fillText(
					line,
					inlineMargin,
					blockMargin + fontSize * (lineNumber + 1)
				)
			}

			// Different front/back texture: https://stackoverflow.com/a/17602666
			const backCanvas = document.createElement("canvas")
			backCanvas.width = 512
			backCanvas.height = 512
			const backContext = backCanvas.getContext("2d")!
			// Flip image horizontally: https://stackoverflow.com/a/3129152
			backContext.translate(512, 0)
			backContext.scale(-1, 1)
			backContext.drawImage(frontCanvas, 0, 0)

			// Replace with a two-sided wall.
			group.remove(mesh)

			const frontMaterial = new THREE.MeshLambertMaterial({
				color: 0xffffff,
				side: THREE.FrontSide,
				map: new THREE.CanvasTexture(frontCanvas),
			})
			const frontMesh = new THREE.Mesh(wallGeometry, frontMaterial)
			frontMesh.matrix.copy(mesh.matrix)
			frontMesh.matrixAutoUpdate = false
			group.add(frontMesh)

			const backMaterial = new THREE.MeshLambertMaterial({
				color: 0xffffff,
				side: THREE.BackSide,
				map: new THREE.CanvasTexture(backCanvas),
			})
			const backMesh = new THREE.Mesh(wallGeometry, backMaterial)
			backMesh.matrix.copy(mesh.matrix)
			backMesh.matrixAutoUpdate = false
			group.add(backMesh)
		}
	}

	static readonly MAZE_SIZE = 7
	static readonly MAZE_XZ_SCALE = 5
	private mazeToWorld(x: number, y: number) {
		return new THREE.Vector3(x + 0.5, 0, y + 0.5).multiplyScalar(
			Game.MAZE_XZ_SCALE
		)
	}

	setupMazeObjects() {
		const placements: [number, number][] = []
		for (let i = 0; i < 5; i++) {
			while (true) {
				const x = _.random(0, Game.MAZE_SIZE - 1)
				const y = _.random(0, Game.MAZE_SIZE - 1)
				if (!placements.some(([px, py]) => px === x && py === y)) {
					placements.push([x, y])
					break
				}
			}
		}

		for (const [x, y] of placements) {
			this.entities.push(
				new RotatingShape({
					scene: this.scene,
					position: this.mazeToWorld(x, y).setY(1.5),
					shapeType: choose(allRotatingShapeTypes),
				})
			)
		}
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

		for (const entity of this.entities) {
			entity.update(timeElapsedS)
		}

		this.renderer.render(this.scene, this.camera)
	}
}
