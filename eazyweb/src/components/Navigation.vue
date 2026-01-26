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
          class="nav-item"~
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
const icons = {
  schedule: twemoji.parse("🗓️", { folder: "svg", ext: ".svg" }),
  groups: twemoji.parse("🎓", { folder: "svg", ext: ".svg" }),
  teachers: twemoji.parse("👨‍🏫", { folder: "svg", ext: ".svg" }),
//   profile: '👤',
  profile: twemoji.parse("👤", { folder: "svg", ext: ".svg" }),
}

let windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

const profileLabel = computed(() => {
  if (!isAuthenticated.value) return 'Войти'
  const u = user.value || {}
  const first = u.firstName || u.first_name || ''
  const username = u.username || ''
  return first || username || 'Профиль'
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
/* ---------- БАЗА (минимум, что применяется ко всем) ---------- */
.nav-wrapper {
  position: relative;
  font-family: Inter, system-ui, sans-serif;
}

.nav-item {
  display: flex;
  cursor: pointer;
  text-decoration: none;
  color: #626262;
  transition: 0.2s ease;
}

.nav-item:hover {
  background: rgba(39, 167, 231, 0.08);
}

.nav-item.active {
  background: rgba(39, 167, 231, 0.15);
  color: #27A7E7;
  font-weight: 600;
}

/* Заготовка под иконку */
.icon {
  display: inline-block;
}

.icon img {
  width: 100%;
  height: 100%;
  display: block;
}

/* ---------- МОБИЛЬНОЕ: Bottom Navigation ---------- */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 62px;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
}

.bottom-nav .nav-item {
  width: 78px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 6px 0;
  border-radius: 10px;
}

.bottom-nav .icon {
  width: 30px;   /* крупнее иконки */
  height: 30px;
}

.bottom-nav .label {
  font-size: 0.62rem; /* текст маленький */
  line-height: 1.0;
  font-weight: 500;
}

@media (max-width: 359px) {
  .bottom-nav .nav-item {
    width: 70px; /* чуть уже */
  }
}

/* ---------- ДЕСКТОП: Sidebar ---------- */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 250px;
  background: #f9fafb;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.logo {
  padding: 20px;
  font-size: 1.6rem;
  font-weight: 700;
  color: #27A7E7;
  letter-spacing: -0.5px;
  border-bottom: 1px solid #eee;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

.profile-section {
  padding: 0 20px 20px;
  border-top: 1px solid #eee;
}

.sidebar .nav-item {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 12px;
}

.sidebar .icon {
  width: 24px;  /* меньше чем в bottom-nav */
  height: 24px;
}

.sidebar .label {
  font-size: 0.9rem; /* более крупный readable текст */
  font-weight: 500;
}

</style>
