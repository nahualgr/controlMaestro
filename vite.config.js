import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages sirve el sitio en https://<usuario>.github.io/controlMaestro/
// por eso el base tiene que coincidir exactamente con el nombre del repo.
export default defineConfig({
  base: '/controlMaestro/',
  plugins: [react()],
})
