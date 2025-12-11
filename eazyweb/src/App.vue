<template>
  <div class="app">
    <header>
      <h1>EazyClass</h1>
      <!-- Здесь можно добавить NavBar позже, если нужно: <NavBar /> -->
    </header>
    <main>
      <router-view />  <!-- Рендерит HomeView или другие views -->
    </main>
    <footer v-if="route.name === 'home'">
      <p>© 2025 EazyClass. Вход через Telegram для безопасности.</p>
    </footer>
  </div>
</template>

<script setup>
import { provide } from 'vue'
import { useRoute } from 'vue-router'
import { init } from '@telegram-apps/sdk'
import { LaunchParamsRetrieveError } from '@telegram-apps/sdk'  // Импорт ошибки для точной проверки

// Инициализируем Telegram SDK с обработкой ошибки (для браузера вне TWA)
let tg = null
try {
  tg = init()
} catch (error) {
  if (error instanceof LaunchParamsRetrieveError) {
    console.warn('SDK init failed: App opened outside Telegram. Using fallback (tg = null).')
    tg = null  // Fallback: в компонентах проверяем tg?....
  } else {
    // Другие ошибки — реthrow
    throw error
  }
}

provide('tg', tg)  // Доступен через inject в компонентах

const route = useRoute()  // Для template
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
header {
  background: #27A7E7;
  color: white;
  padding: 1rem;
  text-align: center;
}
main {
  flex: 1;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
footer {
  background: #f0f0f0;
  padding: 1rem;
  text-align: center;
}
</style>