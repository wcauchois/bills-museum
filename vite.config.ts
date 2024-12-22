import { defineConfig } from "vite"
import eslint from "vite-plugin-eslint"

export default defineConfig({
	optimizeDeps: {
		// https://github.com/vitejs/vite/issues/13314#issuecomment-1560745780
		exclude: ["sqlite-vec-wasm-demo"],
	},
	plugins: [
		{
			name: "isolation",
			configureServer(server) {
				server.middlewares.use((_req, res, next) => {
					res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
					res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
					next()
				})
			},
		},
	],
})
