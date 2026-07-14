<template>
    <div class="profile-page">
        <div class="profile-shell">
            <header class="hero">
                <div class="hero-user">
                    
                    <div>
                        <h1 class="hero-title">Профиль</h1>
                        <p class="hero-subtitle">{{ displayName }}</p>
                    </div>
                </div>
                <span class="status-pill" :class="{ online: isAuthenticated }">{{ isAuthenticated ? 'Авторизован' : 'Гость' }}</span>
            </header>

            <div class="toasts" aria-live="polite">
                <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">{{ t.message }}</div>
            </div>

            <section v-if="!isAuthenticated" class="empty-state">
                <h2>Нет доступа к данным профиля</h2>
                <p>Авторизуйтесь, чтобы редактировать информацию и управлять уведомлениями.</p>
            </section>

            <div v-else class="content-grid">
                <section class="panel profile-panel">
                    <div class="panel-head">
                        <h2>Личные данные</h2>
                        <button v-if="!editMode" class="ghost-btn" @click="enterEdit">Изменить</button>
                    </div>

                    <div class="panel-body">
                        <div v-if="!editMode" class="info-list">
                            <div class="info-row">
                                <span>Логин</span>
                                <strong>{{ user?.username || '—' }}</strong>
                            </div>
                            <div class="info-row">
                                <span>Имя</span>
                                <strong>{{ user?.firstName || user?.first_name || '—' }}</strong>
                            </div>
                            <div class="info-row">
                                <span>Фамилия</span>
                                <strong>{{ user?.lastName || user?.last_name || '—' }}</strong>
                            </div>
                        </div>

                        <form v-else class="edit-form" @submit.prevent="saveProfile">
                            <label class="input-row">
                                <span>Логин</span>
                                <input v-model="local.username" maxlength="30" autocomplete="username" />
                                <small v-if="errors.username" class="error">{{ errors.username }}</small>
                            </label>

                            <div class="split">
                                <label class="input-row">
                                    <span>Имя</span>
                                    <input v-model="local.firstName" maxlength="150" autocomplete="given-name" />
                                    <small v-if="errors.firstName" class="error">{{ errors.firstName }}</small>
                                </label>
                                <label class="input-row">
                                    <span>Фамилия</span>
                                    <input v-model="local.lastName" maxlength="150" autocomplete="family-name" />
                                    <small v-if="errors.lastName" class="error">{{ errors.lastName }}</small>
                                </label>
                            </div>
                        </form>
                    </div>

                    <div v-if="editMode" class="panel-actions">
                        <button class="primary-btn" :disabled="saving" @click="saveProfile">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
                        <button class="ghost-btn" :disabled="saving" @click="cancelEdit">Отмена</button>
                    </div>
                </section>

                <section class="panel notify-panel">
                    <div class="panel-head">
                        <h2>Уведомления</h2>
                    </div>

                    <div class="panel-body notify-list">
                        <label class="notify-item">
                            <div>
                                <strong>Изменения расписания</strong>
                                <p>Моментальные обновления в Telegram при переносах и заменах.</p>
                            </div>
                            <span class="switch">
                                <input
                                    type="checkbox"
                                    :checked="Boolean(notifications?.changes)"
                                    :disabled="saving"
                                    @change="toggleNotify('changes', $event.target.checked)"
                                />
                                <span class="slider"></span>
                            </span>
                        </label>

                        <label class="notify-item">
                            <div>
                                <strong>Напоминания о занятиях</strong>
                                <p>Авто-напоминание перед началом пары в Telegram.</p>
                            </div>
                            <span class="switch">
                                <input
                                    type="checkbox"
                                    :checked="Boolean(notifications?.reminders)"
                                    :disabled="saving"
                                    @change="toggleNotify('reminders', $event.target.checked)"
                                />
                                <span class="slider"></span>
                            </span>
                        </label>
                    </div>
                </section>
            </div>

            <section v-if="isAuthenticated" class="panel social-panel">
                <div class="panel-head">
                    <h2>Связанные аккаунты</h2>
                </div>

                <div class="panel-body">
                    <div v-if="socialLoading" class="social-state">Загрузка аккаунтов...</div>
                    <div v-else-if="socialError" class="social-state social-state-error">{{ socialError }}</div>
                    <div v-else-if="socialAccounts.length === 0" class="social-state">Связанные аккаунты не найдены</div>

                    <div v-else class="social-list">
                        <div v-for="acc in socialAccounts" :key="acc.id" class="social-item">
                            <div class="social-main">
                                <div class="platform-badge" :class="`platform-${acc.platform}`" :title="platformLabel(acc.platform)">
                                    <svg v-if="acc.platform === 'telegram'" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M20.34 4.37a1 1 0 0 0-1.02-.14L3.64 10.3a1 1 0 0 0 .07 1.88l3.7 1.3 1.45 4.88a1 1 0 0 0 1.72.35l2.22-2.57 4.1 3.08a1 1 0 0 0 1.58-.55l3.03-13.3a1 1 0 0 0-.48-.99zM8.37 12.78l8.7-5.37-6.65 6.99-.26 1.6-.87-3.22-.92-.32z" />
                                    </svg>
                                    <svg v-else-if="acc.platform === 'vk'" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 7.9c.13-.42.47-.65 1.03-.65h2.29c.5 0 .73.27.9.6 1.03 2.46 2.25 4.53 3.06 4.53.33 0 .47-.24.47-.76V8.35c-.05-.75-.22-1.02-.93-1.1V7h3.6c.53 0 .72.29.72.93v4.38c0 .47.2.64.33.64.81 0 2.79-2.1 3.94-4.5.2-.42.46-.6.97-.6h2.29c.62 0 .77.33.62.78-.3 1.37-3.34 5.72-3.32 5.72-.26.43-.37.62 0 1.06.26.34 1.1 1.02 1.66 1.67.76.86 1.35 1.59 1.5 2.1.16.5-.11.76-.67.76h-2.03c-.52 0-.75-.26-1.05-.57-.56-.58-1.08-1.22-1.64-1.22-.39 0-.49.23-.49.66v1.02c0 .43-.14.68-.56.68-2.68 0-5.64-1.66-7.85-4.74-1.66-2.35-2.99-5.16-3.34-6.32z" />
                                    </svg>
                                    <span v-else>{{ platformLetter(acc.platform) }}</span>
                                </div>

                                <div class="social-text">
                                    <div class="social-id">{{ acc.displayId }}</div>
                                    <div class="social-platform">{{ platformLabel(acc.platform) }}</div>
                                </div>
                            </div>

                            <div class="social-status">
                                <span class="status-chip" :class="statusClass(acc.status.kind)">{{ acc.status.title }}</span>
                                <small>{{ acc.status.description }}</small>
                                <button
                                    v-if="canConnectTelegramBot(acc)"
                                    class="ghost-btn mini-btn"
                                    :disabled="connectLoadingId === acc.id"
                                    @click="requestBotWriteAccess(acc)"
                                >
                                    {{ connectLoadingId === acc.id ? 'Подключение...' : 'Подключить бота' }}
                                </button>
                                <button
                                    v-if="canOpenTelegramBot(acc)"
                                    class="ghost-btn mini-btn"
                                    @click="openTelegramBot"
                                >
                                    Открыть бота
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer v-if="isAuthenticated" class="page-actions">
                <button class="danger-btn" :disabled="saving" @click="handleLogout">Выйти из профиля</button>
            </footer>

            <AppBottom />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import AppBottom from '../components/AppBottom.vue'

