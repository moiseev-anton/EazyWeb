<template>
  <div class="nav-wrapper">
    <nav v-if="isMobile" class="bottom-nav">
      <router-link
        to="/schedule"
        class="nav-item"
        :class="{ active: isActive('schedule') }"
        @click.prevent="handleNavClick('schedule', '/schedule')"
      >
        <span class="icon" v-html="icons.schedule"></span>
        <span class="label">Расписание</span>
      </router-link>

      <router-link
        to="/groups"
        class="nav-item"
        :class="{ active: isActive('groups') }"
        @click.prevent="handleNavClick('groups', '/groups')"
      >
        <span class="icon" v-html="icons.groups"></span>
        <span class="label">Группы</span>
      </router-link>

      <router-link
        to="/teachers"
        class="nav-item"
        :class="{ active: isActive('teachers') }"
        @click.prevent="handleNavClick('teachers', '/teachers')"
      >
        <span class="icon" v-html="icons.teachers"></span>
        <span class="label">Преподаватели</span>
      </router-link>

      <template v-if="showCompactMobileNav">
        <div
          class="nav-item nav-item-more"
          :class="{ active: isMoreActive }"
          @click="toggleMoreMenu"
          aria-label="Еще"
          title="Еще"
        >
          <span class="icon more-glyph" aria-hidden="true">⋯</span>
        </div>
      </template>

      <template v-else>
        <router-link
          to="/classrooms"
          class="nav-item"
          :class="{ active: isActive('classrooms') }"
          @click.prevent="handleNavClick('classrooms', '/classrooms')"
        >
          <span class="icon" v-html="icons.classrooms"></span>
          <span class="label">Кабинеты</span>
        </router-link>

        <div
          class="nav-item"
          :class="{ active: isActive('profile') }"
          @click="handleProfileClick"
        >
          <span class="icon" v-html="icons.profile"></span>
          <span class="label">{{ profileLabel }}</span>
        </div>
      </template>
    </nav>

    <div v-if="isMobile && showCompactMobileNav && moreMenuOpen" class="more-overlay" @click="closeMoreMenu">
      <div class="more-sheet" @click.stop>
        <button
          class="more-item"
          :class="{ active: isActive('classrooms') }"
          @click="handleMoreNavClick('classrooms', '/classrooms')"
        >
          <span class="icon" v-html="icons.classrooms"></span>
          <span class="label">Кабинеты</span>
        </button>

        <button
          class="more-item"
          :class="{ active: isActive('profile') }"
          @click="handleProfileClick"
        >
          <span class="icon" v-html="icons.profile"></span>
          <span class="label">{{ profileLabel }}</span>
        </button>
      </div>
    </div>

    <aside v-else class="sidebar">
      <div class="logo">EazyClass</div>

      <nav class="sidebar-nav">
        <router-link
          to="/schedule"
          class="nav-item"
          :class="{ active: isActive('schedule') }"
          @click.prevent="handleNavClick('schedule', '/schedule')"
        >
          <span class="icon" v-html="icons.schedule"></span>
          <span class="label">Расписание</span>
        </router-link>

        <router-link
          to="/groups"
          class="nav-item"
          :class="{ active: isActive('groups') }"
          @click.prevent="handleNavClick('groups', '/groups')"
        >
          <span class="icon" v-html="icons.groups"></span>
          <span class="label">Группы</span>
        </router-link>

        <router-link
          to="/teachers"
          class="nav-item"
          :class="{ active: isActive('teachers') }"
          @click.prevent="handleNavClick('teachers', '/teachers')"
        >
          <span class="icon" v-html="icons.teachers"></span>
          <span class="label">Преподаватели</span>
        </router-link>

        <router-link
          to="/classrooms"
          class="nav-item"
          :class="{ active: isActive('classrooms') }"
          @click.prevent="handleNavClick('classrooms', '/classrooms')"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import twemoji from 'twemoji'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import { hasEntitySelection, clearEntitySelection } from '../composables/entitySelection'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

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
  more: twemoji.parse('➕', twemojiOptions),
  profile: twemoji.parse('👤', twemojiOptions),
}

const windowWidth = ref(window.innerWidth)
const moreMenuOpen = ref(false)
const entityRoutes = ['groups', 'teachers', 'classrooms']
const MOBILE_SIDE_GUTTERS = 32
const MOBILE_NAV_MAX_WIDTH = 420
const MOBILE_ITEM_WIDTH = 74
const MOBILE_NAV_HORIZONTAL_PADDING = 16

