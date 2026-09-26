import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Only public Supabase configuration may enter the browser bundle.
  envPrefix: 'VITE_SUPABASE_',
  plugins: [react(), tailwindcss()],
})
