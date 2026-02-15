<template>
  <div class="tg-auth">
    <div v-if="authStore.isAuthenticated" class="logged">
      <div class="user-line">Войти как <strong>{{ displayName }}</strong></div>
      <button class="tg-logout" @click="logout">Выйти</button>
    </div>

    <div v-else>
      <button class="tg-btn" @click="handleAuth" :disabled="loading">
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
    // после успешного pollToken стор уже содержит accessToken и возможно user
    message.value = 'Авторизация успешна'

    // ensure we have up-to-date user info; try to fetch /users/me/
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
      // ignore — store may already have user
    }

  } catch (err) {
    console.error('Telegram deeplink auth failed', err)
    message.value = err.response?.data?.message || err.message || 'Ошибка авторизации'
  } finally {
    loading.value = false
    setTimeout(() => { message.value = '' }, 4000)
  }
}
</script>

<style scoped>
.tg-auth { display:flex; flex-direction:column; align-items:center; gap:8px }
.tg-btn {
  background: linear-gradient(90deg,#27A7E7,#1CA0D6);
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
}
.tg-btn:disabled { opacity:0.7; cursor:not-allowed }
.tg-message { color:#666; font-size:13px; margin-top:4px }
.logged { display:flex; gap:8px; align-items:center }
.tg-logout { background:transparent; border:1px solid #e0e0e0; padding:6px 10px; border-radius:8px; cursor:pointer }
.user-line { color:#333 }
</style>