<template>
  <div class="home-page">
    <!-- <section class="info">
      <h2>Добро пожаловать в EazyClass!</h2>
      <p>Это универсальное веб-приложение для [твоё описание]. Работает в браузере, на мобильном и как Telegram Mini App (TWA).</p>
      <ul>
        <li>Безопасный вход через Telegram.</li>
        <li>Уведомления от бота.</li>
        <li>Кросс-платформенность: десктоп, мобильный, Telegram.</li>
      </ul>
      <img src="/vite.svg" alt="Логотип" width="200" />
    </section> -->

    <section class="auth" v-if="!isAuthenticated">
      <h3>Войдите</h3>
      <TelegramAuthButton @success="onAuthSuccess" />
    </section>

    <section v-else>
      <div v-if="selectedEntity">
        <ScheduleDashboard
          :entityId="selectedEntity.id"
          :entityType="selectedEntity.type"
          :entityName="selectedEntity.name"
          :showBackButton="true"
          @back="selectedEntity = null"
          @open-entity="handleOpenEntity"
        />
      </div>
      <div v-else-if="auth.subscription">
        <ScheduleDashboard
          :entityId="auth.subscription.id"
          :entityType="auth.subscription.type"
          :entityName="auth.subscription.name"
          :showBackButton="false"
          @open-entity="handleOpenEntity"
        />
      </div>
      <div v-else class="dashboard">
        <h3>Добро пожаловать, {{ userName }}!</h3>
        <p>Вы авторизованы. Здесь будет дашборд/контент.</p>
        <button @click="logout">Выйти</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { inject, onMounted, computed, ref } from 'vue'
import TelegramAuthButton from '../components/TelegramAuthButton.vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import { useAuthStore } from '../stores/auth'

const tg = inject('tg')
const auth = useAuthStore()

const isAuthenticated = computed(() => auth.isAuthenticated)
const userName = computed(() => auth.fullName || (auth.user && (auth.user.first_name || auth.user.name)) || '')

const selectedEntity = ref(null)

// Инициализируем интерцепторы и пробуем авто-логин в TWA
onMounted(async () => {
  auth.init()
  if (tg?.initDataUnsafe?.user) {
    try {
      await auth.login({ initData: tg.initData })
      tg.showAlert('Авторизация успешна!')
    } catch (e) {
      console.error('TWA auth failed:', e)
      const msg = e.response?.data?.message || e.message || 'Ошибка TWA-авторизации.'
      try { tg.showAlert(msg) } catch (_) { /* ignore */ }
    }
  }
})

function onAuthSuccess(userData) {
  // auth.startDeeplink / TelegramAuthButton уже обновляют стор; ничего дополнительно не нужно.
}

function handleOpenEntity(entity) {
  selectedEntity.value = { ...entity }
}

function logout() {
  auth.logout()
}
</script>


<style scoped>
/* Без изменений */
.home-page { text-align: center; }
.info { margin-bottom: 2rem; }
.info ul { list-style: none; padding: 0; }
.auth { border: 1px solid #ddd; padding: 2rem; border-radius: 8px; background: #f9f9f9; }
.dashboard { color: green; }
</style>