import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // host: true makes the dev server listen on all network interfaces,
    // which is what GitHub Codespaces needs in order to forward the port.
    host: true,
    port: 5173,
  },
})
