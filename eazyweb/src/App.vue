<template>
  <div class="app">
    <!-- <header>
      <h1>EazyClass</h1>
    </header> -->
    <Navigation />
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- <footer v-if="$route.name === 'schedule' && !isAuthenticated">
      <p>© 2025 EazyClass. Удобное расписание с уведомлениями.</p>
    </footer> -->
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const isAuthenticated = authStore.isAuthenticated
</script>

<style>
body { margin: 0; font-family: sans-serif; }
.app {
  min-height: 100vh;
  display: flex; flex-direction: column;
  transition: margin-left 0.3s ease;  /* Плавный сдвиг при resize */
}
header {
  background: #27A7E7; color: white; padding: 1rem; text-align: center;
  z-index: 200;  /* Над nav */
}
.main-content {
  flex: 1;
  margin-bottom: 60px;  /* Для bottom nav */
}
footer {
  background: #f0f0f0; padding: 1rem; text-align: center;
}
/* Адаптив: сдвиг всего app под sidebar */
@media (min-width: 768px) {
  .app { margin-left: 250px; margin-bottom: 0; }
  .main-content { margin-bottom: 0; }
}
</style>