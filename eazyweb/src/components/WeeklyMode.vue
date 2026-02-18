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
            <div class="count">{{ lessonsMap[d.iso]?.length || 0 }}</div>
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
                :prefer="entityType === 'group' ? 'teacher' : 'group'"
                @open-entity="(e) => emit('open-entity', e)"
              />
            </li>
          </ul>
          <div v-if="!(lessonsMap[d.iso] && lessonsMap[d.iso].length)" class="no-lessons">Нет занятий</div>
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

const periodsMap = computed(() => {
  const m = {}
  for (const l of props.lessons || []) {
    const date = l.attributes?.date
    if (!date) continue
    const key = `${date}|${l.attributes?.number || ''}|${l.attributes?.startTime || ''}|${l.attributes?.endTime || ''}`
    if (!m[date]) m[date] = []
    let grp = m[date].find(g => g.key === key)
    if (!grp) {
      grp = { key, items: [] }
      m[date].push(grp)
    }
    grp.items.push(l)
  }
  for (const k of Object.keys(m)) {
    m[k].sort((a, b) => {
      const na = a.items[0].attributes.number || 0
      const nb = b.items[0].attributes.number || 0
      if (na !== nb) return na - nb
      return (a.items[0].attributes.startTime || '').localeCompare(b.items[0].attributes.startTime || '')
    })
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
    if (!m[date]) m[date] = []
    m[date].push(l)
  }
  for (const k of Object.keys(m)) m[k].sort((a, b) => a.attributes.number - b.attributes.number)
  return m
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
    const lessonsCount = (lessonsMap.value[d.iso] || []).length
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
  gap: 10px;
}

.days-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-accordion {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dbe7f2;
}

.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #ffffff;
  border: none;
  cursor: pointer;
  transition: background 0.16s ease;
}

.accordion-header:hover:not(.disabled) {
  background: #f2f9ff;
}

.accordion-header.disabled {
  opacity: 0.6;
  cursor: default;
}

.accordion-header .left {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.header-title {
  display: flex;
  gap: 4px;
  align-items: center;
  font-weight: 600;
  min-width: 0;
  flex-wrap: wrap;
}

.short-date {
  color: #0f172a;
}

.weekday-full {
  color: #64748b;
  font-weight: 500;
}

.marker {
  color: #0284c7;
  font-weight: 600;
}

.sep {
  color: #94a3b8;
}

.accordion-header .right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.count {
  background: #eaf3fb;
  color: #075985;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 700;
  min-width: 30px;
  text-align: center;
  font-size: 0.82rem;
}

.chev {
  width: 18px;
  height: 18px;
  color: #64748b;
  transition: transform 0.18s ease, opacity 0.16s ease;
}

.chev.expanded {
  transform: rotate(180deg);
}

.chev.disabled {
  opacity: 0.15;
}

.chev-icon {
  width: 18px;
  height: 18px;
}

.accordion-body {
  padding: 10px;
  border-top: 1px solid #edf3f9;
}

.cards {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lesson-card {
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  container-type: inline-size;
}

.no-lessons {
  color: #7a889c;
  padding: 10px 0 4px;
  text-align: center;
  font-weight: 600;
}

.weekly-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-day {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e6edf5;
  background: #fff;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-day .sk-line {
  border-radius: 6px;
  background: #e7edf4;
  background-size: 200% 100%;
  animation: shimmer 1.1s linear infinite;
}

.skeleton-day .sk-line.top {
  height: 14px;
  width: 90%;
}

.skeleton-day .sk-line.mid {
  height: 10px;
  width: 40%;
}

.skeleton-day .sk-line.bot {
  height: 12px;
  width: 65%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
