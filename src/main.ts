import "./style.css"

import { pipeline } from "@huggingface/transformers"

import { default as initSqlite } from "sqlite-vec-wasm-demo"

const sqlite3 = await initSqlite()
const db = new sqlite3.oo1.DB(":memory:")

// const [sqlite_version, vec_version] = db.selectArray("select vec_version();")
// console.log(`${sqlite_version}, vec_version=${vec_version}`)

db.exec(`
create virtual table quotes using vec0(
  embedding float[384],
  body text
);
`)

/*
const extractor = await pipeline(
	"feature-extraction",
	"Xenova/all-MiniLM-L6-v2",
	{
		dtype: "fp32",
	}
)
const output = await extractor("This is a simple test.", {
	pooling: "mean",
	normalize: true,
})
console.log("output:", output.tolist())

*/