const authStore = useAuthStore()
const { isAuthenticated, user, notifications } = storeToRefs(authStore)
const router = useRouter()

const editMode = ref(false)
const saving = ref(false)
const toasts = ref([])
const socialAccounts = ref([])
const socialLoading = ref(false)
const socialError = ref('')
const connectLoadingId = ref(null)
const telegramBotUrl = ref('')

const displayName = computed(() => {
    if (!isAuthenticated.value) return 'Не авторизован'
    const first = user.value?.firstName || user.value?.first_name || ''
    const last = user.value?.lastName || user.value?.last_name || ''
    const full = `${first} ${last}`.trim()
    return full || user.value?.username || 'Пользователь'
})

const initials = computed(() => {
    const first = (user.value?.firstName || user.value?.first_name || user.value?.username || '').trim()
    const last = (user.value?.lastName || user.value?.last_name || '').trim()
    const a = first ? first[0] : ''
    const b = last ? last[0] : ''
    return `${a}${b}`.toUpperCase() || 'U'
})

const isTelegramWebApp = computed(() => {
    if (typeof window === 'undefined') return false
    const tg = window.Telegram?.WebApp
    return !!(tg && (tg.initData || tg.initDataRaw))
})

function showToast(message, type = 'info', timeout = 3500) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }, timeout)
}

