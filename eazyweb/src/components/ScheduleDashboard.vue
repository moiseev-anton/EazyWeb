<template>
    <div class="dashboard">
        <!-- Sticky заголовок -->
        <header class="dashboard-header">
            <!-- Ряд 1 -->
            <div class="header-top">
                <div class="left-group">
                    <button v-if="showBackButton" class="back-button" @click="emit('back')" aria-label="Назад">
                        <ArrowLeftCircleIcon class="back-icon" />
                    </button>

                    <div class="entity-title">
                        <h2>{{ entityName }}</h2>
                        <button class="star-button" :class="{ subscribed: isSubscribed }" @click="toggleSubscription">
                            {{ isSubscribed ? '★' : '☆' }}
                        </button>
                    </div>
                </div>

                <button class="mode-toggle-button" @click="toggleMode">
                    <ViewColumnsIcon v-if="currentMode === 'daily'" class="mode-icon" />
                    <QueueListIcon v-else class="mode-icon" />
                </button>
            </div>

            <!-- Ряд 2 -->
            <div class="header-bottom">

                <div class="calendar-wrapper">
                  <button ref="calendarButtonRef" class="calendar-button" @click="toggleCalendar">
                    {{ currentMonthYear }} 
                    <span class="dropdown-arrow">▼</span>
                  </button>

                  <button v-if="!(isCurrentWeek)" class="today-button" @click="goToCurrentWeek">
                    {{ todayDay }}
                  </button>
                </div>

                <!-- Прозрачный оверлей, который блокирует клики по остальным элементам страницы -->
                <div v-if="calendarVisible" class="overlay" @click="calendarVisible = false">
                  <div
                    class="calendar-popup"
                    :style="popupStyle"
                    @click.stop
                  >
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
                      class="dashboard-datepicker" />
                  </div>
                </div>

                <div class="week-nav">
                    <button @click="prevWeek" class="nav-arrow" :disabled="isPrevDisabled">‹</button>
                    <button @click="nextWeek" class="nav-arrow" :disabled="isNextDisabled">›</button>
                </div>
            </div>
        </header>

        <!-- Replace-confirm modal -->
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

        <!-- Контент (режимы) -->
        <main class="dashboard-content">
          <component :is="currentMode === 'daily' ? DailyMode : WeeklyMode"
                 :weekStart="weekStartIso"
                 :lessons="lessons"
                 :entityType="props.entityType"
                 @open-entity="(e) => emit('open-entity', e)" />
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
  ArrowLeftCircleIcon
} from '@heroicons/vue/24/outline'

import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ru } from 'date-fns/locale'  // Русская локаль
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

const isSubscribed = computed(() => {
  return subscription.value !== null && subscription.value.id === props.entityId
})

const currentMode = ref('daily')
const currentWeekOffset = ref(0)

const MIN_OFFSET = -52  // недели назад
const MAX_OFFSET = 1    // недели вперёд

const isPrevDisabled = computed(() => currentWeekOffset.value <= MIN_OFFSET )
const isNextDisabled = computed(() => currentWeekOffset.value >= MAX_OFFSET )


const today = new Date()

// Ограничения дат
const minDateObj = computed(() => {
  const monday = new Date(today)
  const day = monday.getDay()
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)  // Текущий понедельник
  monday.setDate(diff + MIN_OFFSET * 7)
  return monday
})

const maxDateObj = computed(() => {
  const sunday = new Date(today)
  const day = sunday.getDay()
  const diff = sunday.getDate() - day + (day === 0 ? -6 : 1)  // Текущий понедельник
  sunday.setDate(diff + MAX_OFFSET * 7 + 6)  // Воскресенье +MAX_OFFSET недель
  return sunday
})

// Текущий месяц и год для кнопки
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

const currentWeekStart = computed(() => {
  const d = new Date(today)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Понедельник
  d.setDate(diff + currentWeekOffset.value * 7)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')
})

const currentWeekEnd = computed(() => {
  const d = new Date(today)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff + currentWeekOffset.value * 7 + 6)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')
})

