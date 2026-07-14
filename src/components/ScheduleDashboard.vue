<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-top">
        <div class="left-group">
          <button v-if="showBackButton" class="back-button" @click="emit('back')" aria-label="Назад">
            <ArrowLeftCircleIcon class="back-icon" />
          </button>

          <div class="entity-title">
            <h2>{{ entityName }}</h2>
            <button v-if="showSubscriptionButton" class="star-button" :class="{ subscribed: isSubscribed }" @click="toggleSubscription" :aria-label="isSubscribed ? 'Отписаться' : 'Подписаться'">
              <StarSolidIcon v-if="isSubscribed" class="star-icon" />
              <StarOutlineIcon v-else class="star-icon" />
            </button>
            <p v-if="showSubscriptionButton && guestSubscribeHintVisible" class="guest-subscribe-hint" role="status" aria-live="polite">
              Подписка и уведомления доступны после входа
            </p>
          </div>
        </div>

        <button class="mode-toggle-button" @click="toggleMode" :aria-label="'Режим отображения'" :title="currentMode === 'daily' ? 'Переключить на недельный вид' : 'Переключить на дневной вид'">
          <ViewColumnsIcon v-if="currentMode === 'daily'" class="mode-icon" />
          <QueueListIcon v-else class="mode-icon" />
        </button>
      </div>

      <div class="header-bottom">
        <div class="week-block">
          <div class="calendar-wrapper">
            <button ref="calendarButtonRef" class="calendar-button" @click="toggleCalendar">
              {{ currentMonthYear }}
              <ChevronDownIcon class="dropdown-arrow" />
            </button>

            <button v-if="!isCurrentWeek" class="today-button" @click="goToCurrentWeek">
              {{ todayDay }}
            </button>
          </div>
        </div>

        <div class="week-nav">
          <button @click="prevWeek" class="nav-arrow" :disabled="isPrevDisabled" aria-label="Предыдущая неделя">
            <ChevronLeftIcon class="nav-arrow-icon" />
          </button>
          <button @click="nextWeek" class="nav-arrow" :disabled="isNextDisabled" aria-label="Следующая неделя">
            <ChevronRightIcon class="nav-arrow-icon" />
          </button>
        </div>
      </div>

    </header>

    <div v-if="calendarVisible" class="overlay" @click="calendarVisible = false">
      <div class="calendar-popup" :style="popupStyle" @click.stop>
        <VueDatePicker
          v-model="selectedWeek"
          week-picker
          inline
          auto-apply
          :min-date="minDateObj"
          :max-date="maxDateObj"
          :time-config="{ enableTimePicker: false }"
          :locale="ru"
          @update:model-value="onWeekSelected"
          class="dashboard-datepicker"
        />
      </div>
    </div>

    <div v-if="showReplaceConfirm" class="overlay modal-overlay" @click="cancelReplaceSubscription">
      <div class="modal-dialog" @click.stop>
        <p>Текущая подписка на <strong>{{ subscription?.name }}</strong> будет заменена. Продолжить?</p>
        <div class="modal-actions">
          <button class="modal-btn primary" @click="confirmReplaceSubscription">Ок</button>
          <button class="modal-btn" @click="cancelReplaceSubscription">Отмена</button>
        </div>
      </div>
    </div>

    <div v-if="showUnsubscribeConfirm" class="overlay modal-overlay" @click="cancelUnsubscribe">
      <div class="modal-dialog" @click.stop>
        <p>Отписаться от <strong>{{ subscription?.name }}</strong>?</p>
        <div class="modal-actions">
          <button class="modal-btn primary" @click="confirmUnsubscribe">Ок</button>
          <button class="modal-btn" @click="cancelUnsubscribe">Отмена</button>
        </div>
      </div>
    </div>

    <main class="dashboard-content">
      <component
        :is="currentMode === 'daily' ? DailyMode : WeeklyMode"
        :weekStart="weekStartIso"
        :lessons="lessons"
        :entityType="props.entityType"
        :loading="loading"
        :loadError="loadError"
        @open-entity="(e) => emit('open-entity', e)"
        @retry="loadLessons"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

import {
  ViewColumnsIcon,
  QueueListIcon,
  ArrowLeftCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon as StarOutlineIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ru } from 'date-fns/locale'
import { format } from 'date-fns'
import DailyMode from './DailyMode.vue'
import WeeklyMode from './WeeklyMode.vue'
import { fetchLessons } from '../api/lessonsService'

const props = defineProps({
  entityId: { type: String, required: true },
  entityType: { type: String, required: true },
  entityName: { type: String, required: true },
  showBackButton: { type: Boolean, default: false }
})

const emit = defineEmits(['back', 'open-entity'])

const authStore = useAuthStore()
const router = useRouter()
const { subscription } = storeToRefs(authStore)

const isSubscribed = computed(() => subscription.value !== null && subscription.value.id === props.entityId)
const showSubscriptionButton = computed(() => props.entityType !== 'classroom')

const STORAGE_KEY = 'eazyweb.schedule.mode'

