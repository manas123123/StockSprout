import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()
    ],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
