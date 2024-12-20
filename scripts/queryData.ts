import * as sqliteVec from "sqlite-vec"
import Database from "better-sqlite3"
import { pipeline } from "@huggingface/transformers"
import inquirer from "inquirer"

const databaseName = "public/quotes.db"

const db = new Database(databaseName)
sqliteVec.load(db)

const extractor = await pipeline(
	"feature-extraction",
	"Xenova/all-MiniLM-L6-v2",
	{
		dtype: "fp32",
	}
)

while (true) {
	const answers = await inquirer.prompt([
		{
			type: "input",
			name: "queryString",
			message: "What do you want to search for?",
		},
	])

	const embedding = (
		await extractor(answers.queryString, {
			pooling: "mean",
			normalize: true,
		})
	).tolist()[0]
	const embeddingArray = new Float32Array(384)
	for (let i = 0; i < 384; i++) {
		embeddingArray[i] = embedding[i]
	}

	const result = db
		.prepare(
			`
  select
  body,
  distance
from quotes
where embedding match ?
and k = 10
order by distance
    `
		)
		.all(embeddingArray)
	console.log(result)
}
