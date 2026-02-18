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
            <button class="star-button" :class="{ subscribed: isSubscribed }" @click="toggleSubscription" :aria-label="isSubscribed ? 'Отписаться' : 'Подписаться'">
              <StarSolidIcon v-if="isSubscribed" class="star-icon" />
              <StarOutlineIcon v-else class="star-icon" />
            </button>
          </div>
        </div>

        <button class="mode-toggle-button" @click="toggleMode" :aria-label="currentMode === 'daily' ? 'Переключить на недельный вид' : 'Переключить на дневной вид'">
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
    </header>

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

const currentMode = ref('daily')
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
    position: 'absolute',
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

async function toggleSubscription() {
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
})

watch([() => props.entityId, () => props.entityType, weekStartIso], () => {
  loadLessons()
}, { immediate: true })
</script>

<style scoped>
.dashboard {
  margin: 0 auto;
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
}

.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 6px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(14, 116, 144, 0.2);;
  background: var(--bg-surface);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.left-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.entity-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.entity-title h2 {
  margin: 0;
  font-size: 1.22rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(68vw, 560px);
}

.back-button,
.mode-toggle-button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #d9e7f2;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.1s ease;
}

.back-button:hover,
.mode-toggle-button:hover {
  background: var(--bg-muted);
  border-color: #b8d9f2;
}

.back-icon,
.mode-icon {
  width: 21px;
  height: 21px;
  color: #334155;
}

.star-button {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #c2ccd8;
  padding: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, color 0.2s ease;
}

.star-button:hover {
  transform: scale(1.05);
}

.star-button.subscribed {
  color: #f59e0b;
}

.star-icon {
  width: 20px;
  height: 20px;
}

.week-block {
  display: flex;
}

.calendar-wrapper {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.calendar-button {
  border: 1px solid #d5e5f2;
  border-radius: 10px;
  padding: 7px 12px;
  background: #ffffff;
  color: #1f2937;
  font-weight: 600;
  font-size: 0.92rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-transform: capitalize;
  transition: background 0.16s, border-color 0.16s;
}

.calendar-button:hover {
  background: var(--bg-muted);
  border-color: #b8d9f2;
}

.dropdown-arrow {
  width: 14px;
  height: 14px;
  color: #64748b;
}

.today-button {
  border: 1px solid #8db8d6;
  border-radius: 10px;
  background: var(--bg-surface);
  color: #075985;
  padding: 7px 10px;
  min-width: 36px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.16s ease, transform 0.1s ease;
}

.today-button:hover {
  background: var(--bg-muted);
  transform: translateY(-1px);
}

.week-nav {
  display: flex;
  gap: 6px;
}

.nav-arrow {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid #d5e5f2;
  background: #ffffff;
  color: #1f2937;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.16s, border-color 0.16s;
}

.nav-arrow:hover:not(:disabled) {
  background: var(--bg-muted);
  border-color: #b8d9f2;
}

.nav-arrow:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nav-arrow-icon {
  width: 16px;
  height: 16px;
}

.dashboard-content {
  min-width: 0;
}

.dashboard-datepicker {
  z-index: 1001;
  background: white;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid #e6edf5;
  overflow: hidden;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 1000;
}

.calendar-popup {
  position: absolute;
  z-index: 1002;
}

.modal-overlay {
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-dialog {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  max-width: 420px;
  width: calc(100% - 48px);
  box-shadow: none;
}

.modal-dialog p {
  margin: 0;
  color: #1f2937;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.modal-btn {
  background: #fff;
  border: 1px solid #d0d7e1;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.modal-btn.primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

@media (max-width: 767px) {
  .dashboard-header {
    padding: 10px 10px;
    border-radius: 14px;
  }

  .entity-title h2 {
    font-size: 1.06rem;
    max-width: min(62vw, 360px);
  }

  .header-bottom {
    align-items: flex-end;
  }

  .dashboard-datepicker {
    left: 0;
    right: auto;
    width: max-content;
    max-width: calc(100vw - 32px);
  }
}
</style>