// weekStart ISO для передачи в режимы
const weekStartIso = computed(() => {
  const d = new Date(today)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff + currentWeekOffset.value * 7)
  return format(d, 'yyyy-MM-dd')
})

// Уроки в формате json:api (массив объектов с полем _resolved)
const lessons = ref([])

// Загрузка уроков при смене выбранной сущности или недели
async function loadLessons() {
  const dateFrom = weekStartIso.value
  // compute week end (date_from + 6 days)
  const d = new Date(weekStartIso.value)
  d.setDate(d.getDate() + 6)
  const dateTo = d.toISOString().slice(0,10)

  try {
    const opts = { date_from: dateFrom, date_to: dateTo }
    if (props.entityType === 'group') opts.group = props.entityId
    else if (props.entityType === 'teacher') opts.teacher = props.entityId

    const res = await fetchLessons(opts)
    lessons.value = res.lessons
  } catch (e) {
    console.error('Failed to load lessons', e)
    lessons.value = []
  }
}

// Календарь
const calendarVisible = ref(false)
const selectedWeek = ref(null)  // [Date, Date] — понедельник и воскресенье
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

// Синхронизация: при открытии календаря показываем текущую неделю
watch(calendarVisible, (visible) => {
  if (visible) {
    const monday = new Date(today)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff + currentWeekOffset.value * 7)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    selectedWeek.value = [monday, sunday]

    // добавить слушатели и позиционировать
    nextTick(() => {
      positionPopupNearButton()
      addRepositionListeners()
    })
  } else {
    removeRepositionListeners()
  }
})

// При выборе недели в календаре
function onWeekSelected(weekArray) {
  if (!weekArray || weekArray.length < 2) return

  const monday = weekArray[0]
  const diffDays = Math.round((monday - today) / (86400000)) // 86400000 = 24*60*60*1000
  currentWeekOffset.value = Math.round(diffDays / 7)

  calendarVisible.value = false
}

function positionPopupNearButton() {
  const btn = calendarButtonRef.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const pickerWidth = 320 // приблизительная ширина попапа

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

// Остальные функции
const showReplaceConfirm = ref(false)
const pendingNewEntity = ref(null)
const showUnsubscribeConfirm = ref(false)

async function toggleSubscription() {
  if (isSubscribed.value) {
    // show custom modal for unsubscribe
    showUnsubscribeConfirm.value = true
    return
  } else {
    const newEntity = {
      id: props.entityId,
      name: props.entityName,
      type: props.entityType
    }

    if (subscription.value) {
      // show custom replace confirmation
      pendingNewEntity.value = newEntity
      showReplaceConfirm.value = true
    } else {
      try {
        await authStore.subscribe(newEntity)
        // после успешной подписки перейти на вкладку Расписание
        router.push({ name: 'schedule' })
      } catch (e) { console.error(e) }
    }
  }
}

async function confirmReplaceSubscription() {
  if (!pendingNewEntity.value) return cancelReplaceSubscription()
  showReplaceConfirm.value = false
  try {
    await authStore.subscribe(pendingNewEntity.value)
    // после успешной подписки перейти на вкладку Расписание
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

// watch for week or entity changes
watch([() => props.entityId, () => props.entityType, weekStartIso], () => {
  loadLessons()
}, { immediate: true })

</script>

<style scoped>
/* ===== LEFT GROUP ===== */
.left-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* ===== BACK BUTTON ===== */
.back-button {
    background: #ffffff00;

    border: none;
    border-radius: 10px;

    width: 34px;
    height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;
    transition: background 0.2s;
}

.back-button:hover {
    background: #e9ecef;
}

.back-icon {
    scale: 1.25;
    color: #555;
    /* тот же тон, что mode-icon */
}

/* ===== BASE ======== */
.schedule-view {
    padding: 0;
    background: #f6f7f9;
    min-height: 100vh;
}

.dashboard {
    /* max-width: 900px; */
    margin: 0 auto;
}

/* =====HEADER (Sticky Card) =========== */
.dashboard-header {
    position: sticky;
    top: 0;
    z-index: 10;

    background: #ffffff;
    border-radius: 0 0 16px 16px;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.06),
        0 1px 0 rgba(0, 0, 0, 0.04);

    padding: 8px 16px 8px;
}

/* ============== HEADER ROWS ============ */
.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    /* border-bottom: 1px solid #f0f0f0; */
}

.header-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

/* ================================
   ENTITY TITLE
================================ */
.entity-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.entity-title h2 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: #1c1c1c;
}

