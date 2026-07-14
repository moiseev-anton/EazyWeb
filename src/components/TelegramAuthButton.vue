<template>
  <div class="tg-auth">
    <div v-if="authStore.isAuthenticated" class="logged">
      <div class="user-line">
        Войти как <strong>{{ displayName }}</strong>
      </div>
      <button class="tg-logout" @click="logout">Выйти</button>
    </div>

    <div v-else>
      <button class="tg-btn" @click="handleAuth" :disabled="loading">
        <svg class="tg-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.34 4.37a1 1 0 0 0-1.02-.14L3.64 10.3a1 1 0 0 0 .07 1.88l3.7 1.3 1.45 4.88a1 1 0 0 0 1.72.35l2.22-2.57 4.1 3.08a1 1 0 0 0 1.58-.55l3.03-13.3a1 1 0 0 0-.48-.99zM8.37 12.78l8.7-5.37-6.65 6.99-.26 1.6-.87-3.22-.92-.32z" />
        </svg>
        <span v-if="!loading">Войти через Telegram</span>
        <span v-else>Ожидание подтверждения в боте…</span>
      </button>
      <div v-if="message" class="tg-message">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const authStore = useAuthStore()
const loading = ref(false)
const message = ref('')

const displayName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return u.username || u.shortName || `${u.firstName || ''} ${u.lastName || ''}`.trim()
})

function logout() {
  authStore.logout()
}

async function handleAuth() {
  loading.value = true
  message.value = 'Открываем Telegram, ожидайте подтверждения…'
  try {
    const result = await authStore.startDeeplink('telegram')
    message.value = 'Авторизация успешна'

    // refresh user data
    try {
      const me = await api.get('/users/me/', { withCredentials: true })
      const udata = me.data?.data?.attributes
      if (udata) {
        authStore.user = {
          id: me.data?.data?.id || null,
          username: udata.username,
          firstName: udata.firstName,
          lastName: udata.lastName,
          notifyScheduleUpdates: udata.notifyScheduleUpdates,
          notifyUpcomingLessons: udata.notifyUpcomingLessons
        }
      }
    } catch (e) {
      // ignore if already have user
    }
  } catch (err) {
    console.error('Telegram deeplink auth failed', err)
    message.value = err.response?.data?.message || err.message || 'Ошибка авторизации'
  } finally {
    loading.value = false
    setTimeout(() => { message.value = '' }, 5000)
  }
}
</script>

<style scoped>
.tg-auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

/* Logged in state */
.logged {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-card);
  width: 100%;
  text-align: center;
}

.user-line {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.user-line strong {
  color: var(--color-success);
  font-weight: 700;
}

.tg-logout {
  background: var(--color-bg-surface-strong);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
}

.tg-logout:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--color-shadow);
}

/* Login button */
.tg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--color-brand-telegram);
  color: var(--color-text-inverse);
  padding: 12px 24px;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 320px;
  transition: all 0.22s ease;
  box-shadow: var(--shadow-telegram);
}

.tg-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  background: var(--color-brand-telegram-strong);
  box-shadow: var(--shadow-telegram-hover);
}

.tg-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.tg-logo {
  width: 24px;
  height: 24px;
  fill: currentColor;       /* окрашивается в цвет текста кнопки */
}

.tg-message {
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  text-align: center;
  max-width: 320px;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 480px) {
  .tg-btn {
    padding: 11px 20px;
    font-size: 0.96rem;
  }

  .tg-logo {
    width: 22px;
    height: 22px;
  }
}
</style>
