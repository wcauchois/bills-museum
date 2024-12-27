import fs from "fs-extra"
import * as sqliteVec from "sqlite-vec"
import Database from "better-sqlite3"
import { pipeline } from "@huggingface/transformers"
import _ from "lodash"
import { billQuotes } from "./billQuotes"

const outputDatabaseName = "public/quotes.db"

const QUOTE_LENGTH_LIMIT = 200

/*
const inputFileName = "data/quotes-clean.jsonl"
const inputContents = await fs.readFile(inputFileName, "utf-8")
const allInputRows: Array<{ quote: string; author: string }> = inputContents
	.split("\n")
	.filter(line => line)
	.map(line => JSON.parse(line))
	*/

const inputFileName = "data/quotes-dwyl.json"
const allInputRows: Array<{ text: string; author: string }> = await fs.readJSON(
	inputFileName
)

console.log("First row:", allInputRows[0])
console.log(`Loaded ${allInputRows.length} rows`)

function isPrintable(char: string) {
	return /[\x20-\x7E]/.test(char)
}

function isMostlyPrintableString(s: string) {
	return s.split("").filter(c => isPrintable(c)).length / s.length > 0.9
}

const inputRows = allInputRows.filter(
	row => row.text.length <= QUOTE_LENGTH_LIMIT && row.text.length > 10
	// isMostlyPrintableString(row.text)
)
// .map(row => ({
// 	...row,
// 	quote: row.quote.replace(/^“/, "").replace(/”$/, ""),
// }))

inputRows.push(...billQuotes)

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
  embedding float[384],
  body text
);
`
).run()

const extractor = await pipeline(
	"feature-extraction",
	"Xenova/all-MiniLM-L6-v2",
	{
		dtype: "fp32",
	}
)

const chunkSize = 100
let numProcessed = 0
const embeddings: number[][] = []
for (const chunk of _.chunk(inputRows, chunkSize)) {
	const output = await extractor(
		chunk.map(row => row.text),
		{
			pooling: "mean",
			normalize: true,
		}
	)
	numProcessed += chunk.length
	console.log(`Processed ${numProcessed} rows`)
	embeddings.push(...output.tolist())
}

for (const [rowIndex, row] of inputRows.entries()) {
	const embedding = new Float32Array(384)
	for (let i = 0; i < 384; i++) {
		embedding[i] = embeddings[rowIndex][i]
	}
	db.prepare(`insert into quotes (embedding, body) values (?, ?)`).run(
		embedding,
		row.text
	)
}

console.log("Done!")