function loadStoredMode() {
  if (typeof window === 'undefined') return 'daily'

  try {
    const savedMode = window.localStorage.getItem(STORAGE_KEY)
    return savedMode === 'weekly' ? 'weekly' : 'daily'
  } catch {
    return 'daily'
  }
}

const currentMode = ref(loadStoredMode())
const currentWeekOffset = ref(0)

const MIN_OFFSET = -52
const MAX_OFFSET = 1

const isPrevDisabled = computed(() => currentWeekOffset.value <= MIN_OFFSET)
const isNextDisabled = computed(() => currentWeekOffset.value >= MAX_OFFSET)

const today = new Date()

const minDateObj = computed(() => {
  const monday = new Date(today)
  const day = monday.getDay()
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff + MIN_OFFSET * 7)
  return monday
})

const maxDateObj = computed(() => {
  const sunday = new Date(today)
  const day = sunday.getDay()
  const diff = sunday.getDate() - day + (day === 0 ? -6 : 1)
  sunday.setDate(diff + MAX_OFFSET * 7 + 6)
  return sunday
})

const currentMonthYear = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + currentWeekOffset.value * 7)
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')
})

const isCurrentWeek = computed(() => currentWeekOffset.value === 0)

const todayDay = computed(() => {
  const d = new Date()
  return d.getDate()
})

const weekStartIso = computed(() => {
  const d = new Date(today)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff + currentWeekOffset.value * 7)
  return format(d, 'yyyy-MM-dd')
})

const lessons = ref([])
const loading = ref(false)
const loadError = ref(null)

async function loadLessons() {
  const dateFrom = weekStartIso.value
  const d = new Date(weekStartIso.value)
  d.setDate(d.getDate() + 6)
  const dateTo = d.toISOString().slice(0, 10)

  loading.value = true
  loadError.value = null
  lessons.value = []

  try {
    const opts = { date_from: dateFrom, date_to: dateTo }
    if (props.entityType === 'group') opts.group = props.entityId
    else if (props.entityType === 'teacher') opts.teacher = props.entityId
    else if (props.entityType === 'classroom') opts.classroom = props.entityId

    const res = await fetchLessons(opts)
    lessons.value = res.lessons
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Ошибка при загрузке занятий.'
    lessons.value = []
  } finally {
    loading.value = false
  }
}

const calendarVisible = ref(false)
const selectedWeek = ref(null)
const calendarButtonRef = ref(null)
const popupStyle = ref({})
let rafId = null

function handleReposition() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    positionPopupNearButton()
  })
}

function addRepositionListeners() {
  window.addEventListener('resize', handleReposition, { passive: true })
  window.addEventListener('scroll', handleReposition, { passive: true })
}

function removeRepositionListeners() {
  window.removeEventListener('resize', handleReposition)
  window.removeEventListener('scroll', handleReposition)
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

watch(calendarVisible, (visible) => {
  if (visible) {
    const monday = new Date(today)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff + currentWeekOffset.value * 7)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    selectedWeek.value = [monday, sunday]

    nextTick(() => {
      positionPopupNearButton()
      addRepositionListeners()
    })
  } else {
    removeRepositionListeners()
  }
})

function onWeekSelected(weekArray) {
  if (!weekArray || weekArray.length < 2) return
  const monday = weekArray[0]
  const diffDays = Math.round((monday - today) / 86400000)
  currentWeekOffset.value = Math.round(diffDays / 7)
  calendarVisible.value = false
}

