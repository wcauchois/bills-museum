import type { OpfsDatabase } from "@sqlite.org/sqlite-wasm"
import { default as initSqlite } from "../vendor/sqlite3.mjs"
import { FeatureExtractionPipeline, pipeline } from "@huggingface/transformers"
import { makeDeferred } from "../lib/utils"
import * as Comlink from "comlink"
import { string } from "three/tsl"

// https://github.com/rhashimoto/wa-sqlite/discussions/221
async function writeFileToOPFS(fileName: string, blob: Blob) {
	const root = await navigator.storage.getDirectory()
	const fileHandle = await root.getFileHandle(fileName, { create: true })
	const writable = await fileHandle.createWritable({ keepExistingData: false })
	await writable.write(blob)
	await writable.close()
}

async function addStaticAssetToOPFS(url: string, fileName: string) {
	const response = await fetch(url)
	const blob = await response.blob()
	await writeFileToOPFS(fileName, blob)
}

const loadedDb = makeDeferred<OpfsDatabase>()
const loadedExtractor = makeDeferred<FeatureExtractionPipeline>()

async function initializeDatabase() {
	await addStaticAssetToOPFS("/quotes.db", "quotes.db")

	const sqlite3 = await initSqlite()
	const db = new sqlite3.oo1.DB({
		filename: "quotes.db",
		vfs: "opfs",
	})
	loadedDb.resolve(db)

	const result = db.exec(`select count(*) as c from quotes;`, {
		returnValue: "resultRows",
		rowMode: "object",
	})

	console.log("Number of quotes in database:", result[0].c)
}

async function initializeExtractor() {
	const extractor = await pipeline(
		"feature-extraction",
		"Xenova/all-MiniLM-L6-v2",
		{
			dtype: "fp32",
		}
	)
	loadedExtractor.resolve(extractor)
}

async function initializeWorker() {
	await Promise.all([initializeDatabase(), initializeExtractor()])
}

const workerApi = {
	ping(arg: string) {
		return "hello from worker: " + arg
	},

	async getRelevantQuotes(query: string): Promise<string[]> {
		const extractor = await loadedExtractor.promise
		const db = await loadedDb.promise

		const output = await extractor(query, {
			pooling: "mean",
			normalize: true,
		})
		const embedding = output.tolist()[0]
		const embeddingArray = new Float32Array(384)
		for (let i = 0; i < 384; i++) {
			embeddingArray[i] = embedding[i]
		}

		const result = db.exec(
			`
        select
        body,
        distance
        from quotes
        where embedding match $embedding
        and k = 10
        order by distance
  `,
			{
				returnValue: "resultRows",
				rowMode: "object",
				bind: { $embedding: embeddingArray.buffer },
			}
		)

		return result.map(row => row.body as string)
	},

	async isPositiveSentiment(query: string): Promise<boolean> {
		const pipe = await pipeline("sentiment-analysis")
		const result = await pipe(query)
		console.log("Sentiment analysis result:", result)
		const isPositive = (result as any)[0].label === "POSITIVE"
		return isPositive
	},
}

export type WorkerApi = typeof workerApi
Comlink.expose(workerApi)

void initializeWorker()
