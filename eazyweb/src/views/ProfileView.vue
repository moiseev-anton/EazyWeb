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

            <footer v-if="isAuthenticated" class="page-actions">
                <button class="danger-btn" :disabled="saving" @click="handleLogout">Выйти из профиля</button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const authStore = useAuthStore()
const { isAuthenticated, user, notifications } = storeToRefs(authStore)
const router = useRouter()

const editMode = ref(false)
const saving = ref(false)
const toasts = ref([])

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
</script>

<style scoped>
.profile-page {
    min-height: 100%;
    padding: 20px;
    background:
        radial-gradient(130% 120% at 0% 0%, rgba(39, 167, 231, 0.14) 0%, rgba(39, 167, 231, 0) 55%),
        radial-gradient(120% 100% at 100% 0%, rgba(8, 145, 178, 0.15) 0%, rgba(8, 145, 178, 0) 60%),
        #f4f8fc;
}

.profile-shell {
    max-width: 1120px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.hero {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 18px;
    border-radius: 18px;
    border: 1px solid rgba(11, 111, 177, 0.18);
    background: linear-gradient(135deg, #ffffff 0%, #ebf6ff 100%);
    box-shadow: 0 12px 30px rgba(11, 111, 177, 0.08);
}

.hero-user {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}



.hero-title {
    margin: 0;
    font-size: 1.3rem;
    color: #0f172a;
    text-align: left;
}

.hero-subtitle {
    margin: 4px 0 0;
    color: #475569;
    text-align: left;
}

.status-pill {
    border-radius: 999px;
    border: 1px solid #d1d5db;
    padding: 7px 12px;
    color: #334155;
    background: #fff;
    font-size: 0.86rem;
    white-space: nowrap;
}

.status-pill.online {
    border-color: rgba(16, 185, 129, 0.28);
    background: rgba(16, 185, 129, 0.09);
    color: #065f46;
}

.content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 16px;
}

.panel {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: #fff;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
    display: flex;
    flex-direction: column;
}

.panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 16px 18px 12px;
    border-bottom: 1px solid #eef2f7;
}

.panel-head h2 {
    margin: 0;
    font-size: 1.04rem;
    color: #0f172a;
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
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 10px;
}

.info-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.info-row span {
    color: #64748b;
}

.info-row strong {
    color: #0f172a;
    text-align: right;
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
    color: #475569;
    font-size: 0.9rem;
}

.input-row input {
    height: 42px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    padding: 0 12px;
    font-size: 0.95rem;
    color: #0f172a;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: #fff;
}

.input-row input:focus {
    outline: none;
    border-color: #27a7e7;
    box-shadow: 0 0 0 4px rgba(39, 167, 231, 0.16);
}

.error {
    color: #b91c1c;
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
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.notify-item strong {
    display: block;
    color: #0f172a;
    margin-bottom: 4px;
}

.notify-item p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
}

.switch {
    position: relative;
    width: 48px;
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
    background: #dbe4ee;
    display: block;
    position: relative;
    transition: background 0.2s ease;
}

.slider::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    top: 4px;
    left: 4px;
    box-shadow: 0 1px 5px rgba(15, 23, 42, 0.25);
    transition: transform 0.2s ease;
}

.switch input:checked + .slider {
    background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%);
}

.switch input:checked + .slider::before {
    transform: translateX(20px);
}

.switch input:disabled {
    cursor: not-allowed;
}

.primary-btn,
.ghost-btn,
.danger-btn {
    border: none;
    border-radius: 11px;
    padding: 9px 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease, color 0.12s ease;
}

.primary-btn {
    color: #fff;
    background: linear-gradient(135deg, #0891b2 0%, #27a7e7 100%);
    box-shadow: 0 8px 16px rgba(39, 167, 231, 0.25);
}

.primary-btn:hover:not(:disabled) {
    transform: translateY(-1px);
}

.ghost-btn {
    color: #334155;
    background: #f1f5f9;
}

.ghost-btn:hover:not(:disabled) {
    background: #e2e8f0;
}

.danger-btn {
    color: #fff;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 10px 20px rgba(220, 38, 38, 0.24);
}

.danger-btn:hover:not(:disabled) {
    transform: translateY(-1px);
}

.primary-btn:disabled,
.ghost-btn:disabled,
.danger-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.page-actions {
    display: flex;
    justify-content: flex-end;
    background: none;
}

.empty-state {
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    text-align: center;
}

.empty-state h2 {
    margin: 0 0 8px;
    color: #0f172a;
}

.empty-state p {
    margin: 0;
    color: #64748b;
}

.toasts {
    position: fixed;
    right: 20px;
    bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 2000;
}

.toast {
    min-width: 220px;
    color: #fff;
    background: #0f172a;
    padding: 10px 14px;
    border-radius: 12px;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.24);
}

.toast.success {
    background: #059669;
}

.toast.error {
    background: #dc2626;
}

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
    .profile-page {
        padding: 14px;
    }

    .hero {
        flex-direction: column;
        align-items: flex-start;
    }

    .status-pill {
        align-self: flex-start;
    }

    .split {
        grid-template-columns: 1fr;
    }

    .notify-item {
        align-items: flex-start;
    }

    .switch {
        margin-top: 2px;
    }

    .panel-actions {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
