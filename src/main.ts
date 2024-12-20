import { clamp } from "lodash"
import "./style.css"

import { worker } from "./worker/workerClient"
import * as THREE from "three"
import { InputController } from "./game/InputController"
import { FirstPersonCamera } from "./game/FirstPersonCamera"
import { Sky } from "three/addons/objects/Sky.js"

// console.log(await worker.getRelevantQuotes("death"))

const scene = new THREE.Scene()
;(window as any).globalScene = scene

const light = new THREE.DirectionalLight(0xd5deff)
light.position.x = -50
light.position.y = 50
light.position.z = 25
scene.add(light)
// const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
// scene.add(light)

const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshPhongMaterial({
	shininess: 100,
	color: 0x00ff00,
})
const cube = new THREE.Mesh(geometry, material)
cube.position.x = 0
cube.position.y = 0
cube.position.z = 0
scene.add(cube)

const planeGeometry = new THREE.PlaneGeometry(20, 5)
const planeMaterial = new THREE.MeshLambertMaterial({
	color: 0xffffff,
	side: THREE.DoubleSide,
})
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
planeMesh.position.x = 5
planeMesh.rotation.y = THREE.MathUtils.degToRad(90)
scene.add(planeMesh)

const drawCanvas = document.createElement("canvas")
drawCanvas.width = 512
drawCanvas.height = 512
const drawContext = drawCanvas.getContext("2d")!

drawContext.fillStyle = "white"
drawContext.fillRect(0, 0, drawCanvas.width, drawCanvas.height)
drawContext.fillStyle = "black"

drawContext.font = "50px 'Roboto Mono'"

/**
 * https://stackoverflow.com/a/16599668
 */
function getBrokenLinesForCanvas(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number
) {
	var words = text.split(" ")
	var lines = []
	var currentLine = words[0]

	for (var i = 1; i < words.length; i++) {
		var word = words[i]
		var width = ctx.measureText(currentLine + " " + word).width
		if (width < maxWidth) {
			currentLine += " " + word
		} else {
			lines.push(currentLine)
			currentLine = word
		}
	}
	lines.push(currentLine)
	return lines
}

const str = "Death is so terribly final, while life is full of possibilities."
const lines = getBrokenLinesForCanvas(drawContext, str, 512)
for (const [i, line] of lines.entries()) {
	drawContext.fillText(line, 50, 90 + i * 50, 512)
}

const tex = new THREE.CanvasTexture(drawCanvas)

const plane2Geometry = new THREE.PlaneGeometry(5, 5)
const plane2Material = new THREE.MeshBasicMaterial({
	color: 0xffffff,
	side: THREE.DoubleSide,
	map: tex,
})

const plane2Mesh = new THREE.Mesh(plane2Geometry, plane2Material)
plane2Mesh.position.x = -5
plane2Mesh.rotation.y = THREE.MathUtils.degToRad(180)
scene.add(plane2Mesh)

const sky = new Sky()
sky.scale.setScalar(450000)

const phi = THREE.MathUtils.degToRad(90)
const theta = THREE.MathUtils.degToRad(180)
const sunPosition = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)

sky.material.uniforms.sunPosition.value = sunPosition

scene.add(sky)

const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

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