const local = reactive({
    username: '',
    firstName: '',
    lastName: ''
})

const errors = reactive({ username: '', firstName: '', lastName: '' })

function enterEdit() {
    const u = user.value || {}
    local.username = u.username || ''
    local.firstName = u.firstName || u.first_name || ''
    local.lastName = u.lastName || u.last_name || ''
    errors.username = errors.firstName = errors.lastName = ''
    editMode.value = true
}

function cancelEdit() {
    editMode.value = false
}

function validateProfile() {
    let ok = true
    errors.username = ''
    errors.firstName = ''
    errors.lastName = ''

    if (!local.username || local.username.trim().length === 0) {
        errors.username = 'Логин не должен быть пустым'
        ok = false
    } else if (local.username.length > 30) {
        errors.username = 'Логин не должен превышать 30 символов'
        ok = false
    }

    if (local.firstName.length > 150) {
        errors.firstName = 'Имя слишком длинное'
        ok = false
    }
    if (local.lastName.length > 150) {
        errors.lastName = 'Фамилия слишком длинная'
        ok = false
    }

    return ok
}

async function saveProfile() {
    if (!validateProfile()) return
    const payload = {
        data: {
            type: 'users',
            id: user.value?.id || null,
            attributes: {
                username: local.username,
                firstName: local.firstName,
                lastName: local.lastName
            }
        }
    }

    if (saving.value) return
    saving.value = true
    try {
        const uid = user.value?.id
        if (!uid) {
            showToast('Неизвестный идентификатор пользователя', 'error')
            return
        }

        const res = await api.patch(`/users/${uid}/`, payload, { withCredentials: true, headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' } })
        const d = res.data?.data
        if (d && d.attributes) {
            const a = d.attributes
            user.value = {
                id: d.id || user.value?.id,
                username: a.username || a.user_name || a.login || user.value?.username,
                firstName: a.firstName || a.first_name || user.value?.firstName,
                lastName: a.lastName || a.last_name || user.value?.lastName,
                notifyScheduleUpdates: a.notifyScheduleUpdates ?? a.notify_schedule_updates ?? user.value?.notifyScheduleUpdates,
                notifyUpcomingLessons: a.notifyUpcomingLessons ?? a.notify_upcoming_lessons ?? user.value?.notifyUpcomingLessons
            }
            notifications.value = {
                changes: a.notifyScheduleUpdates ?? a.notify_schedule_updates ?? notifications.value?.changes,
                reminders: a.notifyUpcomingLessons ?? a.notify_upcoming_lessons ?? notifications.value?.reminders
            }
        }
        editMode.value = false
        showToast('Профиль обновлен', 'success')
    } catch (e) {
        showToast('Не удалось сохранить изменения на сервере', 'error')
    } finally {
        saving.value = false
    }
}

async function toggleNotify(kind, value) {
    const attrName = kind === 'changes' ? 'notifyScheduleUpdates' : 'notifyUpcomingLessons'

    if (saving.value) return
    saving.value = true
    try {
        const payload = { data: { type: 'users', id: user.value?.id || null, attributes: {} } }
        payload.data.attributes[attrName] = !!value
        const uid = user.value?.id
        if (!uid) {
            showToast('Неизвестный идентификатор пользователя', 'error')
            return
        }

        const res = await api.patch(`/users/${uid}/`, payload, { withCredentials: true, headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' } })
        const d = res.data?.data
        if (d && d.attributes) {
            const a = d.attributes
            notifications.value = {
                changes: a.notifyScheduleUpdates ?? a.notify_schedule_updates ?? notifications.value?.changes,
                reminders: a.notifyUpcomingLessons ?? a.notify_upcoming_lessons ?? notifications.value?.reminders
            }
            user.value = {
                id: d.id || user.value?.id,
                username: a.username || a.user_name || a.login || user.value?.username,
                firstName: a.firstName || a.first_name || user.value?.firstName,
                lastName: a.lastName || a.last_name || user.value?.lastName,
                notifyScheduleUpdates: a.notifyScheduleUpdates ?? a.notify_schedule_updates ?? user.value?.notifyScheduleUpdates,
                notifyUpcomingLessons: a.notifyUpcomingLessons ?? a.notify_upcoming_lessons ?? user.value?.notifyUpcomingLessons
            }
        }
    } catch (e) {
        showToast('Не удалось обновить настройки уведомлений', 'error')
    } finally {
        saving.value = false
    }
}

function normalizePlatform(value) {
    return String(value || '').trim().toLowerCase()
}

function platformLetter(platform) {
    const p = normalizePlatform(platform)
    return p ? p[0].toUpperCase() : '?'
}

function platformLabel(platform) {
    const p = normalizePlatform(platform)
    if (p === 'telegram') return 'Telegram'
    if (p === 'vk') return 'VK'
    return platform || 'Неизвестная платформа'
}

function resolveDisplayId(attributes = {}) {
    const username = attributes?.extraData?.username
    if (username) return String(username)
    return String(attributes?.socialId || '—')
}

function resolveAccountStatus(acc) {
    const p = normalizePlatform(acc.platform)
    const attrs = acc.attributes || {}
    const chatId = attrs.chatId
    const blocked = Boolean(attrs.isBlocked)

    if (p === 'telegram' && (chatId === null || chatId === undefined || chatId === '')) {
        return {
            kind: 'inactive',
            title: 'Не подключен',
            description: 'Для получения уведомлений подключите бота.'
        }
    }

    if (blocked) {
        return {
            kind: 'blocked',
            title: 'Заблокирован',
            description: 'Разблокируйте бота, чтобы получать уведомления.'
        }
    }

    return {
        kind: 'ok',
        title: 'Подключен',
        description: 'Уведомления доступны для этого аккаунта.'
    }
}

function statusClass(kind) {
    if (kind === 'blocked') return 'status-blocked'
    if (kind === 'inactive') return 'status-inactive'
    return 'status-ok'
}

function canConnectTelegramBot(acc) {
    const p = normalizePlatform(acc.platform)
    return p === 'telegram' && acc.status.kind === 'inactive' && isTelegramWebApp.value
}

function canOpenTelegramBot(acc) {
    const p = normalizePlatform(acc.platform)
    if (p !== 'telegram') return false
    if (!telegramBotUrl.value) return false
    if (acc.status.kind === 'blocked') return true
    return acc.status.kind === 'inactive' && !isTelegramWebApp.value
}

async function ensureTelegramBotUrl() {
    if (telegramBotUrl.value) return telegramBotUrl.value
    try {
        const info = await authStore.getTelegramBotInfo()
        telegramBotUrl.value = info?.botUrl || ''
        return telegramBotUrl.value
    } catch (e) {
        return ''
    }
}

function openTelegramBot() {
    if (!telegramBotUrl.value) return
    try {
        const w = window.open(telegramBotUrl.value, '_blank')
        if (!w) window.location.href = telegramBotUrl.value
    } catch (e) {
        window.location.href = telegramBotUrl.value
    }
}

async function loadSocialAccounts() {
    if (!isAuthenticated.value) {
        socialAccounts.value = []
        socialError.value = ''
        return
    }

    socialLoading.value = true
    socialError.value = ''
    try {
        const res = await api.get('/social-accounts/', { withCredentials: true })
        const data = Array.isArray(res.data?.data) ? res.data.data : []
        socialAccounts.value = data.map(item => {
            const attrs = item?.attributes || {}
            const platform = normalizePlatform(attrs.platform)
            const status = resolveAccountStatus({ platform, attributes: attrs })
            return {
                id: item?.id || `${platform}-${attrs.socialId || Math.random()}`,
                platform,
                attributes: attrs,
                displayId: resolveDisplayId(attrs),
                status
            }
        })
        const needBotLink = socialAccounts.value.some(acc =>
            normalizePlatform(acc.platform) === 'telegram' &&
            (acc.status.kind === 'blocked' || acc.status.kind === 'inactive')
        )
        if (needBotLink) await ensureTelegramBotUrl()
    } catch (e) {
        socialAccounts.value = []
        socialError.value = 'Не удалось загрузить связанные аккаунты'
    } finally {
        socialLoading.value = false
    }
}

async function requestBotWriteAccess(account) {
    const tg = window.Telegram?.WebApp
    if (!tg || typeof tg.requestWriteAccess !== 'function') {
        showToast('Функция доступна только в Telegram Mini App', 'error')
        return
    }

    connectLoadingId.value = account.id
    try {
        const result = await new Promise((resolve, reject) => {
            let done = false
            const finish = (value) => {
                if (done) return
                done = true
                resolve(value)
            }
            try {
                const maybe = tg.requestWriteAccess(finish)
                if (maybe && typeof maybe.then === 'function') {
                    maybe.then(finish).catch(reject)
                }
            } catch (err) {
                reject(err)
            }
        })

        if (result === false) showToast('Доступ к сообщениям не предоставлен', 'error')
        else showToast('Запрос отправлен. Проверьте чат с ботом в Telegram.', 'success')

        await loadSocialAccounts()
    } catch (e) {
        showToast('Не удалось запросить доступ у Telegram', 'error')
    } finally {
        connectLoadingId.value = null
    }
}

async function handleLogout() {
    try {
        const res = await authStore.logout()
        const msg = res?.detail || (res?.success ? 'Выход выполнен' : null)
        if (msg) showToast(msg, 'success')
        router.push('/schedule')
    } catch (e) {
        const status = e?.response?.status
        if (status === 401) showToast('Ошибка: неавторизован', 'error')
        else if (status === 500) showToast('Ошибка сервера при выходе', 'error')
        else showToast('Не удалось выйти', 'error')
    }
}

onMounted(() => {
    if (isAuthenticated.value) loadSocialAccounts()
})

watch(isAuthenticated, (value) => {
    if (value) loadSocialAccounts()
    else {
        socialAccounts.value = []
        socialError.value = ''
    }
})
</script>

<style scoped>
.profile-page {
  min-height: 100dvh;
  display: flex;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.profile-shell {
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
  min-height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-radius: 20px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: var(--surface-backdrop);
  -webkit-backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-surface);
}

.hero-user {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.hero-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.02em;
}

.hero-subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.status-pill {
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  background: var(--color-bg-hover-soft);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
}

.status-pill.online {
  background: var(--color-accent-soft-bg);
  border-color: var(--color-accent-soft-border);
  color: var(--color-success);
}

.toasts {
  position: fixed;
  right: 20px;
  bottom: 80px; /* выше bottom-nav */
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2000;
}

.toast {
  min-width: 240px;
  padding: 12px 16px;
  border-radius: 14px;
  color: var(--color-text-primary);
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-hover);
}

.toast.success {
  background: var(--color-success);
  border-color: var(--color-accent-soft-border);
  color: var(--color-bg-canvas);
}

.toast.error {
  background: var(--color-danger);
  border-color: var(--color-danger-soft);
  color: var(--color-text-inverse);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 16px;
}

.panel {
  border-radius: 18px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--color-border-soft);
  background: var(--color-overlay-soft);
}

.panel-head h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-accent);
}

