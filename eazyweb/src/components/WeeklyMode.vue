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
      <LoadError :detail="' занятий'" @retry="$emit('retry')" />
    </div>
    <div v-else>
      <div v-for="(d, idx) in weekDates" :key="d.iso" class="day-accordion">
      <button class="accordion-header" :class="{ disabled: disabled[idx] }" @click="toggle(idx)" :disabled="disabled[idx]">
        <div class="left">
          <div class="header-title">
            <span class="short-date">{{ d.shortDate }}</span>
            <span class="sep">‧</span>
            <span v-if="d.isToday" class="marker">Сегодня</span>
            <span v-else-if="d.isTomorrow" class="marker">Завтра</span>
            <span v-if="d.isToday || d.isTomorrow" class="sep">‧</span>
            <span class="weekday-full">{{ d.weekdayFull }}</span>
          </div>
        </div>
        <div class="right">
          <div class="count">{{ lessonsMap[d.iso]?.length || 0 }}</div>
          <div class="chev" :class="{ disabled: disabled[idx] }">{{ expanded[idx] ? '▾' : '▸' }}</div>
        </div>
      </button>

      <div v-show="expanded[idx]" class="accordion-body">
        <ul class="cards">
          <li v-for="group in periodsMap[d.iso] || []" :key="group.key" class="lesson-card">
            <LessonCard :lessons="group.items" :groupsMap="groupsMap" :teachersMap="teachersMap" :showSubject="true" :prefer="entityType === 'group' ? 'teacher' : 'group'" @open-entity="(e) => emit('open-entity', e)" />
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
import { format, addDays, startOfWeek, isSameDay, parseISO, isBefore } from 'date-fns'
import { ru } from 'date-fns/locale'

const props = defineProps({
  weekStart: { type: [String, Date], required: true },
  lessons: { type: Array, default: () => [] },
  entityType: { type: String, default: 'group' },
  loading: { type: Boolean, default: false },
  loadError: { type: String, default: null }
})

const emit = defineEmits(['open-entity','retry'])

const weekStartDate = computed(() => {
  const v = props.weekStart
  return typeof v === 'string' ? parseISO(v) : new Date(v)
})

function buildWeekDates(monday) {
  const arr = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i)
    const iso = format(d, 'yyyy-MM-dd')
    // short date like '18 дек' (no trailing dot)
    let shortDate = format(d, 'd MMM', { locale: ru }).replace('.', '')
    // full weekday like 'Четверг'
    let weekdayFull = format(d, 'EEEE', { locale: ru })
    weekdayFull = weekdayFull.charAt(0).toUpperCase() + weekdayFull.slice(1)
    const isToday = isSameDay(d, new Date())
    const isTomorrow = isSameDay(d, addDays(new Date(), 1))

    arr.push({ date: d, iso, day: format(d, 'd'), shortDate, weekdayFull, isToday, isTomorrow })
  }
  return arr
}

const weekDates = computed(() => buildWeekDates(startOfWeek(weekStartDate.value, { weekStartsOn: 1 })))

// group by period similar to DailyMode
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
    m[k].sort((a,b) => {
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

// raw lessons map (for counts and compatibility)
const lessonsMap = computed(() => {
  const m = {}
  for (const l of props.lessons || []) {
    const date = l.attributes?.date
    if (!date) continue
    if (!m[date]) m[date] = []
    m[date].push(l)
  }
  for (const k of Object.keys(m)) m[k].sort((a,b) => a.attributes.number - b.attributes.number)
  return m
})

// determine expanded states and disabled state per day
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

    // if no lessons -> always collapsed and disabled
    if (!hasLessons) {
      expanded.value.push(false)
      disabled.value.push(true)
      return
    }

    if (!curWeek) {
      // non-current week -> expand all days that have lessons
      expanded.value.push(true)
      disabled.value.push(false)
      return
    }

    // current week: collapse days before today, expand today and after
    expanded.value.push(d.iso >= todayIso)
    disabled.value.push(false)
  })
}

// watch for changes in weekDates or lessonsMap and recalc
watch([weekDates, () => props.lessons], () => {
  updateExpanded()
}, { immediate: true })

function toggle(i) {
  if (disabled.value[i]) return
  expanded.value[i] = !expanded.value[i]
}
</script>

<style scoped>
.weekly-mode { display: flex; flex-direction: column; gap: 12px }
.day-accordion { background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #eef3f8 }
.accordion-header { width: 100%; display:flex; justify-content:space-between; align-items:center; padding:6px 12px; background: transparent; border: none; cursor: pointer }
.accordion-header.disabled { opacity: 0.6; cursor: default }
.accordion-header .left { display:flex; gap:8px; align-items:center }
.header-title { display:flex; gap:4px; align-items:center; font-weight:600 }
.short-date { color:#333 }
.weekday-full { color:#666; font-weight:500 }
.marker { color:#27A7E7; font-weight:600 }
.sep { color: #999 }
.accordion-header .right { display:flex; gap:8px; align-items:center }
.count { background:#e9eef6; color:#0b6fb1; padding:4px 8px; border-radius:8px; font-weight:600; min-width:36px; text-align:center }
.chev { width:18px; text-align:center; color:#666; transition: opacity 0.15s }
.chev.disabled { opacity: 0.06 }
.accordion-body { padding:10px 12px; border-top:1px solid #f3f6f9 }
.cards { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px }
.lesson-card { padding: 0; border-radius: 0; background: transparent; border: none }
.time { font-size:0.85rem; color:#345 }
.subject { font-weight:600; margin-top:6px }
.meta { font-size:0.85rem; color:#666; margin-top:4px }
.no-lessons { color:#888; padding:8px 0 }

/* Weekly skeleton (single column) */
.weekly-skeleton { display:flex; flex-direction:column; gap:10px }
.skeleton-day { padding: 12px; border-radius:10px; background: #fff; box-shadow: 0 6px 18px rgba(20,40,80,0.04); min-height:80px; display:flex; flex-direction:column; gap:8px }
.skeleton-day .sk-line { border-radius:6px; background: linear-gradient(90deg,#eef3f8 25%, #f6f9fc 50%, #eef3f8 75%); background-size:200% 100%; animation: shimmer 1.1s linear infinite }
.skeleton-day .sk-line.top { height: 14px; width: 90% }
.skeleton-day .sk-line.mid { height: 10px; width: 40% }
.skeleton-day .sk-line.bot { height: 12px; width: 65% }

@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

.lesson-relation { margin-top: 8px }
.relation-btn { background: transparent; border: none; color: #0b6fb1; font-weight: 600; cursor: pointer; padding: 4px 0 }
.relation-btn:hover { text-decoration: underline }
</style>