function positionPopupNearButton() {
  const btn = calendarButtonRef.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const pickerWidth = 320

  let left = rect.left
  if (left + pickerWidth > vw - 8) left = Math.max(8, vw - pickerWidth - 8)

  const top = rect.bottom + 8

  popupStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`
  }
}

function toggleCalendar() {
  if (calendarVisible.value) {
    calendarVisible.value = false
    return
  }

  calendarVisible.value = true
  nextTick(() => {
    positionPopupNearButton()
  })
}

const showReplaceConfirm = ref(false)
const pendingNewEntity = ref(null)
const showUnsubscribeConfirm = ref(false)
const guestSubscribeHintVisible = ref(false)
let guestSubscribeHintTimer = null

async function toggleSubscription() {
  if (!authStore.isAuthenticated) {
    showGuestSubscribeHint()
    return
  }

  if (isSubscribed.value) {
    showUnsubscribeConfirm.value = true
    return
  }

  const newEntity = {
    id: props.entityId,
    name: props.entityName,
    type: props.entityType
  }

  if (subscription.value) {
    pendingNewEntity.value = newEntity
    showReplaceConfirm.value = true
  } else {
    try {
      await authStore.subscribe(newEntity)
      router.push({ name: 'schedule' })
    } catch (e) {
      console.error(e)
    }
  }
}

async function confirmReplaceSubscription() {
  if (!pendingNewEntity.value) return cancelReplaceSubscription()
  showReplaceConfirm.value = false
  try {
    await authStore.subscribe(pendingNewEntity.value)
    router.push({ name: 'schedule' })
  } catch (e) {
    console.error(e)
  } finally {
    pendingNewEntity.value = null
  }
}

function cancelReplaceSubscription() {
  showReplaceConfirm.value = false
  pendingNewEntity.value = null
}

async function confirmUnsubscribe() {
  showUnsubscribeConfirm.value = false
  try {
    await authStore.unsubscribe()
  } catch (e) {
    console.error(e)
  }
}

function cancelUnsubscribe() {
  showUnsubscribeConfirm.value = false
}

function showGuestSubscribeHint() {
  guestSubscribeHintVisible.value = true
  if (guestSubscribeHintTimer) clearTimeout(guestSubscribeHintTimer)
  guestSubscribeHintTimer = setTimeout(() => {
    guestSubscribeHintVisible.value = false
    guestSubscribeHintTimer = null
  }, 2200)
}

function toggleMode() {
  currentMode.value = currentMode.value === 'daily' ? 'weekly' : 'daily'
}

function prevWeek() {
  if (!isPrevDisabled.value) currentWeekOffset.value--
}

function nextWeek() {
  if (!isNextDisabled.value) currentWeekOffset.value++
}

function goToCurrentWeek() {
  currentWeekOffset.value = 0
}

onBeforeUnmount(() => {
  removeRepositionListeners()
  if (guestSubscribeHintTimer) {
    clearTimeout(guestSubscribeHintTimer)
    guestSubscribeHintTimer = null
  }
})

watch(currentMode, (mode) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {}
})

watch([() => props.entityId, () => props.entityType], () => {
  currentMode.value = loadStoredMode()
})

watch([() => props.entityId, () => props.entityType, weekStartIso], () => {
  loadLessons()
}, { immediate: true })
</script>

<style scoped>
/* ===== BASE ===== */
.dashboard {
  margin: 0 auto;
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  background: transparent;
}

/* ===== HEADER ===== */
.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 12px;
  padding: 14px 18px;
  border-radius: 20px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: var(--surface-backdrop);
  -webkit-backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-surface);
}

.header-top {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.header-bottom {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.left-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.entity-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  position: relative;
}

.entity-title h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(65vw, 500px);
  letter-spacing: -0.02em;
}

.back-button,
.mode-toggle-button,
.nav-arrow,
.calendar-button,
.today-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-bg-surface-strong);
  border: 1px solid var(--color-border-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-raised);
}

.back-button:hover,
.mode-toggle-button:hover,
.nav-arrow:hover:not(:disabled),
.calendar-button:hover,
.today-button:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.back-icon,
.mode-icon,
.nav-arrow-icon,
.dropdown-arrow {
  width: 22px;
  height: 22px;
  color: var(--color-text-muted);
}

.star-button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, color 0.18s ease;
  color: var(--color-text-secondary);
}

.star-button:hover {
  transform: scale(1.12);
}

.star-button.subscribed {
  color: var(--color-success);
}

.star-icon {
  width: 24px;
  height: 24px;
}

.guest-subscribe-hint {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 5;
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.2;
  max-width: min(72vw, 280px);
  white-space: normal;
  color: var(--color-warning);
  background: var(--color-overlay-strong);
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: var(--shadow-hover);
  pointer-events: none;
}

.week-block {
  display: flex;
  align-items: center;
}

.calendar-wrapper {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.calendar-button {
  padding: 8px 14px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  text-transform: capitalize;
  min-width: 140px;
  justify-content: space-between;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
}

.today-button {
  width: auto;
  min-width: 40px;
  padding: 8px 12px;
  font-weight: 700;
  color: var(--color-success);
  background: var(--color-accent-soft-bg);
  border-color: var(--color-border-strong);
}

.week-nav {
  display: flex;
  gap: 8px;
}

.nav-arrow {
  width: 36px;
  height: 36px;
}

.nav-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

/* ===== POPUP КАЛЕНДАРЬ ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-backdrop-strong);
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.calendar-popup {
  position: absolute;
  z-index: 1002;
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-modal);
  overflow: hidden;
}

/* ===== МОДАЛКИ ===== */
.modal-overlay {
  background: var(--color-overlay-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-dialog {
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px 24px;
  max-width: 420px;
  width: calc(100% - 32px);
  box-shadow: var(--shadow-modal);
  color: var(--color-text-primary);
}

.modal-dialog p {
  margin: 0 0 16px;
  font-size: 1.05rem;
}

.modal-dialog strong {
  color: var(--color-accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-primary);
}

.modal-btn.primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg-canvas);
}

.modal-btn:hover {
  transform: translateY(-2px);
}

/* ===== CONTENT ===== */
.dashboard-content {
  min-width: 0;
}

/* ===== DATEPICKER OVERRIDE (vue-datepicker) ===== */
.dashboard-datepicker {
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* Responsive */
@media (max-width: 767px) {
  .dashboard-header {
    padding: 12px 14px;
    border-radius: 16px;
  }

  .entity-title h2 {
    font-size: 1.18rem;
    max-width: min(60vw, 320px);
  }

  .back-button,
  .mode-toggle-button,
  .nav-arrow {
    width: 38px;
    height: 38px;
  }

  .calendar-button {
    font-size: 0.9rem;
    padding: 7px 12px;
  }
}
</style>
