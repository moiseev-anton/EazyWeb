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
      <ScheduleDashboard
        :entityId="subscription.id"
        :entityType="subscription.type"
        :entityName="subscription.name"
        :showBackButton="false"
      />
    </section>
  </div>
</template>


<script setup>
// {"id": "group101", "name": "Группа 101"}
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import TelegramAuthButton from '../components/TelegramAuthButton.vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'

const authStore = useAuthStore()
const { isAuthenticated, subscription } = storeToRefs(authStore)
</script>


<style scoped>
/* ===== BASE ======== */
.schedule-view {
  padding: 0;
  background: #f6f7f9;
  min-height: 100vh;
}


/* ================================
   PRE-AUTH / NO SUB
================================ */
.pre-auth,
.no-subscription {
  max-width: 600px;
  margin: 60px auto;
  text-align: center;
  padding: 0 16px;
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.app-description {
  color: #666;
  margin-bottom: 24px;
}

</style>

