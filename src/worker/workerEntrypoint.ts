import type { OpfsDatabase } from "@sqlite.org/sqlite-wasm"
// import { default as initSqlite } from "sqlite-vec-wasm-demo"
import { default as initSqlite } from "../vendor/sqlite3.mjs"

console.log("hello from web worker")

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

await addStaticAssetToOPFS("/quotes.db", "quotes.db")

const sqlite3 = await initSqlite()
const db: OpfsDatabase = new sqlite3.oo1.DB({
	filename: "quotes.db",
	vfs: "opfs",
})

const result = db.exec(
	`
  select count(*) from quotes;
`,
	{
		returnValue: "resultRows",
	}
)

console.log("result:", result)
