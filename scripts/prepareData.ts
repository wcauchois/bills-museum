import { parse } from "csv-parse/sync"
import fs from "fs-extra"
import * as sqliteVec from "sqlite-vec"
import Database from "better-sqlite3"

const inputFileName = "data/quotes.csv"
const outputDatabaseName = "public/quotes.db"

const QUOTE_LENGTH_LIMIT = 300

const inputContents = await fs.readFile(inputFileName, "utf-8")
const allInputRows: Array<{ quote: string; author: string }> = parse(
	inputContents,
	{
		columns: true,
	}
)

console.log("First row:", allInputRows[0])
console.log(`Loaded ${allInputRows.length} rows`)

const inputRows = allInputRows.filter(
	row => row.quote.length <= QUOTE_LENGTH_LIMIT
)
console.log(`Filtered down to ${inputRows.length} rows`)

try {
	await fs.unlink(outputDatabaseName)
} catch {}

const db = new Database(outputDatabaseName)
sqliteVec.load(db)

const { vec_version } = db
	.prepare<unknown[], { vec_version: any }>(
		"select vec_version() as vec_version;"
	)
	.get()!

console.log(`Sqlite vec version: ${vec_version}`)

db.prepare(
	`
create virtual table quotes using vec0(
  embedding float[384]
);
`
).run()

for (const row of inputRows) {
	const embedding = new Float32Array(384)
	db.prepare(`insert into quotes (embedding) values (?)`).run(embedding.buffer)
}

console.log("Done!")
