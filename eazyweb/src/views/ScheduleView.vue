<template>
  <div class="schedule-view">
    <!-- ===== PRE-AUTH ===== -->
    <section v-if="!isAuthenticated" class="pre-auth">
      <h1 class="app-title">EazyClass</h1>
      <p class="app-description">
        Удобное расписание колледжа с уведомлениями и историей занятий
      </p>
      <TelegramAuthButton @success="onAuthSuccess" />
    </section>

    <!-- ===== POST-AUTH / NO SUBSCRIPTION ===== -->
    <section v-else-if="!subscription" class="no-subscription">
      <h2>Расписание</h2>
      <p>
        Выберите расписание в
        <router-link to="/groups">Группах</router-link>
        или
        <router-link to="/teachers">Преподавателях</router-link>,
        чтобы начать получать уведомления.
      </p>
    </section>

    <!-- ===== DASHBOARD ===== -->
    <section v-else>
      <div v-if="selectedEntity">
        <ScheduleDashboard
          :entityId="selectedEntity.id"
          :entityType="selectedEntity.type"
          :entityName="selectedEntity.name"
          :showBackButton="true"
          @back="selectedEntity = null"
          @open-entity="(e) => (selectedEntity = { ...e })"
        />
      </div>
      <div v-else>
        <ScheduleDashboard
          :entityId="subscription.id"
          :entityType="subscription.type"
          :entityName="subscription.name"
          :showBackButton="false"
          @open-entity="(e) => (selectedEntity = { ...e })"
        />
      </div>
    </section>
  </div>
</template>


<script setup>
// {"id": "group101", "name": "Группа 101"}
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import TelegramAuthButton from '../components/TelegramAuthButton.vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import { useRoute, useRouter } from 'vue-router'

const authStore = useAuthStore()
const { isAuthenticated, subscription } = storeToRefs(authStore)
const route = useRoute()
const router = useRouter()
const selectedEntity = ref(null)

// Если в query передали открытие сущности — откроем её внутри ScheduleView
onMounted(() => {
  const q = route.query
  if (q && q.openId && q.openType) {
    selectedEntity.value = { id: q.openId, type: q.openType, name: q.openName || '' }
    // очистим query чтобы не повторять при reload
    router.replace({ name: 'schedule', query: {} }).catch(() => {})
  }
})
</script>


<style scoped>
/* ===== BASE ======== */
.schedule-view {
  padding: 12px;
  background: linear-gradient(135deg, #0f1117 0%, #171b26 100%);
  min-height: 100dvh;
  color: #e2e8f0;
}

/* ================================
   PRE-AUTH / NO SUBSCRIPTION
================================ */
.pre-auth,
.no-subscription {
  max-width: 620px;
  margin: 80px auto 40px;
  text-align: center;
  padding: 32px 24px;
  border-radius: 20px;
  background: rgba(30, 41, 59, 0.28);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.38);
}

.app-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: #818cf8;           /* индиго акцент */
  letter-spacing: -0.03em;
}

.app-description {
  color: #94a3b8;
  font-size: 1.05rem;
  line-height: 1.5;
  margin-bottom: 32px;
}

/* Ссылки в no-subscription */
.no-subscription a {
  color: #818cf8;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.18s ease;
}

.no-subscription a:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 640px) {
  .pre-auth,
  .no-subscription {
    margin: 60px auto 32px;
    padding: 24px 18px;
    border-radius: 18px;
  }

  .app-title {
    font-size: 1.9rem;
  }

  .app-description {
    font-size: 0.98rem;
  }
}

@media (max-width: 360px) {
  .schedule-view {
    padding: 10px;
  }

  .pre-auth,
  .no-subscription {
    padding: 20px 16px;
  }
}
</style>

