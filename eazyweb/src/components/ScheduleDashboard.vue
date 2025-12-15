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
                    <button class="calendar-button" @click="toggleCalendar">
                        {{ currentMonthYear }} 
                        <span class="dropdown-arrow">▼</span>
                    </button>

                    <VueDatePicker
                    v-if="calendarVisible"
                    v-model="selectedWeek" 
                    week-picker
                    inline
                    auto-apply
                    :min-date="minDateObj"
                    :max-date="maxDateObj"
                    :time-config="{ enableTimePicker: false }"
                    :config="{ 
                      closeOnScroll: true, 
                      onClickOutside: () => calendarVisible = false
                      }"
                    :locale="ru"
                    @update:model-value="onWeekSelected"
                    class="dashboard-datepicker" />
                </div>

                <button v-if="!(isCurrentWeek)" class="today-button" @click="goToCurrentWeek">
                    Сегодня
                </button>
                <div class="week-nav">
                    <button @click="prevWeek" class="nav-arrow" :disabled="isPrevDisabled">‹</button>
                    <button @click="nextWeek" class="nav-arrow" :disabled="isNextDisabled">›</button>
                </div>
            </div>
        </header>

        <!-- Контент (режимы) -->
        <main class="dashboard-content">
            <p>Режим: {{ currentMode === 'daily' ? 'Дни недели' : 'Неделя списком' }}</p>
            <p>Выбрана неделя: {{ currentWeekStart }} – {{ currentWeekEnd }}</p>
            <p>Entity: {{ entityType }} ID {{ entityId }}</p>
            <!-- Здесь будут уроки (шаг 5) -->
        </main>
    </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
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

const props = defineProps({
  entityId: { type: String, required: true },
  entityType: { type: String, required: true },
  entityName: { type: String, required: true },
  showBackButton: { type: Boolean, default: false }
})

const emit = defineEmits(['back'])

const authStore = useAuthStore()
const { subscription } = storeToRefs(authStore)

const isSubscribed = computed(() => {
  return subscription.value !== null && subscription.value.id === props.entityId
})

const currentMode = ref('daily')
const currentWeekOffset = ref(0)

const MIN_OFFSET = -52  // год назад
const MAX_OFFSET = 1    // +2 недели вперёд

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

// Календарь
const calendarVisible = ref(false)
const selectedWeek = ref(null)  // [Date, Date] — понедельник и воскресенье

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

function toggleCalendar() {
  calendarVisible.value 
    ? calendarVisible.value = false
    : calendarVisible.value = true
}

// Остальные функции
function toggleSubscription() {
  if (isSubscribed.value) {
    if (confirm('Отписаться от этого расписания?')) {
      authStore.unsubscribe()
    }
  } else {
    const newEntity = {
      id: props.entityId,
      name: props.entityName,
      type: props.entityType
    }

    if (subscription.value && confirm('Заменить текущую подписку на эту?')) {
      authStore.subscribe(newEntity)
    } else if (!subscription.value) {
      authStore.subscribe(newEntity)
    }
  }
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

function onClickOutsideCalendar() {
  calendarVisible.value = false
}

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

    padding: 12px 16px 8px;
}

/* ============== HEADER ROWS ============ */
.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;

    padding-bottom: 8px;
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
    background: #e8f4fc;
    color: #27A7E7;

    border: none;
    border-radius: 10px;

    padding: 8px 14px;
    font-size: 0.9rem;
    font-weight: 500;

    cursor: pointer;
    transition: background 0.2s;
}

.today-button:hover {
    background: #d8ecfa;
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
    padding: 20px 16px;
    color: #555;
}

.calendar-wrapper {
  position: relative;
  display: inline-block;
}

/* Popover-календарь — строго под кнопкой, фиксированная ширина из коробки */
.dashboard-datepicker {
  position: absolute;
  top: 100%;           /* Непосредственно под кнопкой */
  left: 0;             /* Выравнивание по левому краю кнопки */
  margin-top: 8px;     /* Небольшой отступ */
  z-index: 1000;

  /* Не трогаем ширину — оставляем стандартную от библиотеки */
  width: max-content;

  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #eee;
  overflow: hidden;
}

/* Убираем стрелочку вверх, если она тебе не нужна */
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