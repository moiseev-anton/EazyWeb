import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { setupInterceptors } from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  // boot status: 'booting' | 'authenticated' | 'anonymous' | 'network_error' | 'server_error' | 'twa_invalid'
  const bootStatus = ref('booting')
  const silentAuthMode = ref('none')
  const user = ref(null)
  const subscription = ref(null)
  const notifications = ref({ changes: true, reminders: true })
  const telegramBotInfo = ref(null)

  // access token is kept in memory (not localStorage) for security
  const accessToken = ref('')

  // refresh control to avoid parallel refreshes
  let refreshPromise = null
  let telegramBotInfoPromise = null
  let bootPromise = null
  const TELEGRAM_INITDATA_CACHE_KEY = 'telegram_init_data_raw'
  const TELEGRAM_INITDATA_CACHE_TTL_MS = 30 * 1000
  const TELEGRAM_RUNTIME_SEEN_KEY = 'telegram_runtime_seen'

  function hasInitDataHash(raw) {
    if (!raw) return false
    try {
      const params = new URLSearchParams(String(raw))
      return !!params.get('hash')
    } catch (e) {
      return false
    }
  }

  function readCachedTelegramInitDataRaw({ maxAgeMs = TELEGRAM_INITDATA_CACHE_TTL_MS } = {}) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(TELEGRAM_INITDATA_CACHE_KEY) || ''
        if (!raw) return ''
        try {
          const parsed = JSON.parse(raw)
          const cachedRaw = String(parsed?.raw || '')
          const ts = Number(parsed?.ts || 0)
          if (!hasInitDataHash(cachedRaw)) return ''
          if (!ts || (Date.now() - ts > maxAgeMs)) return ''
          return cachedRaw
        } catch (e) {
          // Backward compatibility: old cache format was a plain string
          if (hasInitDataHash(raw)) return raw
        }
      }
    } catch (e) {
      // ignore sessionStorage access errors
    }
    return ''
  }

  function cacheTelegramInitDataRaw(raw) {
    if (!hasInitDataHash(raw)) return
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(TELEGRAM_RUNTIME_SEEN_KEY, '1')
        window.sessionStorage.setItem(
          TELEGRAM_INITDATA_CACHE_KEY,
          JSON.stringify({ raw: String(raw), ts: Date.now() })
        )
      }
    } catch (e) {
      // ignore sessionStorage write errors
    }
  }

  function isTelegramRuntime() {
    if (typeof window === 'undefined') return false
    if (window.Telegram?.WebApp) {
      try {
        if (window.sessionStorage) window.sessionStorage.setItem(TELEGRAM_RUNTIME_SEEN_KEY, '1')
      } catch (e) {}
      return true
    }
    const hash = String(window.location?.hash || '')
    const search = String(window.location?.search || '')
    if (hash.includes('tgWebApp') || search.includes('tgWebApp')) {
      try {
        if (window.sessionStorage) window.sessionStorage.setItem(TELEGRAM_RUNTIME_SEEN_KEY, '1')
      } catch (e) {}
      return true
    }

    // Telegram WebView UA often includes Telegram/TelegramWebView markers.
    const ua = String(window.navigator?.userAgent || '')
    if (/Telegram|TelegramWebView|TgWebView/i.test(ua)) {
      try {
        if (window.sessionStorage) window.sessionStorage.setItem(TELEGRAM_RUNTIME_SEEN_KEY, '1')
      } catch (e) {}
      return true
    }

    // Last known runtime hint for current session.
    try {
      if (window.sessionStorage && window.sessionStorage.getItem(TELEGRAM_RUNTIME_SEEN_KEY) === '1') return true
    } catch (e) {}

    return false
  }

  function tryReadTelegramInitDataRaw({ allowCachedFallback = false, cacheMaxAgeMs = TELEGRAM_INITDATA_CACHE_TTL_MS } = {}) {
    if (typeof window === 'undefined') return ''
    const tg = window.Telegram?.WebApp
    const fromWebApp = tg?.initData || tg?.initDataRaw || ''
    if (fromWebApp) {
      const raw = String(fromWebApp)
      if (hasInitDataHash(raw)) {
        cacheTelegramInitDataRaw(raw)
        return raw
      }
      if (allowCachedFallback) {
        const cached = readCachedTelegramInitDataRaw({ maxAgeMs: cacheMaxAgeMs })
        if (cached) return cached
      }
      return ''
    }

    // Fallback for cases where Telegram data is present in URL hash/query
    try {
      const hash = String(window.location?.hash || '')
      if (hash.includes('tgWebAppData=')) {
        const raw = hash.startsWith('#') ? hash.slice(1) : hash
        const params = new URLSearchParams(raw)
        const v = params.get('tgWebAppData')
        if (v) {
          if (hasInitDataHash(v)) {
            cacheTelegramInitDataRaw(v)
            return v
          }
          return ''
        }
      }
    } catch (e) {
      // ignore URL parsing errors
    }
    if (allowCachedFallback) {
      const cached = readCachedTelegramInitDataRaw({ maxAgeMs: cacheMaxAgeMs })
      if (cached) return cached
    }
    return ''
  }

  async function getTelegramInitDataRaw({
    waitMs = 3200,
    intervalMs = 120,
    allowCachedFallback = false,
    cacheMaxAgeMs = TELEGRAM_INITDATA_CACHE_TTL_MS
  } = {}) {
    const direct = tryReadTelegramInitDataRaw({ allowCachedFallback: false, cacheMaxAgeMs })
    if (hasInitDataHash(direct)) return direct

    const deadline = Date.now() + waitMs
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, intervalMs))
      const next = tryReadTelegramInitDataRaw({ allowCachedFallback: false, cacheMaxAgeMs })
      if (hasInitDataHash(next)) return next
    }
    if (allowCachedFallback) {
      return readCachedTelegramInitDataRaw({ maxAgeMs: cacheMaxAgeMs }) || ''
    }
    return ''
  }

  function normalizeUserPayload(rawUser, fallback = null) {
    const fallbackSafe = fallback || {}
    if (!rawUser) return fallback || null

    if (rawUser.attributes) {
      const a = rawUser.attributes || {}
      return {
        id: rawUser.id || fallbackSafe.id || null,
        username: a.username || a.user_name || a.login || fallbackSafe.username || null,
        firstName: a.firstName || a.first_name || fallbackSafe.firstName || null,
        lastName: a.lastName || a.last_name || fallbackSafe.lastName || null,
        notifyScheduleUpdates: a.notifyScheduleUpdates ?? a.notify_schedule_updates ?? fallbackSafe.notifyScheduleUpdates ?? null,
        notifyUpcomingLessons: a.notifyUpcomingLessons ?? a.notify_upcoming_lessons ?? fallbackSafe.notifyUpcomingLessons ?? null
      }
    }

    return {
      id: rawUser.id || fallbackSafe.id || null,
      username: rawUser.username || rawUser.user_name || rawUser.login || fallbackSafe.username || null,
      firstName: rawUser.firstName || rawUser.first_name || fallbackSafe.firstName || null,
      lastName: rawUser.lastName || rawUser.last_name || fallbackSafe.lastName || null,
      notifyScheduleUpdates: rawUser.notifyScheduleUpdates ?? rawUser.notify_schedule_updates ?? fallbackSafe.notifyScheduleUpdates ?? null,
      notifyUpcomingLessons: rawUser.notifyUpcomingLessons ?? rawUser.notify_upcoming_lessons ?? fallbackSafe.notifyUpcomingLessons ?? null
    }
  }

  // Actions
  async function login(credentials) {
    // credentials: { username, password } — adjust to your API
    // server should set httponly refresh cookie and return access token + user
    const res = await api.post('/token/', credentials, { withCredentials: true })
    const data = res.data || {}
    accessToken.value = data.access || ''
    user.value = normalizeUserPayload(data.user)
    isAuthenticated.value = !!accessToken.value
    // setup interceptors once store is available
    try { setupInterceptors({ accessToken, refreshToken, logout, markSessionExpired }) } catch (e) {}
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
        // failed to refresh: clear local auth state
        clearAuthState()
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
      clearAuthState()
      return res.data || { success: true }
    } catch (e) {
      // ensure local cleanup even if server fails
      clearAuthState()
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
  const isSilentAuthInProgress = computed(() => bootStatus.value === 'booting' && silentAuthMode.value !== 'none')

  // expose accessToken (string) for interceptors
  const accessTokenStr = computed(() => accessToken.value)

  async function hydrateCurrentUser() {
    try {
      const me = await api.get('/users/me/', { withCredentials: true })
      user.value = normalizeUserPayload(me.data?.data, user.value)
    } catch (e) {
      // ignore failures to fetch user profile
    }
  }

  function clearAuthState() {
    accessToken.value = ''
    isAuthenticated.value = false
    user.value = null
    subscription.value = null
    notifications.value = { changes: true, reminders: true }
  }

  function markSessionExpired() {
    clearAuthState()
    bootStatus.value = isTelegramRuntime() ? 'twa_invalid' : 'anonymous'
  }

  async function authViaRefresh() {
    try {
      const res = await api.post('/token/refresh/', null, { withCredentials: true })
      const data = res.data || {}
      if (!data.access) return 'auth_failed'

      accessToken.value = data.access
      isAuthenticated.value = true
      bootStatus.value = 'authenticated'
      try { setupInterceptors({ accessToken, refreshToken, logout, markSessionExpired }) } catch (e) {}
      await hydrateCurrentUser()
      try { await loadSubscription() } catch (_) {}
      return 'ok'
    } catch (e) {
      if (!e.response) return 'network_error'
      if (e.response && e.response.status >= 500) return 'server_error'
      return 'auth_failed'
    }
  }

  async function authViaTelegram() {
    try {
      const initDataRaw = await getTelegramInitDataRaw({
        waitMs: 3200,
        intervalMs: 120,
        allowCachedFallback: true,
        cacheMaxAgeMs: TELEGRAM_INITDATA_CACHE_TTL_MS
      })

      if (!hasInitDataHash(initDataRaw)) return 'auth_failed'

      const twaRes = await api.post('/token/twa/', null, {
        headers: { Authorization: `tma ${initDataRaw}` },
        withCredentials: true
      })
      const d = twaRes.data || {}
      if (!d || !d.access) return 'auth_failed'

      accessToken.value = d.access
      user.value = normalizeUserPayload(d.user, user.value)
      isAuthenticated.value = !!accessToken.value
      bootStatus.value = 'authenticated'
      try { setupInterceptors({ accessToken, refreshToken, logout, markSessionExpired }) } catch (e) {}
      await hydrateCurrentUser()
      try { await loadSubscription() } catch (_) {}
      return 'ok'
    } catch (e) {
      if (!e.response) return 'network_error'
      if (e.response && e.response.status >= 500) return 'server_error'
      return 'auth_failed'
    }
  }

  // Provide a small initializer to wire interceptors from main.js if needed
  async function init() {
    if (bootPromise) return bootPromise

    bootPromise = (async () => {
      bootStatus.value = 'booting'
      silentAuthMode.value = 'none'

      try {
        setupInterceptors({ accessToken, refreshToken, logout, markSessionExpired })
      } catch (e) {
        // ignore, will setup later when login runs
      }

      // If we already have an access token in memory, try to load subscription
      if (accessToken.value) {
        bootStatus.value = 'authenticated'
        loadSubscription().catch(() => {})
        return
      }

      const inTelegram = isTelegramRuntime()
      silentAuthMode.value = inTelegram ? 'telegram' : 'refresh'

      // In Telegram runtime prioritize fresh initData login.
      if (inTelegram) {
        const twaResult = await authViaTelegram()
        if (twaResult === 'ok') return
        if (twaResult === 'network_error') {
          bootStatus.value = 'network_error'
          return
        }
        if (twaResult === 'server_error') {
          bootStatus.value = 'server_error'
          return
        }

        // Fallback to refresh cookie if TWA auth failed.
        const refreshResult = await authViaRefresh()
        if (refreshResult === 'ok') return
        if (refreshResult === 'network_error') {
          bootStatus.value = 'network_error'
          return
        }
        if (refreshResult === 'server_error') {
          bootStatus.value = 'server_error'
          return
        }

        bootStatus.value = 'twa_invalid'
        return
      }

      // Browser runtime: refresh cookie remains primary flow.
      const refreshResult = await authViaRefresh()
      if (refreshResult === 'ok') return
      if (refreshResult === 'network_error') {
        bootStatus.value = 'network_error'
        return
      }
      if (refreshResult === 'server_error') {
        bootStatus.value = 'server_error'
        return
      }

      // No auth available
      bootStatus.value = 'anonymous'
    })()

    try {
      return await bootPromise
    } finally {
      bootPromise = null
      if (bootStatus.value !== 'booting') {
        silentAuthMode.value = 'none'
      }
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
  async function pollToken(nonce, { interval = 2000, timeout = 180000, requestTimeout = 25000 } = {}) {
    const start = Date.now()
    let lastTransientError = null
    while (Date.now() - start < timeout) {
      try {
        const res = await api.post('/token/', { nonce }, { withCredentials: true, timeout: requestTimeout })
        if (res.status === 200 && res.data && res.data.access) {
          accessToken.value = res.data.access
          user.value = normalizeUserPayload(res.data.user, user.value)
          isAuthenticated.value = !!accessToken.value
          // Ensure interceptors use the new access token
          try { setupInterceptors({ accessToken, refreshToken, logout, markSessionExpired }) } catch (e) {}

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
        // Timeout of a single polling request (not whole polling process)
        if (e.code === 'ECONNABORTED') {
          lastTransientError = 'request_timeout'
          await new Promise(r => setTimeout(r, interval))
          continue
        }
        // Temporary network issues during polling
        if (!e.response) {
          lastTransientError = 'network_error'
          await new Promise(r => setTimeout(r, interval))
          continue
        }
        throw e
      }
    }

    if (lastTransientError === 'request_timeout') {
      throw new Error('Истекло общее время ожидания подтверждения в Telegram (последняя ошибка: таймаут запроса к серверу).')
    }
    if (lastTransientError === 'network_error') {
      throw new Error('Истекло общее время ожидания подтверждения в Telegram (последняя ошибка: сетевая недоступность).')
    }
    throw new Error('Истекло общее время ожидания подтверждения в Telegram.')
  }

  async function startDeeplink(platform, { pollInterval = 2000, pollTimeout = 180000, pollRequestTimeout = 25000 } = {}) {
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
    const result = await pollToken(nonce, { interval: pollInterval, timeout: pollTimeout, requestTimeout: pollRequestTimeout })
    return result
  }

  async function getTelegramBotInfo({ force = false } = {}) {
    if (!force) {
      if (telegramBotInfo.value && telegramBotInfo.value.botUrl) return telegramBotInfo.value
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const raw = window.sessionStorage.getItem('telegram_bot_info')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && parsed.botUrl) {
              telegramBotInfo.value = parsed
              return parsed
            }
          }
        }
      } catch (e) {
        // ignore sessionStorage parse/access errors
      }
    }

    if (telegramBotInfoPromise && !force) return telegramBotInfoPromise

    telegramBotInfoPromise = (async () => {
      const res = await api.get('/deeplink/telegram/', { withCredentials: true })
      const data = res.data || {}
      const info = {
        botUrl: data.bot_url || null,
        botUsername: data.bot_username || null
      }
      telegramBotInfo.value = info
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('telegram_bot_info', JSON.stringify(info))
        }
      } catch (e) {
        // ignore sessionStorage write errors
      }
      return info
    })()

    try {
      return await telegramBotInfoPromise
    } finally {
      telegramBotInfoPromise = null
    }
  }

  return {
    isAuthenticated,
    bootStatus,
    silentAuthMode,
    isSilentAuthInProgress,
    user,
    subscription,
    notifications,
    accessToken: accessTokenStr,
    login,
    logout,
    markSessionExpired,
    refreshToken,
    startDeeplink,
    pollToken,
    getTelegramBotInfo,
    subscribe,
    unsubscribe,
    updateNotifications,
    fullName,
    init
  }
})