const isMobile = computed(() => windowWidth.value < 768)
const mobileNavInnerWidth = computed(() => {
  const viewportLimitedWidth = Math.max(0, windowWidth.value - MOBILE_SIDE_GUTTERS)
  return Math.min(viewportLimitedWidth, MOBILE_NAV_MAX_WIDTH)
})
const mobileNavCanFitAll = computed(() => mobileNavInnerWidth.value >= MOBILE_ITEM_WIDTH * 5 + MOBILE_NAV_HORIZONTAL_PADDING)
const showCompactMobileNav = computed(() => isMobile.value && !mobileNavCanFitAll.value)
const profileLabel = computed(() => (isAuthenticated.value ? 'Профиль' : 'Войти'))
const isMoreActive = computed(() => showCompactMobileNav.value && ['classrooms', 'profile'].includes(route.name))

const isActive = (name) => route.name === name

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

watch(() => route.fullPath, () => {
  closeMoreMenu()
})

watch(showCompactMobileNav, (isCompact) => {
  if (!isCompact) closeMoreMenu()
})

function handleResize() {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 768) closeMoreMenu()
}

function clearPreviousEntitySelection(targetName) {
  if (entityRoutes.includes(route.name) && route.name !== targetName) {
    clearEntitySelection(route.name)
  }
}

function handleNavClick(name, to) {
  closeMoreMenu()

  if (route.name === name) {
    if (entityRoutes.includes(name) && hasEntitySelection(name)) {
      clearEntitySelection(name)
    }
    return
  }

  clearPreviousEntitySelection(name)
  router.push(to).catch(() => {})
}

function handleMoreNavClick(name, to) {
  handleNavClick(name, to)
}

function toggleMoreMenu() {
  moreMenuOpen.value = !moreMenuOpen.value
}

function closeMoreMenu() {
  moreMenuOpen.value = false
}

function handleProfileClick() {
  closeMoreMenu()
  clearPreviousEntitySelection('profile')
  if (!isAuthenticated.value) {
    router.push('/schedule').catch(() => {})
  } else {
    router.push('/profile').catch(() => {})
  }
}
</script>

<style scoped>
.nav-wrapper {
  position: relative;
  font-family: Inter, system-ui, sans-serif;
}

.nav-item {
  display: flex;
  cursor: pointer;
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.18s ease;
  border-radius: 14px;
  backdrop-filter: blur(8px);
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.nav-item.active {
  background: var(--color-accent-bg);
  border: 1px solid var(--color-border-strong);
  color: var(--color-accent);
  font-weight: 600;
}

.icon {
  display: inline-block;
  color: currentColor;
}

.icon img {
  width: 100%;
  height: 100%;
  display: block;
}

.bottom-nav {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  left: 16px;
  right: 16px;
  max-width: 420px;
  margin: 0 auto;
  height: 68px;
  background: var(--color-overlay);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  border-radius: 28px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
  z-index: 1000;
  box-shadow: var(--shadow-surface);
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

.bottom-nav .nav-item-more {
  width: 56px;
}

.bottom-nav .nav-item-more .icon {
  width: 28px;
  height: 28px;
}

.more-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.more-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: var(--color-backdrop);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.more-sheet {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  max-width: 420px;
  margin: 0 auto;
  padding: 10px;
  border-radius: 22px;
  background: var(--color-overlay-strong);
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 36px var(--color-shadow-strong);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.more-item {
  width: 100%;
  border: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.more-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.more-item.active {
  background: var(--color-accent-bg);
  border: 1px solid var(--color-border-strong);
  color: var(--color-accent);
  font-weight: 600;
}

.more-item .icon {
  width: 24px;
  height: 24px;
}

.more-item .label {
  font-size: 0.95rem;
  font-weight: 500;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: var(--color-bg-app);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  color: var(--color-text-primary);
}

.logo {
  padding: 24px 20px;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.5px;
  border-bottom: 1px solid var(--color-border-soft);
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
  border-top: 1px solid var(--color-border-soft);
}

.sidebar .nav-item {
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin: 2px 0;
  border-radius: 14px;
  backdrop-filter: blur(8px);
}

.sidebar .icon {
  width: 26px;
  height: 26px;
}

.sidebar .label {
  font-size: 0.95rem;
  font-weight: 500;
}

.sidebar .nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  transform: translateX(4px);
}

.sidebar .nav-item.active {
  background: var(--color-accent-bg);
  border: 1px solid var(--color-border-strong);
  color: var(--color-accent);
  font-weight: 600;
  transform: translateX(0);
}

@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}

@media (min-width: 768px) {
  .bottom-nav,
  .more-overlay {
    display: none;
  }
}
</style>
