<template>
  <div class="schedule-view">
    <!-- ===== PRE-AUTH ===== -->
    <section v-if="!isAuthenticated" class="pre-auth-landing">
  <div class="hero-section">
    <h1 class="app-title">EazyClass</h1>
    <p class="app-tagline">Удобный помощник с расписанием занятий</p>

    <div class="auth-cta">
      <p class="auth-hint">Вход в один клик — без паролей</p>
      <TelegramAuthButton @success="onAuthSuccess" />

      <p class="auth-legal">
        Авторизуясь, вы принимаете
        <a href="https://eazyclass.ru/terms" target="_blank" rel="noopener noreferrer">правила</a>
        и
        <a href="https://eazyclass.ru/privacy" target="_blank" rel="noopener noreferrer">политику</a>
        сервиса.
      </p>
    </div>
  </div>

  <div class="features-section">
    <div class="feature-grid">

      <div class="feature-card">
        <div class="feature-icon" v-html="featureIcons.devices"></div>
        <h3>Работает везде</h3>
        <p>В браузере, iOS, Android и прямо внутри Telegram</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon" v-html="featureIcons.notify"></div>
        <h3>Уведомления в Telegram</h3>
        <p>Подпишитесь на своё расписание — получайте оповещения об изменениях и напоминания перед каждой парой.</p>
      </div>

    </div>

  </div>

  <AppBottom />

</section>

    <!-- ===== POST-AUTH / NO SUBSCRIPTION ===== -->
<section v-else-if="!subscription" class="no-subscription">
  <div class="no-sub-card">
    <h2>Расписание</h2>

    <h5>Выберите ваше расписание чтобы оно появилось на этой странице</h5>
    <p class="instruction">
      Найдите нужную группу или преподавателя и нажмите на звезду
    </p>

    <div class="star-guide" aria-hidden="true">
      <div class="star-state">
        <div class="guide-header">
          <span class="entity-title-demo">Группа 101</span>
          <span class="demo-star inactive">
            <StarOutlineIcon class="demo-star-icon" />
          </span>
        </div>
        <span class="demo-calendar-btn" aria-hidden="true">
          <span>Календарь</span>
          <span class="demo-chevron">▾</span>
        </span>
      </div>

      <div class="guide-arrow">
        <ArrowLongRightIcon class="guide-arrow-icon" />
      </div>

      <div class="star-state">
        <div class="guide-header">
          <span class="entity-title-demo">Группа 101</span>
          <span class="demo-star active">
            <StarSolidIcon class="demo-star-icon" />
          </span>
        </div>
        <span class="demo-calendar-btn" aria-hidden="true">
          <span>Календарь</span>
          <span class="demo-chevron">▾</span>
        </span>
      </div>
    </div>

  </div>

  <AppBottom />
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
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import TelegramAuthButton from '../components/TelegramAuthButton.vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import AppBottom from '../components/AppBottom.vue'
import { useRoute, useRouter } from 'vue-router'
import twemoji from 'twemoji'
import { StarIcon as StarOutlineIcon, ArrowLongRightIcon } from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

const authStore = useAuthStore()
const { isAuthenticated, subscription } = storeToRefs(authStore)
const route = useRoute()
const router = useRouter()
const selectedEntity = ref(null)
const twemojiOptions = {
  base: `${import.meta.env.BASE_URL}twemoji/`,
  folder: 'svg',
  ext: '.svg'
}
const featureIcons = {
  devices: twemoji.parse('📱🖥️', twemojiOptions),
  notify: twemoji.parse('🔔', twemojiOptions),
  quick: twemoji.parse('⚡', twemojiOptions),
  modes: twemoji.parse('🗂️', twemojiOptions)
}

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
  /* padding: 12px; */
  background: var(--color-bg-app);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--color-text-primary);
}

/* ================================
   PRE-AUTH / NO SUBSCRIPTION
================================ */
.pre-auth,
.no-subscription-card {
  max-width: 620px;
  margin: 80px auto 40px;
  text-align: center;
  padding: 32px 24px;
  border-radius: 20px;
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-modal);
}

.app-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--color-accent);           /* индиго акцент */
  letter-spacing: -0.03em;
}

.app-description {
  color: var(--color-text-secondary);
  font-size: 1.05rem;
  line-height: 1.5;
  margin-bottom: 32px;
}


/* ===== PRE-AUTH ЛЕНДИНГ ===== */
.pre-auth-landing {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 20px 8px;
  color: var(--color-text-primary);
  min-height: calc(100dvh - 28px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-section {
  text-align: center;
  padding: 30px 20px;
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-modal);
}

.app-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 12px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-strong));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.04em;
}

