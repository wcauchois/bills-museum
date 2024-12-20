import type { OpfsDatabase } from "@sqlite.org/sqlite-wasm"
// import { default as initSqlite } from "sqlite-vec-wasm-demo"
import { default as initSqlite } from "../vendor/sqlite3.mjs"
import { FeatureExtractionPipeline, pipeline } from "@huggingface/transformers"
import { MessageFromWorker, MessageToWorker, WorkerApis } from "./workerApis"
import { Result } from "../lib/utils"
import * as Comlink from "comlink"

console.log("hello from web worker")

Comlink.expose({
	ping(arg: string) {
		return "hello from worker: " + arg
	},
})
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

let db!: OpfsDatabase
let extractor!: FeatureExtractionPipeline

async function initializeWorker() {
	await addStaticAssetToOPFS("/quotes.db", "quotes.db")

	const sqlite3 = await initSqlite()
	db = new sqlite3.oo1.DB({
		filename: "quotes.db",
		vfs: "opfs",
	})

	const result = db.exec(`select count(*) as c from quotes;`, {
		returnValue: "resultRows",
		rowMode: "object",
	})

	console.log("Number of quotes in database:", result[0].c)

	const extractor = await pipeline(
		"feature-extraction",
		"Xenova/all-MiniLM-L6-v2",
		{
			dtype: "fp32",
		}
	)
}

const workerApi = {
	ping(arg: string) {
		return "hello from worker: " + arg
	},
}

export type WorkerApi = typeof workerApi
