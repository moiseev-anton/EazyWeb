<template>
    <div class="profile-view">
        <h2>Профиль</h2>

        <!-- Toasts (global for this view) -->
        <div class="toasts" aria-live="polite">
            <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">{{ t.message }}</div>
        </div>

        <div v-if="!isAuthenticated">
            <p>Авторизуйтесь для доступа.</p>
        </div>

        <div v-else class="cards">
            <section class="card profile-card">
                <header class="card-header">
                    <h3>Данные профиля</h3>
                </header>

                <div class="card-body">
                    <div v-if="!editMode" class="display-fields">
                        <div class="field"><span class="label">Логин</span><span class="value">{{ user?.username || '—' }}</span></div>
                        <div class="field"><span class="label">Имя</span><span class="value">{{ user?.firstName || user?.first_name || '—' }}</span></div>
                        <div class="field"><span class="label">Фамилия</span><span class="value">{{ user?.lastName || user?.last_name || '—' }}</span></div>
                    </div>

                    <form v-else class="edit-form" @submit.prevent="saveProfile">
                        <div class="row">
                            <label>Логин</label>
                            <input v-model="local.username" :maxlength="30" />
                            <div v-if="errors.username" class="error">{{ errors.username }}</div>
                        </div>

                        <div class="row two-cols">
                            <div class="col">
                                <label>Имя</label>
                                <input v-model="local.firstName" :maxlength="150" />
                                <div v-if="errors.firstName" class="error">{{ errors.firstName }}</div>
                            </div>
                            <div class="col">
                                <label>Фамилия</label>
                                <input v-model="local.lastName" :maxlength="150" />
                                <div v-if="errors.lastName" class="error">{{ errors.lastName }}</div>
                            </div>
                        </div>

                        <!-- actions moved to unified controls below -->
                    </form>
                </div>
                <!-- unified controls: Edit / Save+Cancel -->
                <div class="card-controls">
                    <button class="edit-main" v-if="!editMode" @click="enterEdit">Изменить</button>
                    <div v-else class="edit-actions">
                        <button class="save" @click="saveProfile">Сохранить</button>
                        <button class="cancel" @click="cancelEdit">Отмена</button>
                    </div>
                </div>
            </section>

            <section class="card notify-card">
                <header class="card-header"><h3>Уведомления</h3></header>
                <div class="card-body">
                    <label class="switch">
                        <input type="checkbox" :checked="notifications?.changes" @change="toggleNotify('changes', $event.target.checked)" />
                        <span class="slider"></span>
                        <span class="switch-label">Изменения расписания в TG</span>
                    </label>
                    <label class="switch">
                        <input type="checkbox" :checked="notifications?.reminders" @change="toggleNotify('reminders', $event.target.checked)" />
                        <span class="slider"></span>
                        <span class="switch-label">Напоминания о занятии в TG</span>
                    </label>
                </div>
            </section>
        </div>

            <!-- main logout action container -->
            <div class="profile-actions">
                <button class="logout-main" @click="handleLogout">Выйти из профиля</button>
            </div>

    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
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
        }
        editMode.value = false
    } catch (e) {
        showToast('Не удалось сохранить изменения на сервере', 'error')
    } finally {
        saving.value = false
    }
}

// Toggle notifications immediately (send patch only for flags)
async function toggleNotify(kind, value) {
    // kind: 'changes' -> notifyScheduleUpdates, 'reminders' -> notifyUpcomingLessons
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
        // navigate to schedule/home after logout
        router.push('/schedule')
    } catch (e) {
        const status = e?.response?.status
        if (status === 401) showToast('Ошибка: неавторизован', 'error')
        else if (status === 500) showToast('Ошибка сервера при выходе', 'error')
        else showToast('Не удалось выйти', 'error')
        // still navigate away or refresh? keep user on page
    }
}
</script>

<style scoped>
.profile-view {
    padding: 20px;
}

.cards {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    flex-wrap: wrap;
    
}

.card {
    background: #ffffff;
    border-radius: 12px;
    /* box-shadow: 0 6px 18px rgba(31, 41, 55, 0.06); */
    
    /* padding: 16px; */
    min-width: 280px;
    flex: 1 1 320px;
    border:2px solid #d1d5db
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.card-body { padding-top: 4px; }

.field { display:flex; justify-content:space-between; padding:8px 0; }
.label { color:#6b7280; font-size:0.9rem }
.value { font-weight:600 }

.edit-btn { background:transparent; border:1px solid #e5e7eb; padding:6px 10px; border-radius:8px; cursor:pointer }

.card-controls { display:flex; justify-content:flex-end; gap:8px; margin-top:12px }
.edit-main { background:transparent; border:1px solid #e5e7eb; padding:8px 12px; border-radius:8px; cursor:pointer }

.logout-main { background: #fff; color:#374151; border:2px solid #d1d5db; padding:8px 14px; border-radius:10px; cursor:pointer }
.logout-main:hover { background:#fee2e2; border-color:#fca5a5; color:#b91c1c }

/* Switch */
.switch { display:flex; align-items:center; gap:12px; margin:10px 0 }
.switch input { width:0; height:0; opacity:0 }
.slider { position:relative; width:44px; height:24px; background:#e5e7eb; border-radius:999px; display:inline-block; transition:0.18s }
.slider:before { content:''; position:absolute; left:4px; top:4px; width:16px; height:16px; background:#fff; border-radius:50%; transition:0.18s }
.switch input:checked + .slider { background:#43cc68 }
.switch input:checked + .slider:before { transform: translateX(20px) }
.switch-label { color:#374151 }

.row { margin-bottom:12px }
.two-cols { display:flex; gap:12px }
.col { flex:1 }
.actions { display:flex; gap:8px; margin-top:10px }
.save { background:#27A7E7; color:#fff; border:none; padding:8px 12px; border-radius:8px }
.cancel { background:#f3f4f6; border:none; padding:8px 12px; border-radius:8px }
.error { color:#b91c1c; font-size:0.85rem; margin-top:6px }

.check { display:flex; align-items:center; gap:10px; margin:10px 0 }

/* Toasts */
.toasts { position: fixed; right: 20px; bottom: 20px; display:flex; flex-direction:column; gap:8px; z-index:2000 }
.toast { background:#111827; color:#fff; padding:10px 14px; border-radius:10px; box-shadow:0 6px 18px rgba(0,0,0,0.12); min-width:180px }
.toast.success { background: #059669 }
.toast.error { background: #dc2626 }
.toast.info { background: #111827 }

@media (max-width:720px) {
    .cards { flex-direction: column }
}

.profile-actions { margin-top:16px; display:flex; justify-content:right }
</style>
