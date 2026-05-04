<template>
  <div class="nav-wrapper">
    <!-- Мобильная нижняя навигация -->
    <nav v-if="isMobile" class="bottom-nav">
      <router-link
        to="/schedule"
        class="nav-item"
        :class="{ active: isActive('schedule') }"
      >
        <span class="icon" v-html="icons.schedule"></span>
        <span class="label">Расписание</span>
      </router-link>

      <router-link
        to="/groups"
        class="nav-item"
        :class="{ active: isActive('groups') }"
      >
        <span class="icon" v-html="icons.groups"></span>
        <span class="label">Группы</span>
      </router-link>

      <router-link
        to="/teachers"
        class="nav-item"
        :class="{ active: isActive('teachers') }"
      >
        <span class="icon" v-html="icons.teachers"></span>
        <span class="label">Преподаватели</span>
      </router-link>

      <div
        class="nav-item"
        :class="{ active: isActive('profile') }"
        @click="handleProfileClick"
      >
        <span class="icon" v-html="icons.profile"></span>
        <span class="label">{{ profileLabel }}</span>
      </div>
    </nav>

    <!-- Десктопная боковая панель -->
    <aside v-else class="sidebar">
      <div class="logo">EazyClass</div>

      <nav class="sidebar-nav">
        <router-link
          to="/schedule"
          class="nav-item"
          :class="{ active: isActive('schedule') }"
        >
          <span class="icon" v-html="icons.schedule"></span>
          <span class="label">Расписание</span>
        </router-link>

        <router-link
          to="/groups"
          class="nav-item"
          :class="{ active: isActive('groups') }"
        >
          <span class="icon" v-html="icons.groups"></span>
          <span class="label">Группы</span>
        </router-link>

        <router-link
          to="/teachers"
          class="nav-item"
          :class="{ active: isActive('teachers') }"
        >
          <span class="icon" v-html="icons.teachers"></span>
          <span class="label">Преподаватели</span>
        </router-link>

        <router-link
          to="/classrooms"
          class="nav-item"
          :class="{ active: isActive('classrooms') }"
        >
          <span class="icon" v-html="icons.classrooms"></span>
          <span class="label">Кабинеты</span>
        </router-link>
      </nav>

      <div class="profile-section">
        <div
          class="nav-item"
          :class="{ active: isActive('profile') }"
          @click="handleProfileClick"
        >
          <span class="icon" v-html="icons.profile"></span>
          <span class="label">{{ profileLabel }}</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import twemoji from 'twemoji'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const { isAuthenticated, subscription, user } = storeToRefs(authStore)

/** Twemoji как в Telegram */
const twemojiOptions = {
  base: `${import.meta.env.BASE_URL}twemoji/`,
  folder: 'svg',
  ext: '.svg'
}

const icons = {
  schedule: twemoji.parse('🗓️', twemojiOptions),
  groups: twemoji.parse('🎓', twemojiOptions),
  teachers: twemoji.parse('🧑‍🏫', twemojiOptions),
  classrooms: twemoji.parse('🚪', twemojiOptions),
  profile: twemoji.parse('👤', twemojiOptions),
}

let windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

const profileLabel = computed(() => {
  if (!isAuthenticated.value) return 'Войти'
  return 'Профиль'
})

// const isActive = computed(() => (name) => route.name === name)
const isActive = (name) => route.name === name

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

function handleResize() {
  windowWidth.value = window.innerWidth
}

function handleProfileClick() {
  if (!isAuthenticated.value) {
    router.push('/schedule')
  } else {
    router.push('/profile')
  }
}
</script>

<style scoped>
/* ── Dark glassmorphism + единый стиль с teachers/groups ── */

.nav-wrapper {
  position: relative;
  font-family: Inter, system-ui, sans-serif;
}

/* Базовый nav-item (общий для mobile и desktop) */
.nav-item {
  display: flex;
  cursor: pointer;
  text-decoration: none;
  color: #94a3b8;
  transition: all 0.18s ease;
  border-radius: 14px;
  backdrop-filter: blur(8px);
}

.nav-item:hover {
  background: rgba(51, 65, 85, 0.42);
  color: #e2e8f0;
  transform: translateY(-1px);
}

.nav-item.active {
  background: rgba(129, 140, 248, 0.18); /* #818cf8 с прозрачностью */
  border: 1px solid rgba(129, 140, 248, 0.28);
  color: #818cf8;
  font-weight: 600;
}

.icon {
  display: inline-block;
  color: currentColor; /* twemoji будет окрашиваться в currentColor */
}

.icon img {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── МОБИЛЬНАЯ нижняя навигация ── */
.bottom-nav {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  left: 16px;
  right: 16px;
  max-width: 420px;
  margin: 0 auto;
  height: 68px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.bottom-nav .nav-item {
  width: 74px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
}

.bottom-nav .icon {
  width: 28px;
  height: 28px;
}

.bottom-nav .label {
  font-size: 0.68rem;
  line-height: 1;
  font-weight: 500;
}

/* ── ДЕСКТОПНАЯ боковая панель ── */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: linear-gradient(135deg, #0f1117 0%, #171b26 100%);
  border-right: 1px solid rgba(148, 163, 184, 0.18); /* как бордеры в карточках */
  display: flex;
  flex-direction: column;
  z-index: 1000;
  color: #e2e8f0;
  /* убираем лишний box-shadow, чтобы не "выпирала" */
}

.logo {
  padding: 24px 20px;
  font-size: 1.75rem;
  font-weight: 700;
  color: #818cf8;           /* индиго акцент как в заголовках */
  letter-spacing: -0.5px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-section {
  padding: 16px 12px 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.sidebar .nav-item {
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin: 2px 0;
  border-radius: 14px;
  backdrop-filter: blur(8px); /* лёгкий blur для согласованности */
}

.sidebar .icon {
  width: 26px;
  height: 26px;
}

.sidebar .label {
  font-size: 0.95rem;
  font-weight: 500;
}

/* Hover и active — одинаковые с остальным приложением */
.sidebar .nav-item:hover {
  background: rgba(51, 65, 85, 0.42);
  color: #e2e8f0;
  transform: translateX(4px); /* лёгкий сдвиг вправо для боковой панели */
}

.sidebar .nav-item.active {
  background: rgba(129, 140, 248, 0.18);
  border: 1px solid rgba(129, 140, 248, 0.28);
  color: #818cf8;
  font-weight: 600;
  transform: translateX(0);
}

/* ── Адаптивность (без изменений) ── */
@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}
</style>
