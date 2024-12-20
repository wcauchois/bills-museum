import type { OpfsDatabase } from "@sqlite.org/sqlite-wasm"
// import { default as initSqlite } from "sqlite-vec-wasm-demo"
import { default as initSqlite } from "../vendor/sqlite3.mjs"

console.log("hello from web worker")

const sqlite3 = await initSqlite()
const db: OpfsDatabase = new sqlite3.oo1.DB(":memory:")

db.exec(`
create virtual table quotes using vec0(
  embedding float[384],
  body text
);
`)

const result = db.exec(
	`
  select 2 + 3;
`,
	{
		returnValue: "resultRows",
	}
)

console.log("result:", result)
