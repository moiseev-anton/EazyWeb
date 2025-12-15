<template>
    <div class="profile-view">
        <h2>Профиль</h2>
        <div v-if="!isAuthenticated">
            <p>Авторизуйтесь для доступа.</p>
        </div>
        <div v-else>
            <div class="user-data">
                <p>Имя: {{ fullName }}</p>
                <button @click="editMode = true">Редактировать</button>
                <div v-if="editMode">
                    <input v-model="user.name" placeholder="Имя" />
                    <input v-model="user.surname" placeholder="Фамилия" />
                    <button @click="save">Сохранить</button>
                    <button @click="editMode = false">Отмена</button>
                </div>
            </div>
            <hr />
            <div class="notifications">
                <h3>Уведомления</h3>
                <label>Изменения расписания в TG: <input type="checkbox" v-model="notifications.changes" /></label>
                <label>Напоминания о занятии в TG: <input type="checkbox" v-model="notifications.reminders" /></label>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isAuthenticated = authStore.isAuthenticated
const fullName = authStore.fullName
const user = authStore.user
const notifications = authStore.notifications
const editMode = ref(false)

function save() {
    authStore.updateNotifications({})  // Mock, позже API
    editMode.value = false
}
</script>

<style scoped>
.profile-view {
    padding: 20px;
}

label {
    display: block;
    margin: 10px 0;
}
</style>