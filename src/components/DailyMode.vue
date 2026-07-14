<template>
  <div class="daily-mode">
    <div class="days-wrap">
      <div class="days-row">
        <button
          v-for="d in weekDates"
          :key="d.iso"
          class="day-button"
          :class="{ today: d.isToday, selected: d.iso === selectedIso }"
          @click="selectDay(d.iso)"
        >
          <span class="day-name">{{ d.name }}</span>
          <div class="day-number">{{ d.day }}</div>
          <span class="lessons-count">{{ lessonsMap[d.iso] || 0 }}</span>
        </button>
      </div>
    </div>

    <div
      class="lessons-wrap"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
    >
      <div class="lessons-list">
      <div v-if="props.loading" class="cards skeleton-list">
        <li class="skeleton-card" v-for="n in 3" :key="n">
          <div class="sk-line top"></div>
          <div class="sk-line mid"></div>
          <div class="sk-line bot"></div>
        </li>
      </div>
      <div v-else-if="props.loadError">
        <LoadError :detail="' занятия'" @retry="() => emit('retry')" />
      </div>
      <div v-else>
        <Transition :name="dayTransitionName" mode="out-in" @after-enter="onDayTransitionEnd">
          <div :key="selectedIso" class="day-lessons-panel">
            <div v-if="(periodsMap[selectedIso] || []).length === 0" class="no-lessons">Нет занятий</div>
            <ul v-else class="cards">
              <li v-for="group in periodsMap[selectedIso] || []" :key="group.key" class="lesson-card">
                <LessonCard
                  :lessons="group.items"
                  :groupsMap="groupsMap"
                  :teachersMap="teachersMap"
                  :showSubject="true"
                  :prefer="entityType === 'group' ? 'teacher' : entityType === 'teacher' ? 'group' : 'both'"
                  @open-entity="(e) => emit('open-entity', e)"
                />
              </li>
            </ul>
          </div>
        </Transition>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LessonCard from './LessonCard.vue'
import LoadError from './LoadError.vue'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'

const props = defineProps({
  weekStart: { type: [String, Date], required: true },
  lessons: { type: Array, default: () => [] },
  entityType: { type: String, default: 'group' },
  loading: { type: Boolean, default: false },
  loadError: { type: String, default: null }
})

const emit = defineEmits(['open-entity', 'retry'])

const weekStartDate = computed(() => {
  const v = props.weekStart
  return typeof v === 'string' ? parseISO(v) : new Date(v)
})

const shortDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function buildWeekDates(monday) {
  const arr = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i)
    const iso = format(d, 'yyyy-MM-dd')
    arr.push({ date: d, iso, day: format(d, 'd'), name: shortDayNames[i], isToday: isSameDay(d, new Date()) })
  }
  return arr
}

const weekDates = computed(() => buildWeekDates(startOfWeek(weekStartDate.value, { weekStartsOn: 1 })))

