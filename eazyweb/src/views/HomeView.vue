<template>
  <div class="home-page">
    <section class="info">
      <h2>Добро пожаловать в EazyClass!</h2>
      <p>Это универсальное веб-приложение для [твоё описание]. Работает в браузере, на мобильном и как Telegram Mini App (TWA).</p>
      <ul>
        <li>Безопасный вход через Telegram.</li>
        <li>Уведомления от бота.</li>
        <li>Кросс-платформенность: десктоп, мобильный, Telegram.</li>
      </ul>
      <img src="/vite.svg" alt="Логотип" width="200" />  <!-- Замени на свой -->
    </section>

    <section class="auth" v-if="!isAuthenticated">
      <h3>Войдите</h3>
      <TelegramAuthButton @success="onAuthSuccess" />
    </section>

    <section v-else class="dashboard">
      <h3>Добро пожаловать, {{ userName }}!</h3>
      <p>Вы авторизованы. Здесь будет дашборд/контент.</p>
      <button @click="logout">Выйти</button>
    </section>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TelegramAuthButton from '../components/TelegramAuthButton.vue'
import axios from 'axios'

const tg = inject('tg')
const router = useRouter()

const isAuthenticated = ref(false)
const userName = ref('')

// Проверяем авто-логин при загрузке (для TWA)
onMounted(async () => {
  if (tg?.initDataUnsafe?.user) {
    await autoAuthFromTWA()
  } else {
    // Проверяем сохранённый токен (fallback)
    const token = localStorage.getItem('access') || getCookie('access')  // Если в cookie
    if (token) {
      // Валидируй токен на сервере, если нужно (POST /api/v1/token/validate или silent check)
      isAuthenticated.value = true
      userName.value = 'Пользователь'  // Загрузи user с сервера
    }
  }
})

async function autoAuthFromTWA() {
  try {
    const response = await axios.post('/api/v1/token/', { initData: tg.initData })
    const { success, access, refresh, message } = response.data

    if (success) {
      saveToken(access, refresh)  // saveToken из кнопки, или скопируй логику
      userName.value = tg.initDataUnsafe.user?.first_name || 'Пользователь'
      isAuthenticated.value = true
      tg.showAlert('Авторизация успешна!')
    } else {
      handleError(message)  // Аналогично handleError в кнопке
    }
  } catch (error) {
    console.error('TWA auth failed:', error)
    const msg = error.response?.data?.message || 'Ошибка TWA-авторизации.'
    tg.showAlert(msg)
  }
}

function onAuthSuccess(userData) {
  userName.value = userData.name || 'Пользователь'
  isAuthenticated.value = true
}

function logout() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  document.cookie = 'refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'  // Очистка cookie
  isAuthenticated.value = false
  userName.value = ''
  // Redirect или reload, если нужно
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// handleError и saveToken — скопируй из TelegramAuthButton.vue, или вынеси в composable (позже)
function handleError(message) {
  // Аналогично выше
  alert(message || 'Ошибка авторизации.')
}

function saveToken(access, refresh = null) {
  // Аналогично из кнопки
  const isTWA = !!tg
  localStorage.setItem('access', access)
  if (!isTWA && refresh) {
    // Для браузера refresh в cookie — но сервер уже установил
  } else if (refresh) {
    localStorage.setItem('refresh', refresh)
  }
  axios.defaults.withCredentials = true  // Для cookies
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