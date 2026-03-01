import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/",
  
  server: {
    // Разрешить подключение по любому хосту (ngrok/домен)
    host: true,           // или '0.0.0.0' для прослушивания всех интерфейсов

    // Явно разрешить host для ngrok
    allowedHosts: ['madelynn-weatherworn-monika.ngrok-free.dev', 'localhost'],

    // Если используешь HTTPS
    https: false,         // или true если нужен
    port: 5173,
  },

})
