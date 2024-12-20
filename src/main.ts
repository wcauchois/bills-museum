import "./style.css"

import { pipeline } from "@huggingface/transformers"

import { worker } from "./worker/workerClient"

console.log(await worker.ping("hi"))

// const [sqlite_version, vec_version] = db.selectArray("select vec_version();")
// console.log(`${sqlite_version}, vec_version=${vec_version}`)

// console.log("response from worker:", await callWorkerApi("ping", "hello"))

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
