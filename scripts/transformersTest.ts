import { pipeline } from "@huggingface/transformers"

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
