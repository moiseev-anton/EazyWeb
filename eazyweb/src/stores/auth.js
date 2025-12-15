import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref(null)
  const subscription = ref(null)
  const notifications = ref({
    changes: true,
    reminders: true
  })

  // Actions: функции для изменений
  function login(userData) {
    isAuthenticated.value = true
    user.value = userData
    // Позже: localStorage.setItem('token', token)
  }

  function logout() {
    isAuthenticated.value = false
    user.value = null
    subscription.value = null
    notifications.value = { changes: true, reminders: true }  // Reset
    // Позже: localStorage.removeItem('token')
  }

  function subscribe(entity) {
    // entity: { id, name, type }
    if (subscription.value && subscription.value.id !== entity.id) {
      // Позже: модал подтверждения замены
      console.warn('Замена подписки!')  // Mock
    }
    subscription.value = entity
  }

  function unsubscribe() {
    subscription.value = null
  }

  function updateNotifications(newSettings) {
    notifications.value = { ...notifications.value, ...newSettings }
    // Позже: POST /api/user/notifications
  }

  // Getters: вычисляемые значения (опционально)
  const fullName = computed(() => user.value ? `${user.value.name} ${user.value.surname}` : '')

  return {
    isAuthenticated,
    user,
    subscription,
    notifications,
    login,
    logout,
    subscribe,
    unsubscribe,
    updateNotifications,
    fullName
  }
})