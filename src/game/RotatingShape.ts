import * as THREE from "three"
import { unreachable } from "../lib/utils"
import _ from "lodash"
import { Entity } from "./Entity"

export type RotatingShapeType = "cube" | "sphere" | "cylinder"
export const allRotatingShapeTypes = Object.keys({
	cube: true,
	cylinder: true,
	sphere: true,
} satisfies Record<RotatingShapeType, true>) as RotatingShapeType[]

export class RotatingShape extends Entity {
	private mesh: THREE.Mesh
	private rotationAxis: THREE.Vector3
	private initialPosition: THREE.Vector3
	private shapeType: RotatingShapeType

	constructor(args: {
		scene: THREE.Scene
		position: THREE.Vector3
		shapeType: RotatingShapeType
	}) {
		super()
		const { shapeType } = args
		this.initialPosition = args.position
		this.shapeType = args.shapeType

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
		})
		this.mesh = new THREE.Mesh(geometry, material)
		this.mesh.position.copy(args.position)
		args.scene.add(this.mesh)

		this.rotationAxis = new THREE.Vector3().randomDirection()
	}

	private absoluteTime = 0
	override update(timeElapsedS: number) {
		this.absoluteTime += timeElapsedS

		if (this.shapeType === "sphere") {
			// Spheres bob instead of rotating.
			const factor = Math.sin(this.absoluteTime * 3) * 0.15
			this.mesh.position.y = this.initialPosition.y + factor
		} else {
			this.mesh.rotateOnAxis(this.rotationAxis, 0.8 * timeElapsedS)
		}
	}
}
