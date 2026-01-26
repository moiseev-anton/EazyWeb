<template>
    <div class="profile-view">
        <h2>Профиль</h2>

        <div v-if="!isAuthenticated">
            <p>Авторизуйтесь для доступа.</p>
        </div>

        <div v-else class="cards">
            <section class="card profile-card">
                <header class="card-header">
                    <h3>Данные профиля</h3>
                    <button class="edit-btn" v-if="!editMode" @click="enterEdit">Изменить</button>
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

                        <div class="actions">
                            <button class="save" type="submit">Сохранить</button>
                            <button class="cancel" type="button" @click="cancelEdit">Отмена</button>
                        </div>
                    </form>
                </div>
            </section>

            <section class="card notify-card">
                <header class="card-header"><h3>Уведомления</h3></header>
                <div class="card-body">
                    <label class="check">
                        <input type="checkbox" :checked="notifications?.changes" @change="toggleNotify('changes', $event.target.checked)" />
                        <span>Изменения расписания в TG</span>
                    </label>
                    <label class="check">
                        <input type="checkbox" :checked="notifications?.reminders" @change="toggleNotify('reminders', $event.target.checked)" />
                        <span>Напоминания о занятии в TG</span>
                    </label>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import api from '../api/axios'

const authStore = useAuthStore()
const { isAuthenticated, user, notifications } = storeToRefs(authStore)

const editMode = ref(false)

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

    const prev = { ...user.value }
    // optimistic
    user.value = { ...user.value, username: local.username, firstName: local.firstName, lastName: local.lastName }
    try {
        await api.patch('/users/me/', payload, { withCredentials: true })
        editMode.value = false
    } catch (e) {
        user.value = prev
        alert('Не удалось сохранить изменения на сервере')
    }
}

// Toggle notifications immediately (send patch only for flags)
async function toggleNotify(kind, value) {
    // kind: 'changes' -> notifyScheduleUpdates, 'reminders' -> notifyUpcomingLessons
    const attrName = kind === 'changes' ? 'notifyScheduleUpdates' : 'notifyUpcomingLessons'
    // optimistic local update
    notifications.value = { ...notifications.value, [kind]: !!value }
    try {
        const payload = { data: { type: 'users', id: user.value?.id || null, attributes: {} } }
        payload.data.attributes[attrName] = !!value
        await api.patch('/users/me/', payload, { withCredentials: true })
    } catch (e) {
        // rollback
                notifications.value = { ...notifications.value, [kind]: !value }
        alert('Не удалось обновить настройки уведомлений')
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
    box-shadow: 0 6px 18px rgba(31, 41, 55, 0.06);
    padding: 16px;
    min-width: 280px;
    flex: 1 1 320px;
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

.row { margin-bottom:12px }
.two-cols { display:flex; gap:12px }
.col { flex:1 }
.actions { display:flex; gap:8px; margin-top:10px }
.save { background:#27A7E7; color:#fff; border:none; padding:8px 12px; border-radius:8px }
.cancel { background:#f3f4f6; border:none; padding:8px 12px; border-radius:8px }
.error { color:#b91c1c; font-size:0.85rem; margin-top:6px }

.check { display:flex; align-items:center; gap:10px; margin:10px 0 }

@media (max-width:720px) {
    .cards { flex-direction: column }
}
</style>
