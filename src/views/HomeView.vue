<template>
  <div class="home-page">
    <section v-if="showAuthSkeleton" class="home-skeleton" aria-hidden="true">
      <div class="sk-badge"></div>
      <div class="sk-title"></div>
      <div class="sk-subtitle"></div>
      <div class="sk-card">
        <div class="sk-button"></div>
        <div class="sk-line"></div>
        <div class="sk-line short"></div>
      </div>
    </section>

    <section v-else-if="!isAuthenticated" class="auth">
      <h3>Войдите</h3>
      <TelegramAuthButton @success="onAuthSuccess" />
    </section>

    <section v-else>
      <div v-if="selectedEntity">
        <ScheduleDashboard
          :entityId="selectedEntity.id"
          :entityType="selectedEntity.type"
          :entityName="selectedEntity.name"
          :showBackButton="true"
          @back="selectedEntity = null"
          @open-entity="handleOpenEntity"
        />
      </div>
      <div v-else-if="auth.subscription">
        <ScheduleDashboard
          :entityId="auth.subscription.id"
          :entityType="auth.subscription.type"
          :entityName="auth.subscription.name"
          :showBackButton="false"
          @open-entity="handleOpenEntity"
        />
      </div>
      <div v-else class="dashboard">
        <h3>Добро пожаловать, {{ userName }}!</h3>
        <p>Вы авторизованы. Здесь будет дашборд/контент.</p>
        <button @click="logout">Выйти</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import TelegramAuthButton from '../components/TelegramAuthButton.vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const isAuthenticated = computed(() => auth.isAuthenticated)
const showAuthSkeleton = computed(() => auth.isSilentAuthInProgress && !auth.isAuthenticated)
const userName = computed(() => {
  return auth.fullName || auth.user?.firstName || auth.user?.first_name || auth.user?.name || ''
})

const selectedEntity = ref(null)

function onAuthSuccess() {
  // TelegramAuthButton already updates the auth store.
}

function handleOpenEntity(entity) {
  selectedEntity.value = { ...entity }
}

function logout() {
  auth.logout()
}
</script>

<style scoped>
.home-page {
  text-align: center;
}

.auth,
.home-skeleton {
  border: 1px solid rgba(148, 163, 184, 0.14);
  padding: 2rem;
  border-radius: 24px;
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
}

.dashboard {
  color: green;
}

.home-skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.sk-badge,
.sk-title,
.sk-subtitle,
.sk-button,
.sk-line {
  background: linear-gradient(
    90deg,
    rgba(71, 85, 105, 0.4) 25%,
    rgba(100, 116, 139, 0.6) 50%,
    rgba(71, 85, 105, 0.4) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
  border-radius: 999px;
}

.sk-badge {
  width: 88px;
  height: 14px;
}

.sk-title {
  width: min(280px, 72%);
  height: 28px;
  border-radius: 12px;
}

.sk-subtitle {
  width: min(420px, 90%);
  height: 16px;
  border-radius: 10px;
}

.sk-card {
  width: min(440px, 100%);
  padding: 22px 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(51, 65, 85, 0.22);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.sk-button {
  width: 220px;
  max-width: 100%;
  height: 44px;
}

.sk-line {
  width: 100%;
  height: 14px;
  border-radius: 10px;
}

.sk-line.short {
  width: 72%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
