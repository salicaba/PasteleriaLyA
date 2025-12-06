import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Esto es igual a '0.0.0.0', mantenlo así
    port: 3000,  // <--- CAMBIO IMPORTANTE: Forzamos el puerto 3000
    strictPort: true,
  }
})