.app-tagline {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0 0 26px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.auth-cta {
  margin: 0 auto;
  max-width: 360px;
}

.auth-hint {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
}

.auth-legal {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.76rem;
  line-height: 1.45;
}

.auth-legal a {
  color: var(--color-text-secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ===== FEATURES ===== */
.features-section {
  padding: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.feature-card {
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  border-radius: 18px;
  padding: 24px 20px;
  text-align: center;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.28s ease;
}

.feature-card.highlight {
  border-color: var(--color-accent-border);
  background: linear-gradient(135deg, var(--color-accent-bg-subtle), var(--color-accent-soft-bg-subtle));
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-bottom: 14px;
  line-height: 1;
  min-height: 34px;
}

.feature-icon :deep(img) {
  width: 34px;
  height: 34px;
  vertical-align: middle;
}

.feature-card h3 {
  font-size: 1.16rem;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--color-text-primary);
}

.feature-card p {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.no-subscription {
  max-width: 900px;
  margin: 0 auto;
  min-height: 100%;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== NO SUBSCRIPTION ===== */
.no-sub-card {
  max-width: 720px;
  width: min(100%, 720px);
  box-sizing: border-box;
  align-self: center;
  container-type: inline-size;
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border-strong);
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px var(--color-backdrop);
}

.no-sub-card h2 {
  margin: 0 0 16px;
  font-size: 1.65rem;
  font-weight: 700;
  color: var(--color-accent);
  text-align: center;
}

.no-sub-card h5 {
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--color-accent-soft);
  text-align: center;
  margin: 0 0 6px;
}

.instruction {
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--color-text-muted);
  text-align: center;
  margin: 18px 0 6px;
}

.instruction a,
.benefits-list a {
  color: var(--color-accent-strong);
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 700;
}

.instruction a:hover,
.benefits-list a:hover {
  color: var(--color-accent-strong);
}

.star-guide {
  display: grid;
  grid-template-columns: minmax(0, 220px) 40px minmax(0, 220px);
  column-gap: 12px;
  align-items: center;
  justify-content: center;
  margin: 0 0 24px;
}

.star-state {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-hover-soft);
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.entity-title-demo {
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-star {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.demo-star-icon {
  width: 22px;
  height: 22px;
}

.demo-star.inactive {
  color: var(--color-text-secondary);
}

.demo-star.active {
  color: var(--color-accent-soft);
}

.demo-calendar-btn {
  margin-top: 8px;
  height: 30px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg-hover-soft);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: fit-content;
  box-sizing: border-box;
}

.demo-chevron {
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  line-height: 1;
}

.guide-arrow {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  opacity: 0.85;
}

.guide-arrow-icon {
  width: 30px;
  height: 30px;
}

.guide-arrow-icon :deep(path) {
  stroke-width: 2.4;
}

@container (max-width: 504px) {
  .star-guide {
    grid-template-columns: minmax(0, 220px);
    justify-content: center;
    justify-items: center;
    gap: 8px;
  }

  .guide-arrow {
    display: flex;
    justify-content: center;
    transform: rotate(90deg);
  }
}

/* Преимущества */
.benefits {
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--color-text-primary);
}

.benefits-list {
  margin: 0 8px;
  padding: 0;
  list-style: none;
  color: var(--color-text-secondary);
  font-size: 0.98rem;
}

.benefits-list li {
  margin-bottom: 8px;
  position: relative;
  padding-left: 20px;
}

.benefits-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--color-accent-soft);
  font-weight: bold;
}

.benefits-list li.benefit-note::before {
  content: "•";
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  font-weight: 700;
}



@media (max-width: 760px) {
  .app-title {
    font-size: 2.55rem;
  }

  .app-tagline {
    font-size: 1.06rem;
    margin-bottom: 22px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    padding: 20px 16px;
  }

  .feature-card h3 {
    font-size: 1.08rem;
  }

  .feature-card p {
    font-size: 0.92rem;
  }

  .pre-auth-landing {
    min-height: calc(100dvh - 20px);
  }

  .no-sub-card {
    padding: 12px 8px;
  }

  .no-sub-card h2 {
    font-size: 1.45rem;
  }

  .instruction {
    font-size: 0.98rem;
  }

}

@media (max-width: 360px) {
  /* .schedule-view {
    padding: 10px;
  } */

  .pre-auth,
  .no-subscription-card {
    padding: 20px 16px;
  }
}

/* Shared token-based overrides for the schedule landing and empty states */
.schedule-view {
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.pre-auth-landing,
.hero-section,
.feature-card,
.no-sub-card,
.star-state,
.demo-calendar-btn {
  background: var(--color-bg-surface-subtle);
  border-color: var(--color-border-soft);
  color: var(--color-text-primary);
}

.hero-section,
.no-sub-card,
.feature-card,
.star-state {
  box-shadow: var(--shadow-surface);
}

.app-title,
.no-sub-card h2,
.entity-title-demo {
  color: var(--color-accent);
}

.app-tagline,
.auth-hint,
.auth-legal,
.feature-card p,
.instruction,
.benefits-list,
.demo-star.inactive,
.demo-chevron,
.guide-arrow {
  color: var(--color-text-secondary);
}

.no-sub-card h5,
.demo-star.active,
.benefits-list li::before {
  color: var(--color-accent-soft);
}

.feature-card.highlight {
  border-color: var(--color-accent-border);
  background: linear-gradient(135deg, var(--color-accent-bg), var(--color-accent-soft-bg));
}

.instruction a,
.benefits-list a {
  color: var(--color-accent-strong);
}

.instruction a:hover,
.benefits-list a:hover {
  color: var(--color-accent);
}
</style>