.panel-body {
  padding: 14px 18px 18px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 10px;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-row span {
  color: var(--color-text-secondary);
}

.info-row strong {
  color: var(--color-text-primary);
  text-align: right;
  font-weight: 600;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.input-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-row span {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.input-row input {
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--color-border-strong);
  padding: 0 14px;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(8px);
  transition: all 0.15s;
}

.input-row input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 4px var(--color-accent-bg-subtle);
}

.error {
  color: var(--color-danger);
  font-size: 0.82rem;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 18px 16px;
}

.notify-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notify-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(8px);
}

.notify-item strong {
  display: block;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.notify-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.switch {
  position: relative;
  width: 50px;
  height: 28px;
  flex: 0 0 auto;
}

.switch input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 2;
}

.slider {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: var(--color-bg-hover-soft);
  display: block;
  position: relative;
  transition: background 0.2s ease;
}

.slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-text-primary);
  top: 3px;
  left: 3px;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 6px var(--color-shadow);
}

.switch input:checked + .slider {
  background: var(--color-accent);
}

.switch input:checked + .slider::before {
  transform: translateX(22px);
}

.switch input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn,
.ghost-btn,
.danger-btn,
.mini-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
}

.primary-btn {
  color: var(--color-bg-canvas);
  background: var(--color-accent);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--color-shadow);
}

