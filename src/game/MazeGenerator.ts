import _ from "lodash"
import { Direction2D } from "./Direction2D"
import { make2DArray } from "../lib/utils"

class GridEntry {
	north = false
	south = false
	west = false
	east = false

	get untouched() {
		return !this.north && !this.south && !this.west && !this.east
	}
}

/**
 * https://weblog.jamisbuck.org/2010/12/27/maze-generation-recursive-backtracking
 */
export class MazeGenerator {
	grid: GridEntry[][]
	size: number

	get width() {
		return this.size
	}

	get height() {
		return this.size
	}

	constructor(size: number) {
		this.size = size
		this.grid = make2DArray(size, size, () => new GridEntry())
	}

	private carvePassagesFrom(cx: number, cy: number) {
		const directions = _.shuffle(Direction2D.ALL)
		for (const direction of directions) {
			const nx = cx + direction.x
			const ny = cy + direction.y
			if (
				ny >= 0 &&
				ny < this.size &&
				nx >= 0 &&
				nx < this.grid[ny].length &&
				this.grid[ny][nx].untouched
			) {
				// Cell is valid
				this.grid[cy][cx][direction.name] = true
				this.grid[ny][nx][direction.opposite.name] = true
				this.carvePassagesFrom(nx, ny)
			}
		}
	}

	generate() {
		this.carvePassagesFrom(0, 0)
	}

	print() {
		let buf = ""
		buf +=
			" " +
			_.range(this.size * 2 - 1)
				.map(() => "_")
				.join("") +
			"\n"
		for (let y = 0; y < this.height; y++) {
			buf += "|"
			for (let x = 0; x < this.width; x++) {
				buf += this.grid[y][x].south ? " " : "_"
				if (this.grid[y][x].east) {
					buf += this.grid[y][x].south || this.grid[y][x + 1]?.south ? " " : "_"
				} else {
					buf += "|"
				}
			}
			buf += "\n"
		}
		return buf
	}
}
