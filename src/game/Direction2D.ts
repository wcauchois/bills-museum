export type DirectionName = "north" | "east" | "south" | "west"

export class Direction2D {
	private _opposite: Direction2D | undefined

	private constructor(
		public name: DirectionName,
		public x: number,
		public y: number
	) {}

	static N = new Direction2D("north", 0, 1)
	static E = new Direction2D("east", 1, 0)
	static S = new Direction2D("south", 0, -1)
	static W = new Direction2D("west", -1, 0)

	get opposite() {
		if (!this._opposite) {
			this._opposite = Direction2D.ALL.find(
				direction => direction.x === -this.x && direction.y === -this.y
			)
			if (!this._opposite) {
				throw new Error("Opposite not found")
			}
		}
		return this._opposite
	}

	static ALL = [Direction2D.N, Direction2D.E, Direction2D.S, Direction2D.W]
}