function getSortValue(value) {
  if (value === null || value === undefined || value === '') return 0
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function compareLessons(a, b) {
  const numberDiff = getSortValue(a.attributes?.number) - getSortValue(b.attributes?.number)
  if (numberDiff !== 0) return numberDiff

  const partDiff = getSortValue(a.attributes?.part) - getSortValue(b.attributes?.part)
  if (partDiff !== 0) return partDiff

  const subgroupDiff = getSortValue(a.attributes?.subgroup) - getSortValue(b.attributes?.subgroup)
  if (subgroupDiff !== 0) return subgroupDiff

  return (a.attributes?.startTime || '').localeCompare(b.attributes?.startTime || '')
}

const periodsMap = computed(() => {
  const m = {}
  for (const l of props.lessons || []) {
    const date = l.attributes?.date
    if (!date) continue
    const key = `${date}|${l.attributes?.number || ''}|${l.attributes?.part ?? ''}|${l.attributes?.startTime || ''}|${l.attributes?.endTime || ''}`
    if (!m[date]) m[date] = []
    let grp = m[date].find(g => g.key === key)
    if (!grp) {
      grp = { key, items: [] }
      m[date].push(grp)
    }
    grp.items.push(l)
  }
  for (const k of Object.keys(m)) {
    m[k].forEach(group => {
      group.items.sort(compareLessons)
    })
    m[k].sort((a, b) => compareLessons(a.items[0], b.items[0]))
  }
  return m
})

const groupsMap = computed(() => {
  const map = {}
  for (const l of props.lessons || []) {
    const g = l._resolved?.group
    if (g) map[g.id] = g
  }
  return map
})

const teachersMap = computed(() => {
  const map = {}
  for (const l of props.lessons || []) {
    const t = l._resolved?.teacher
    if (t) map[t.id] = t
  }
  return map
})

const lessonsMap = computed(() => {
  const m = {}
  for (const l of props.lessons || []) {
    const date = l.attributes?.date
    if (!date) continue
    const number = l.attributes?.number || ''
    const part = l.attributes?.part ?? ''
    const startTime = l.attributes?.startTime || ''
    const endTime = l.attributes?.endTime || ''
    const periodKey = `${number}|${part}|${startTime}|${endTime}`
    if (!m[date]) m[date] = new Set()
    m[date].add(periodKey)
  }
  const counts = {}
  for (const k of Object.keys(m)) counts[k] = m[k].size
  return counts
})

const isCurrentWeek = computed(() => {
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  return weekDates.value.some(d => d.iso === todayIso)
})

const selectedIso = ref(isCurrentWeek.value ? format(new Date(), 'yyyy-MM-dd') : weekDates.value[0].iso)
const isSwipeTransition = ref(false)
const swipeDirection = ref('next')

const dayTransitionName = computed(() => {
  if (!isSwipeTransition.value) return 'day-swap-none'
  return swipeDirection.value === 'prev' ? 'day-swipe-prev' : 'day-swipe-next'
})

function selectDay(iso) {
  isSwipeTransition.value = false
  selectedIso.value = iso
}

const touchStartX = ref(0)
const touchStartY = ref(0)
const touchDeltaX = ref(0)
const touchDeltaY = ref(0)
const isTouchTracking = ref(false)

const SWIPE_THRESHOLD_PX = 48
const SWIPE_MAX_VERTICAL_PX = 40

function moveDayBy(offset, options = {}) {
  const { fromSwipe = false } = options
  const currentIndex = weekDates.value.findIndex(d => d.iso === selectedIso.value)
  if (currentIndex < 0) return
  const nextIndex = currentIndex + offset
  if (nextIndex < 0 || nextIndex >= weekDates.value.length) return
  isSwipeTransition.value = fromSwipe
  if (fromSwipe) swipeDirection.value = offset > 0 ? 'next' : 'prev'
  selectedIso.value = weekDates.value[nextIndex].iso
}

function onTouchStart(e) {
  if (!e.touches || e.touches.length !== 1) return
  const t = e.touches[0]
  touchStartX.value = t.clientX
  touchStartY.value = t.clientY
  touchDeltaX.value = 0
  touchDeltaY.value = 0
  isTouchTracking.value = true
}

function onTouchMove(e) {
  if (!isTouchTracking.value || !e.touches || e.touches.length !== 1) return
  const t = e.touches[0]
  touchDeltaX.value = t.clientX - touchStartX.value
  touchDeltaY.value = t.clientY - touchStartY.value
}

function onTouchEnd() {
  if (!isTouchTracking.value) return

  const absX = Math.abs(touchDeltaX.value)
  const absY = Math.abs(touchDeltaY.value)
  const isHorizontalSwipe = absX >= SWIPE_THRESHOLD_PX && absY <= SWIPE_MAX_VERTICAL_PX && absX > absY

  if (isHorizontalSwipe) {
    if (touchDeltaX.value < 0) moveDayBy(1, { fromSwipe: true }) // swipe left -> next day
    else moveDayBy(-1, { fromSwipe: true }) // swipe right -> previous day
  }

  isTouchTracking.value = false
}

function onTouchCancel() {
  isTouchTracking.value = false
}

function onDayTransitionEnd() {
  isSwipeTransition.value = false
}

watch(weekDates, (newVal) => {
  if (!newVal || newVal.length === 0) return
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const isCur = newVal.some(d => d.iso === todayIso)
  selectedIso.value = isCur ? todayIso : newVal[0].iso
})
</script>

<style scoped>
.daily-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lessons-wrap {
  flex: 1 1 auto;
  min-height: 36vh;
  touch-action: pan-y;
}

/* ===== ДНИ НЕДЕЛИ ===== */
.days-wrap {
  border-radius: 18px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  padding: 10px;
  box-shadow: var(--shadow-card);
}

.days-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.day-button {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-surface-elevated);
  backdrop-filter: blur(8px);
  cursor: pointer;
  padding: 10px 6px;
  transition: all 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  box-shadow: var(--shadow-raised);
}

.day-button:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.day-button.today {
  border-color: var(--color-accent-soft-border);
  background: var(--color-accent-soft-bg);
}

.day-button.selected {
  border-color: var(--color-accent-border);
  background: var(--color-accent-bg-strong);
  transform: translateY(-1px);
}

.day-name {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.day-number {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.lessons-count {
  min-width: 24px;
  height: 20px;
  border-radius: 999px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-pill-bg);
  backdrop-filter: blur(6px);
  color: var(--color-text-muted);
  font-weight: 700;
  font-size: 0.78rem;
  border: 1px solid var(--color-pill-border);
}

.lessons-list {
  border-radius: 18px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  padding: 12px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.day-lessons-panel {
  min-height: 1px;
}

.cards {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lesson-card {
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  container-type: inline-size;
}

.no-lessons {
  color: var(--color-text-secondary);
  margin: 48px 0;
  font-weight: 600;
  text-align: center;
  font-size: 1.05rem;
}

/* ===== SKELETON ===== */
.cards.skeleton-list {
  gap: 10px;
}

.skeleton-card {
  padding: 14px;
  border-radius: 14px;
  background: var(--color-bg-hover-strong);
  border: 1px solid var(--color-border-soft);
  backdrop-filter: blur(10px);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-line {
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 25%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.sk-line.top {
  height: 16px;
  width: 85%;
}

.sk-line.mid {
  height: 12px;
  width: 50%;
}

.sk-line.bot {
  height: 14px;
  width: 70%;
}

.day-swipe-next-enter-active,
.day-swipe-next-leave-active,
.day-swipe-prev-enter-active,
.day-swipe-prev-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.day-swipe-next-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.day-swipe-next-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.day-swipe-prev-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.day-swipe-prev-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

.day-swap-none-enter-active,
.day-swap-none-leave-active {
  transition: none;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Responsive */
@media (max-width: 560px) {
  .day-button {
    padding: 8px 4px;
    gap: 3px;
  }

  .day-name {
    font-size: 0.75rem;
  }

  .day-number {
    font-size: 1rem;
  }

  .lessons-count {
    min-width: 20px;
    height: 18px;
    padding: 0 5px;
    font-size: 0.72rem;
  }

  .lessons-list {
    padding: 10px;
  }
}

@media (max-width: 767px) {
  .lessons-wrap {
    min-height: calc(100dvh - 260px);
    padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  }
}

@media (max-width: 400px) {
  .days-row {
    gap: 6px;
  }

  .day-button {
    padding: 7px 2px;
  }
}
</style>
