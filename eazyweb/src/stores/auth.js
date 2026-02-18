import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { setupInterceptors } from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  // boot status: 'booting' | 'authenticated' | 'anonymous' | 'network_error' | 'server_error'
  const bootStatus = ref('booting')
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

  // Create a new subscription on the server for given entity { id, name, type }
  async function createSubscription(entity) {
    if (!entity || !entity.id || !entity.type) throw new Error('Invalid entity')

    try {
      let url = null
      let body = null
      if (entity.type === 'group') {
        url = '/group-subscriptions/'
        body = {
          data: {
            type: 'group-subscriptions',
            relationships: {
              group: { data: { id: entity.id, type: 'groups' } }
            }
          }
        }
      } else if (entity.type === 'teacher') {
        url = '/teacher-subscriptions/'
        body = {
          data: {
            type: 'teacher-subscriptions',
            relationships: {
              teacher: { data: { id: entity.id, type: 'teachers' } }
            }
          }
        }
      } else {
        throw new Error('Unsupported subscription type')
      }

      const res = await api.post(url, body, { withCredentials: true, headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' } })
      // Refresh local subscription state from server
      await loadSubscription()
      return res.data
    } catch (e) {
      throw e
    }
  }

  // Delete current subscription record on server
  async function deleteSubscription() {
    if (!subscription.value) return null
    const subRecId = subscription.value.subscriptionId || null
    const subType = subscription.value.type || null

    if (!subRecId) {
      // Try to reload subscription to obtain record id
      await loadSubscription()
    }

    const idToDelete = (subscription.value && subscription.value.subscriptionId) ? subscription.value.subscriptionId : null
    const typeToDelete = (subscription.value && subscription.value.type) ? subscription.value.type : subType

    if (!idToDelete || !typeToDelete) {
      // nothing to delete
      subscription.value = null
      return null
    }

    try {
      if (typeToDelete === 'group') {
        await api.delete(`/group-subscriptions/${idToDelete}/`, { withCredentials: true })
      } else if (typeToDelete === 'teacher') {
        await api.delete(`/teacher-subscriptions/${idToDelete}/`, { withCredentials: true })
      }

      subscription.value = null
      return { success: true }
    } catch (e) {
      throw e
    }
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
      const res = await api.post('/token/logout/', null, { withCredentials: true })
      accessToken.value = ''
      isAuthenticated.value = false
      user.value = null
      subscription.value = null
      notifications.value = { changes: true, reminders: true }
      return res.data || { success: true }
    } catch (e) {
      // ensure local cleanup even if server fails
      accessToken.value = ''
      isAuthenticated.value = false
      user.value = null
      subscription.value = null
      notifications.value = { changes: true, reminders: true }
      throw e
    }
  }

  // Async wrappers to perform server operations and keep local state in sync
  async function subscribe(entity) {
    return createSubscription(entity)
  }

  async function unsubscribe() {
    return deleteSubscription()
  }

  function updateNotifications(newSettings) {
    notifications.value = { ...notifications.value, ...newSettings }
  }

  const fullName = computed(() => user.value ? `${user.value.name || ''} ${user.value.surname || ''}`.trim() : '')

  // expose accessToken (string) for interceptors
  const accessTokenStr = computed(() => accessToken.value)

  // Provide a small initializer to wire interceptors from main.js if needed
  async function init() {
    bootStatus.value = 'booting'

    try {
      setupInterceptors({ accessToken, refreshToken, logout })
    } catch (e) {
      // ignore, will setup later when login runs
    }

    // If we already have an access token in memory, try to load subscription
    if (accessToken.value) {
      bootStatus.value = 'authenticated'
      loadSubscription().catch(() => {})
      return
    }

    // Try to refresh access token using httponly refresh cookie
    let refreshSucceeded = false
    try {
      const res = await api.post('/token/refresh/', null, { withCredentials: true })
      const data = res.data || {}
      if (data.access) {
        accessToken.value = data.access
        isAuthenticated.value = true
        refreshSucceeded = true
        bootStatus.value = 'authenticated'
        // ensure interceptors see the new token
        try { setupInterceptors({ accessToken, refreshToken, logout }) } catch (e) {}

        // Fetch current user if possible
        try {
          const me = await api.get('/users/me/', { withCredentials: true })
          const meData = me.data?.data || null
          const a = meData?.attributes || null
          if (a) {
            user.value = {
              id: meData.id || null,
              username: a.username || a.user_name || a.login || null,
              firstName: a.firstName || a.first_name || null,
              lastName: a.lastName || a.last_name || null,
              notifyScheduleUpdates: a.notifyScheduleUpdates ?? a.notify_schedule_updates ?? null,
              notifyUpcomingLessons: a.notifyUpcomingLessons ?? a.notify_upcoming_lessons ?? null
            }
          }
        } catch (e) {
          // ignore failures to fetch user
        }

        // load subscription after successful refresh
        try { await loadSubscription() } catch (_) {}
      }
    } catch (e) {
      // Distinguish network/unavailable vs server error vs auth failure
      if (!e.response) {
        bootStatus.value = 'network_error'
        return
      }
      if (e.response && e.response.status >= 500) {
        bootStatus.value = 'server_error'
        return
      }
      // otherwise 401/403 etc -> treat as no refresh cookie and continue
    }

    if (refreshSucceeded) return

    // Try Telegram WebApp initData flow (TWA)
    try {
      const win = typeof window !== 'undefined' ? window : null
      const initDataRaw = win && win.Telegram && win.Telegram.WebApp && (win.Telegram.WebApp.initData || win.Telegram.WebApp.initDataRaw) ? (win.Telegram.WebApp.initData || win.Telegram.WebApp.initDataRaw) : (win && win.__telegram_init_data ? win.__telegram_init_data : null)
      if (initDataRaw) {
        // send empty body and Authorization: tma <initDataRaw>
        const twaRes = await api.post('/token/twa/', null, { headers: { Authorization: `tma ${initDataRaw}` }, withCredentials: true })
        const d = twaRes.data || {}
        if (d && d.access) {
          accessToken.value = d.access
          user.value = d.user || null
          isAuthenticated.value = !!accessToken.value
          bootStatus.value = 'authenticated'
          try { setupInterceptors({ accessToken, refreshToken, logout }) } catch (e) {}
          try { await loadSubscription() } catch (_) {}
          return
        }
      }
    } catch (e) {
      if (!e.response) {
        bootStatus.value = 'network_error'
        return
      }
      if (e.response && e.response.status >= 500) {
        bootStatus.value = 'server_error'
        return
      }
      // otherwise treat as anonymous
    }

    // No auth available
    bootStatus.value = 'anonymous'
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
        // first.id is the subscription record id (resource id)
        const subscriptionRecordId = first.id || null
        subscription.value = { subscriptionId: subscriptionRecordId, id: target.id, name: target.name, type: targetType, endpoint: target.endpoint }
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
    bootStatus,
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