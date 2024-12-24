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