.ghost-btn {
  color: var(--color-text-muted);
  background: var(--color-bg-surface-strong);
  border: 1px solid var(--color-border-soft);
}

.ghost-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.danger-btn {
  color: var(--color-text-inverse);
  background: var(--color-danger);
}

.danger-btn:hover:not(:disabled) {
  background: var(--color-danger);
  transform: translateY(-2px);
}

.primary-btn:disabled,
.ghost-btn:disabled,
.danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.page-actions {
  display: flex;
  justify-content: flex-end;
}

.social-panel .panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-state {
  color: var(--color-text-secondary);
  font-size: 0.93rem;
  text-align: center;
  padding: 20px;
}

.social-state-error {
  color: var(--color-danger);
}

.social-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-item {
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(8px);
}

.social-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.platform-badge {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid var(--color-border-soft);
  background: var(--color-overlay-soft);
  color: var(--color-text-muted);
  font-weight: 700;
  font-size: 1.1rem;
}

.platform-badge svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.platform-telegram {
  color: var(--color-brand-telegram);
}

.platform-vk {
  color: var(--color-brand-vk);
}

.social-text {
  min-width: 0;
}

.social-id {
  color: var(--color-text-primary);
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.social-platform {
  color: var(--color-text-secondary);
  font-size: 0.88rem;
}

.social-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 180px;
}

