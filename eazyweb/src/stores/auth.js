import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { setupInterceptors } from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref(null)
  const subscription = ref(null)
  const notifications = ref({ changes: true, reminders: true })

  // access token is kept in memory (not localStorage) for security
  const accessToken = ref('')

  // refresh control to avoid parallel refreshes
  let refreshPromise = null

  // Actions
  async function login(credentials) {
    // credentials: { username, password } — adjust to your API
    // server should set httponly refresh cookie and return access token + user
    const res = await api.post('/token/', credentials, { withCredentials: true })
    const data = res.data || {}
    accessToken.value = data.access || ''
    const uraw = data.user || null
    if (uraw && uraw.attributes) {
      const a = uraw.attributes
      user.value = {
        id: uraw.id || null,
        username: a.username || a.user_name || a.login || null,
        firstName: a.firstName || a.first_name || null,
        lastName: a.lastName || a.last_name || null,
        notifyScheduleUpdates: a.notifyScheduleUpdates ?? a.notify_schedule_updates ?? null,
        notifyUpcomingLessons: a.notifyUpcomingLessons ?? a.notify_upcoming_lessons ?? null
      }
    } else if (uraw) {
      user.value = {
        id: uraw.id || null,
        username: uraw.username || uraw.user_name || uraw.login || null,
        firstName: uraw.firstName || uraw.first_name || null,
        lastName: uraw.lastName || uraw.last_name || null
      }
    } else {
      user.value = null
    }
    isAuthenticated.value = !!accessToken.value
    // setup interceptors once store is available
    try { setupInterceptors({ accessToken, refreshToken, logout }) } catch (e) {}
    // try to load subscription after login
    try { await loadSubscription() } catch (_) {}
    return data
  }

  async function refreshToken() {
    // ensure single refresh in progress
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const res = await api.post('/token/refresh/', null, { withCredentials: true })
        const data = res.data || {}
        accessToken.value = data.access || ''
        isAuthenticated.value = !!accessToken.value
        return data.access
      } catch (e) {
        // failed to refresh — clear auth
        accessToken.value = ''
        isAuthenticated.value = false
        user.value = null
        throw e
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  async function logout() {
    try {
      await api.post('/token/logout/', null, { withCredentials: true })
    } catch (e) {
      // ignore
    }
    accessToken.value = ''
    isAuthenticated.value = false
    user.value = null
    subscription.value = null
    notifications.value = { changes: true, reminders: true }
  }

  function subscribe(entity) {
    if (subscription.value && subscription.value.id !== entity.id) {
      console.warn('Замена подписки!')
    }
    subscription.value = entity
  }

  function unsubscribe() {
    subscription.value = null
  }

  function updateNotifications(newSettings) {
    notifications.value = { ...notifications.value, ...newSettings }
  }

  const fullName = computed(() => user.value ? `${user.value.name || ''} ${user.value.surname || ''}`.trim() : '')

  // expose accessToken (string) for interceptors
  const accessTokenStr = computed(() => accessToken.value)

  // Provide a small initializer to wire interceptors from main.js if needed
  function init() {
    try {
      setupInterceptors({ accessToken, refreshToken, logout })
    } catch (e) {
      // ignore, will setup later when login runs
    }
    if (accessToken.value) {
      // best-effort load of subscription
      loadSubscription().catch(() => {})
    }
  }

  // Load current user's subscription (expect at most one). Uses include=teacher,group
  async function loadSubscription() {
    try {
      const res = await api.get('/subscriptions/', { params: { include: 'teacher,group' }, withCredentials: true })
      const payload = res.data || {}
      const data = payload.data
      if (!data) {
        subscription.value = null
        return null
      }

      const first = Array.isArray(data) ? data[0] : data
      if (!first) {
        subscription.value = null
        return null
      }

      const included = Array.isArray(payload.included) ? payload.included : []
      let target = null
      let targetType = null

      if (first.relationships && first.relationships.group && first.relationships.group.data) {
        const gid = first.relationships.group.data.id
        const inc = included.find(i => i.type === 'groups' && i.id === gid)
        if (inc) target = { id: inc.id, name: inc.attributes.title, endpoint: inc.attributes.endpoint }
        else target = { id: gid, name: null, endpoint: null }
        targetType = 'group'
      } else if (first.relationships && first.relationships.teacher && first.relationships.teacher.data) {
        const tid = first.relationships.teacher.data.id
        const inc = included.find(i => i.type === 'teachers' && i.id === tid)
        if (inc) {
          const name = inc.attributes.shortName || inc.attributes.fullName
          target = { id: inc.id, name, endpoint: inc.attributes.endpoint }
        } else target = { id: tid, name: null, endpoint: null }
        targetType = 'teacher'
      }

      if (target) {
        subscription.value = { id: target.id, name: target.name, type: targetType, endpoint: target.endpoint }
        return subscription.value
      }

      subscription.value = null
      return null
    } catch (e) {
      subscription.value = null
      return null
    }
  }

  // Deeplink authentication (e.g., Telegram)
  // 1) GET /deeplink/{platform}/ -> { deeplink, nonce }
  // 2) open deeplink (try window.open, fallback to location.href)
  // 3) poll POST /token/ { nonce } until 200 with access or timeout
  async function pollToken(nonce, { interval = 2000, timeout = 120000 } = {}) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      try {
        const res = await api.post('/token/', { nonce }, { withCredentials: true })
        if (res.status === 200 && res.data && res.data.access) {
          accessToken.value = res.data.access
          user.value = res.data.user || null
          isAuthenticated.value = !!accessToken.value
          // Ensure interceptors use the new access token
          try { setupInterceptors({ accessToken, refreshToken, logout }) } catch (e) {}

          // Try to fetch full user profile if not provided in response
          try {
            const me = await api.get('/users/me/', { withCredentials: true })
            const u = me.data?.data?.attributes || null
            if (u) {
              user.value = {
                id: me.data?.data?.id || user.value?.id || null,
                username: u.username || u.user_name || u.login || null,
                firstName: u.firstName || u.first_name || null,
                lastName: u.lastName || u.last_name || null,
                notifyScheduleUpdates: u.notifyScheduleUpdates ?? u.notify_schedule_updates ?? null,
                notifyUpcomingLessons: u.notifyUpcomingLessons ?? u.notify_upcoming_lessons ?? null
              }
            }
          } catch (e) {
            // ignore failures to fetch /users/me/
          }
          // load subscription after successful token polling
          try { await loadSubscription() } catch (_) {}
          return res.data
        }

        // 202 means authentication in progress
        if (res.status === 202) {
          await new Promise(r => setTimeout(r, interval))
          continue
        }

        // other statuses -> treat as error
        throw new Error(res.data?.message || `Unexpected status ${res.status}`)
      } catch (e) {
        if (e.response && e.response.status === 202) {
          await new Promise(r => setTimeout(r, interval))
          continue
        }
        throw e
      }
    }

    throw new Error('Polling for token timed out')
  }

  async function startDeeplink(platform, { pollInterval = 2000, pollTimeout = 120000 } = {}) {
    const res = await api.get(`/deeplink/${platform}/`)
    const data = res.data || {}
    const deeplink = data.deeplink
    const nonce = data.nonce
    if (!nonce) throw new Error('No nonce returned from deeplink endpoint')

    // Try to open deeplink but keep page alive for polling
    try {
      const w = window.open(deeplink)
      if (!w) {
        // popup blocked or not opened -> fallback to location change
        window.location.href = deeplink
      }
    } catch (e) {
      // fallback
      window.location.href = deeplink
    }

    // Start polling
    const result = await pollToken(nonce, { interval: pollInterval, timeout: pollTimeout })
    return result
  }

  return {
    isAuthenticated,
    user,
    subscription,
    notifications,
    accessToken: accessTokenStr,
    login,
    logout,
    refreshToken,
    startDeeplink,
    pollToken,
    subscribe,
    unsubscribe,
    updateNotifications,
    fullName,
    init
  }
})