/* ================================
   STAR BUTTON
================================ */
.star-button {
    background: none;
    border: none;
    cursor: pointer;

    font-size: 1.6rem;
    line-height: 1;
    padding: 4px;

    color: #c0c0c0;
    opacity: 0.7;
    transition: color 0.2s, opacity 0.2s;
}

.star-button.subscribed {
    color: #f9a825;
    opacity: 1;
}

/* ================================
   MODE TOGGLE
================================ */
.mode-toggle-button {
    background: #f4f6f8;
    border: none;
    border-radius: 10px;

    padding: 6px;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    transition: background 0.2s;
}

.mode-toggle-button:hover {
    background: #e9ecef;
}

.mode-icon {
    width: 22px;
    height: 22px;
    color: #555;
}

/* ================================
   CALENDAR BUTTON
================================ */
.calendar-button {
    /* background: #f6f7f9; */
    border: none;
    border-radius: 10px;

    padding: 8px 12px;
    cursor: pointer;

    display: flex;
    align-items: center;
    gap: 6px;

    font-size: 0.95rem;
    font-weight: 500;
    color: #333;

    transition: background 0.2s;
}

.calendar-button:hover {
    background: #eceef1;
}

.dropdown-arrow {
    font-size: 0.75rem;
    opacity: 0.6;
}

/* ================================
   TODAY BUTTON
================================ */
.today-button {
  background: #ffffff;
  color: #27A7E7;

  border: 2px solid #27A7E7;
  border-radius: 8px;

  

  padding: 4px 8px;
  min-width: 36px;
  font-size: 0.95rem;
  font-weight: 700;

  cursor: pointer;
  transition: background 0.12s, transform 0.08s;
}

.today-button:hover {
  background: #f0fbff;
  transform: translateY(-1px);
}

/* ================================
   WEEK NAV
================================ */
.week-nav {
    display: flex;
    gap: 4px;
}

.nav-arrow {
    background: #ffffff;
    border: 1px solid #e0e0e0;

    width: 28px;
    height: 28px;
    border-radius: 10px;

    font-size: 1.2rem;
    line-height: 1;

    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: background 0.2s, border-color 0.2s;
}

.nav-arrow:hover {
    background: #f2f2f2;
    border-color: #d0d0d0;
}

/* ================================
   CONTENT
================================ */
.dashboard-content {
    padding: 8px 16px;
    color: #555;
}

.calendar-wrapper {
  position: relative;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

/* Popover-календарь — строго под кнопкой, фиксированная ширина из коробки */
.dashboard-datepicker {
  /* позиция задаётся внешним контейнером (`.calendar-popup`) */
  z-index: 1001;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #eee;
  overflow: hidden;
}

/* Полноэкранный прозрачный оверлей, который блокирует клики по странице */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0); /* полностью прозрачный, но перехватывает клики */
  z-index: 1000;
}

/* Модальное подтверждение замены подписки */
.modal-overlay {
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  max-width: 420px;
  width: calc(100% - 48px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.modal-btn {
  background: #fff;
  border: 1px solid #d0d0d0;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.modal-btn.primary {
  background: #27A7E7;
  color: white;
  border-color: #27A7E7;
}

.calendar-popup {
  position: absolute; /* позиционируется относительно окна через inline-стиль */
  z-index: 1002;
}

.dashboard-datepicker::before {
  display: none;
}

/* На мобильных — тоже фиксированная ширина, без растяжки */
@media (max-width: 767px) {
  .dashboard-datepicker {
    left: 0;
    right: auto;
    width: max-content;
    max-width: calc(100vw - 32px); /* Чтобы не выходил за края экрана */
  }
}

</style>