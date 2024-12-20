export const worker = new Worker(
	new URL("./workerEntrypoint", import.meta.url),
	{
		type: "module",
	}
)
