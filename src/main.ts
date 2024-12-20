import "./style.css"

import { pipeline } from "@huggingface/transformers"

/*
const classifier = await pipeline("sentiment-analysis")
const result = await classifier("I love transformers!")
console.log("hello, world", result)
*/
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