<template>
  <button class="tg-btn" @click="handleAuth" :disabled="loading">
    {{ loading ? 'Подождите...' : 'Войти через Telegram' }}
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { inject } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const emit = defineEmits(['success'])
const tg = inject('tg')
const router = useRouter()

const loading = ref(false)
let pollInterval = null
let currentNonce = null
let pollAttempts = 0
const maxAttempts = 24

async function handleAuth() {
  if (tg?.initDataUnsafe?.user) {
    // В TWA: fallback, если авто-авторизация не сработала (см. HomeView)
    alert('Вы уже в Telegram! Авторизация автоматическая.')
    return
  }

  loading.value = true
  try {
    // GET deeplink + nonce
    const response = await axios.get('/api/v1/deeplink/telegram/')
    const { deeplink, nonce } = response.data
    currentNonce = nonce

    // Переход по deeplink
    window.location.href = deeplink 

    // Стартуем поллинг (5 сек интервал, max 2 мин)
    pollNonce()
  } catch (error) {
    console.error('Deeplink fetch failed:', error)
    const msg = error.response?.data?.message || 'Ошибка получения ссылки. Попробуйте позже.'
    alert(msg)
  } finally {
    loading.value = false
  }
}

async function pollNonce() {
  let attempts = 0
  const maxAttempts = 24  // ~2 мин

  pollInterval = setInterval(async () => {
    attempts++
    try {
      const response = await axios.post('/api/v1/token/', { nonce: currentNonce })
      const { success, access, refresh, message } = response.data

      if (success) {
        saveToken(access, refresh)
        emit('success', { name: 'Пользователь' })  // Здесь можно передать user из ответа, если сервер вернёт
        clearInterval(pollInterval)
        alert('Авторизация успешна!')
      } else {
        // Обработка ошибок по сообщению
        handleError(message)
        if (message === 'invalid_nonce' || attempts >= maxAttempts) {
          clearInterval(pollInterval)
          alert('Срок действия истёк. Попробуйте заново.')
        }
        // Для 'auth_in_progress' — продолжаем поллинг
      }
    } catch (error) {
      console.error('Poll failed:', error)
      const msg = error.response?.data?.message || 'Ошибка проверки. Попробуйте позже.'
      handleError(msg)
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval)
        alert('Таймаут. Авторизация не удалась.')
      }
    }
  }, 5000)
}


function handleError(message) {
  // Маппинг на user-friendly тексты (на основе твоих default_error_messages)
  const errorMap = {
    'no_active_account': 'Аккаунт не найден. Зарегистрируйтесь.',
    'service_unavailable': 'Сервис недоступен, попробуйте позже.',
    'invalid_nonce': 'Неверный или истёкший код.',
    'auth_in_progress': 'Ожидание подтверждения в боте...',
    'invalid_token': 'Неверный токен.',
  }
  const userMsg = errorMap[message] || message || 'Неизвестная ошибка.'
  // Пока alert, позже — toast (npm i vue-toastification)
  if (message !== 'auth_in_progress') {  // Не спамить при ожидании
    alert(userMsg)
  }
}


function saveToken(access, refresh = null) {
  const isBrowser = typeof document !== 'undefined'
  const isTWA = !!tg

  if (isBrowser && !isTWA) {
    // Браузер: access в localStorage (или используй в axios headers), refresh в cookie (сервер)
    localStorage.setItem('access', access)
    // Устанавливаем axios interceptor для cookies (если нужно для будущих запросов)
    axios.defaults.withCredentials = true
  } else {
    // TWA/мобильный: оба JWT в localStorage, используй в headers
    localStorage.setItem('access', access)
    if (refresh) localStorage.setItem('refresh', refresh)
    // Interceptor для headers
    axios.interceptors.request.use(config => {
      const token = localStorage.getItem('access')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
  }
}
</script>

<style scoped>
.tg-btn {
  background: #27A7E7;
  color: white;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  min-width: 200px;
}
.tg-btn:hover:not(:disabled) { background: #1c8ac6; }
.tg-btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>