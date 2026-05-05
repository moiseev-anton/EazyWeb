<template>
  <div class="weekly-mode">
    <div v-if="props.loading" class="weekly-skeleton">
      <div class="skeleton-day" v-for="n in 5" :key="n">
        <div class="sk-line top"></div>
        <div class="sk-line mid"></div>
        <div class="sk-line bot"></div>
      </div>
    </div>
    <div v-else-if="props.loadError">
      <LoadError :detail="'занятий'" @retry="() => emit('retry')" />
    </div>
    <div v-else class="days-stack">
      <div v-for="(d, idx) in weekDates" :key="d.iso" class="day-accordion">
        <button class="accordion-header" :class="{ disabled: disabled[idx] }" @click="toggle(idx)" :disabled="disabled[idx]">
          <div class="left">
            <div class="header-title">
              <span class="short-date">{{ d.shortDate }}</span>
              <span class="sep">|</span>
              <span v-if="d.isToday" class="marker">Сегодня</span>
              <span v-else-if="d.isTomorrow" class="marker">Завтра</span>
              <span v-if="d.isToday || d.isTomorrow" class="sep">|</span>
              <span class="weekday-full">{{ d.weekdayFull }}</span>
            </div>
          </div>
          <div class="right">
            <div class="count">{{ lessonsMap[d.iso] || 0 }}</div>
            <div class="chev" :class="{ expanded: expanded[idx], disabled: disabled[idx] }">
              <ChevronDownIcon class="chev-icon" />
            </div>
          </div>
        </button>

        <div v-show="expanded[idx]" class="accordion-body">
          <ul class="cards">
            <li v-for="group in periodsMap[d.iso] || []" :key="group.key" class="lesson-card">
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
          <div v-if="!(periodsMap[d.iso] && periodsMap[d.iso].length)" class="no-lessons">Нет занятий</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import LessonCard from './LessonCard.vue'
import LoadError from './LoadError.vue'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

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

function buildWeekDates(monday) {
  const arr = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i)
    const iso = format(d, 'yyyy-MM-dd')
    let shortDate = format(d, 'd MMM', { locale: ru }).replace('.', '')
    let weekdayFull = format(d, 'EEEE', { locale: ru })
    weekdayFull = weekdayFull.charAt(0).toUpperCase() + weekdayFull.slice(1)
    const isToday = isSameDay(d, new Date())
    const isTomorrow = isSameDay(d, addDays(new Date(), 1))
    arr.push({ date: d, iso, day: format(d, 'd'), shortDate, weekdayFull, isToday, isTomorrow })
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

const expanded = ref([])
const disabled = ref([])

const isCurrentWeek = computed(() => weekDates.value.some(d => d.isToday))

function updateExpanded() {
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const curWeek = isCurrentWeek.value

  expanded.value = []
  disabled.value = []

  weekDates.value.forEach(d => {
    const lessonsCount = lessonsMap.value[d.iso] || 0
    const hasLessons = lessonsCount > 0

    if (!hasLessons) {
      expanded.value.push(false)
      disabled.value.push(true)
      return
    }

    if (!curWeek) {
      expanded.value.push(true)
      disabled.value.push(false)
      return
    }

    expanded.value.push(d.iso >= todayIso)
    disabled.value.push(false)
  })
}

watch([weekDates, () => props.lessons], () => {
  updateExpanded()
}, { immediate: true })

function toggle(i) {
  if (disabled.value[i]) return
  expanded.value[i] = !expanded.value[i]
}
</script>

<style scoped>
.weekly-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== АККОРДЕОНЫ ДНЕЙ ===== */
.days-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.day-accordion {
  border-radius: 18px;
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
}

.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: rgba(15, 23, 42, 0.35);
  border: none;
  cursor: pointer;
  transition: all 0.22s ease;
}

.accordion-header:hover:not(.disabled) {
  background: rgba(51, 65, 85, 0.42);
}

.accordion-header.disabled {
  opacity: 0.5;
  cursor: default;
  background: rgba(15, 23, 42, 0.25);
}

.accordion-header .left {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.header-title {
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: 600;
  min-width: 0;
  flex-wrap: wrap;
  font-size: 0.98rem;
}

.short-date {
  color: #e2e8f0;
  font-weight: 700;
}

.sep {
  color: #94a3b8;
  margin: 0 4px;
}

.marker {
  color: #87cbc1;           /* мягкий мятный для Сегодня/Завтра */
  font-weight: 700;
}

.weekday-full {
  color: #cbd5e1;
  font-weight: 500;
}

.accordion-header .right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.count {
  min-width: 32px;
  height: 24px;
  border-radius: 999px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.28);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: #cbd5e1;
  font-weight: 700;
  font-size: 0.85rem;
}

.chev {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  transition: transform 0.22s ease, opacity 0.18s ease;
}

.chev.expanded {
  transform: rotate(180deg);
  color: #818cf8;
}

.chev.disabled {
  opacity: 0.3;
}

.chev-icon {
  width: 20px;
  height: 20px;
}

/* ===== ТЕЛО АККОРДЕОНА ===== */
.accordion-body {
  padding: 12px 18px 16px;
  background: rgba(15, 23, 42, 0.2);
  border-top: 1px solid rgba(148, 163, 184, 0.12);
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
  color: #94a3b8;
  padding: 16px 0 8px;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
}

/* ===== SKELETON ===== */
.weekly-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-day {
  padding: 16px;
  border-radius: 14px;
  background: rgba(51, 65, 85, 0.32);
  border: 1px solid rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(10px);
  min-height: 90px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-day .sk-line {
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(71, 85, 105, 0.4) 25%,
    rgba(100, 116, 139, 0.6) 50%,
    rgba(71, 85, 105, 0.4) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.skeleton-day .sk-line.top {
  height: 16px;
  width: 90%;
}

.skeleton-day .sk-line.mid {
  height: 12px;
  width: 45%;
}

.skeleton-day .sk-line.bot {
  height: 14px;
  width: 70%;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Responsive */
@media (max-width: 640px) {
  .accordion-header {
    padding: 12px 16px;
  }

  .header-title {
    font-size: 0.95rem;
    gap: 4px;
  }

  .count {
    min-width: 28px;
    height: 22px;
    font-size: 0.8rem;
  }

  .accordion-body {
    padding: 10px 14px 14px;
  }
}

@media (max-width: 400px) {
  .short-date,
  .marker,
  .weekday-full {
    font-size: 0.9rem;
  }

  .sep {
    margin: 0 3px;
  }
}
</style>
