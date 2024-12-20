import { clamp } from "lodash"
import "./style.css"

import { worker } from "./worker/workerClient"
import * as THREE from "three"
import { InputController } from "./game/InputController"
import { FirstPersonCamera } from "./game/FirstPersonCamera"

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
