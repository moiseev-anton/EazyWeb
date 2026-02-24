import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  withCredentials: true, // important for httponly refresh cookie
  timeout: 15000,
  headers: {
    'X-Client-Type': 'browser',
  },
})

let requestInterceptorId = null
let responseInterceptorId = null

function isAuthEndpoint(url = '') {
  const normalized = String(url || '')
  return normalized.includes('/token/refresh/')
    || normalized.includes('/token/twa/')
    || normalized.includes('/token/logout/')
    || normalized.includes('/token/')
}

// Setup interceptors with a provided auth store
export function setupInterceptors(authStore) {
  // Avoid stacking duplicated interceptors after repeated init/login/retry calls
  if (requestInterceptorId !== null) {
    api.interceptors.request.eject(requestInterceptorId)
    requestInterceptorId = null
  }
  if (responseInterceptorId !== null) {
    api.interceptors.response.eject(responseInterceptorId)
    responseInterceptorId = null
  }

  // Attach access token to requests
  requestInterceptorId = api.interceptors.request.use((config) => {
    try {
      let token = undefined
      if (!authStore) token = undefined
      else if (typeof authStore.accessToken === 'function') token = authStore.accessToken()
      else if (authStore.accessToken && authStore.accessToken.value !== undefined) token = authStore.accessToken.value
      else token = authStore.accessToken

      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      // silent
    }
    return config
  })

  // Response interceptor: on 401 attempt refresh once
  responseInterceptorId = api.interceptors.response.use(
    res => res,
    async (error) => {
      const originalRequest = error.config
      if (!originalRequest) return Promise.reject(error)

      // If status 401 and we haven't retried yet
      if (
        error.response
        && error.response.status === 401
        && !originalRequest._retry
        && !isAuthEndpoint(originalRequest.url)
      ) {
        originalRequest._retry = true
        try {
          await authStore.refreshToken()
          // set new header and retry
          const token = authStore.accessToken
          if (token) {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        } catch (refreshErr) {
          // refresh failed — force logout
          try { authStore.logout() } catch (e) {}
          return Promise.reject(refreshErr)
        }
      }

      return Promise.reject(error)
    }
  )
}

export default api