.social-status small {
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  text-align: right;
}

.status-chip {
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.status-ok {
  color: var(--color-success);
  background: var(--color-accent-soft-bg);
  border-color: var(--color-accent-soft-border);
}

.status-blocked {
  color: var(--color-danger-soft);
  background: var(--color-danger-soft-bg);
  border-color: var(--color-danger-soft);
}

.status-inactive {
  color: var(--color-accent-strong);
  background: var(--color-accent-bg);
  border-color: var(--color-accent-border);
}

.mini-btn {
  font-size: 0.82rem;
  padding: 6px 12px;
}

.empty-state {
  border-radius: 18px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  padding: 32px 24px;
  text-align: center;
  box-shadow: var(--shadow-card);
}

.empty-state h2 {
  margin: 0 0 10px;
  color: var(--color-text-primary);
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0;
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 880px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .page-actions {
    justify-content: stretch;
  }

  .danger-btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px 20px;
  }

  .status-pill {
    align-self: flex-start;
  }

  .split {
    grid-template-columns: 1fr;
  }

  .notify-item {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .switch {
    align-self: flex-start;
  }

  .panel-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .social-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .social-status {
    align-items: flex-start;
    min-width: 0;
    width: 100%;
  }

  .social-status small {
    text-align: left;
  }

}
</style>
