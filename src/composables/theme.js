import { computed, readonly, ref } from 'vue'

export const THEME_STORAGE_KEY = 'eazyclass-theme'
export const THEME_OPTIONS = ['system', 'dark', 'light']

const storedPreference = localStorage.getItem(THEME_STORAGE_KEY)
const initialPreference = THEME_OPTIONS.includes(storedPreference) ? storedPreference : 'light'
const preference = ref(initialPreference)
const systemMedia = window.matchMedia('(prefers-color-scheme: dark)')

export const resolvedTheme = computed(() => {
  if (preference.value === 'system') return systemMedia.matches ? 'dark' : 'light'
  return preference.value
})

export const themePreference = readonly(preference)

function applyTheme() {
  const theme = resolvedTheme.value
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.themePreference = preference.value

  const themeColor = document.querySelector('meta[name="theme-color"]')
  themeColor?.setAttribute('content', theme === 'dark' ? '#0f1117' : '#f3f6ff')
}

export function setThemePreference(value) {
  if (!THEME_OPTIONS.includes(value)) return
  preference.value = value
  localStorage.setItem(THEME_STORAGE_KEY, value)
  applyTheme()
}

export function cycleThemePreference() {
  const index = THEME_OPTIONS.indexOf(preference.value)
  setThemePreference(THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length])
}

function handleSystemThemeChange() {
  if (preference.value === 'system') applyTheme()
}

systemMedia.addEventListener?.('change', handleSystemThemeChange)
applyTheme()