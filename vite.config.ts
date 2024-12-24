import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
	optimizeDeps: {
		// https://github.com/vitejs/vite/issues/13314#issuecomment-1560745780
		exclude: ["sqlite-vec-wasm-demo"],
	},
	plugins: [
		react(),
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
