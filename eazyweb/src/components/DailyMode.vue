<template>
  <div class="daily-mode">
    <div class="days-row">
      <button
        v-for="(d, idx) in weekDates"
        :key="d.iso"
        class="day-button"
        :class="{ today: d.isToday, selected: d.iso === selectedIso }
        "
        @click="selectDay(d.iso)">
        <div class="day-number">{{ d.day }}</div>
        <div class="day-name">{{ d.name }}</div>
        <div class="lessons-count">{{ lessonsMap[d.iso]?.length || 0 }}</div>
      </button>
    </div>

    <div class="lessons-list">
      <!-- <h3 class="lessons-title">{{ selectedLabel }}</h3> -->
      <div v-if="props.loading" class="cards skeleton-list">
        <li class="skeleton-card" v-for="n in 3" :key="n">
          <div class="sk-line top"></div>
          <div class="sk-line mid"></div>
          <div class="sk-line bot"></div>
        </li>
      </div>
      <div v-else-if="props.loadError">
        <LoadError :detail="' занятий'" @retry="() => emit('retry')" />
      </div>
      <div v-else>
        <div v-if="(periodsMap[selectedIso] || []).length === 0" class="no-lessons">Нет занятий</div>
        <ul class="cards">
          <li v-for="group in periodsMap[selectedIso] || []" :key="group.key" class="lesson-card">
            <LessonCard :lessons="group.items" :groupsMap="groupsMap" :teachersMap="teachersMap" :showSubject="true" :prefer="entityType === 'group' ? 'teacher' : 'group'" @open-entity="(e) => emit('open-entity', e)" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LessonCard from './LessonCard.vue'
import LoadError from './LoadError.vue'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const props = defineProps({
  // monday date of the week — ISO string or Date
  weekStart: { type: [String, Date], required: true },
  // lessons array in json:api format
  lessons: { type: Array, default: () => [] },
  // show counterpart entity: 'group' or 'teacher'
  entityType: { type: String, default: 'group' },
  loading: { type: Boolean, default: false },
  loadError: { type: String, default: null }
})

const emit = defineEmits(['open-entity', 'retry'])

// helper: normalize weekStart to Date (monday)
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

// map lessons by date (attributes.date expected in yyyy-mm-dd)
// map lessons by date but grouped by period (date+number+startTime+endTime)
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
  // sort groups by number and startTime
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

// build maps of included resolved entities (if lessons have _resolved)
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

// selected day logic: if current week -> today else monday
const isCurrentWeek = computed(() => {
  const mondayIso = weekDates.value[0].iso
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  // current week if today is within weekDates
  return weekDates.value.some(d => d.iso === todayIso)
})

const selectedIso = ref(isCurrentWeek.value ? format(new Date(), 'yyyy-MM-dd') : weekDates.value[0].iso)

function selectDay(iso) {
  selectedIso.value = iso
}

// При смене недели выбираем сегодняшний день, если это текущая неделя,
// иначе — понедельник новой недели
watch(weekDates, (newVal) => {
  if (!newVal || newVal.length === 0) return
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const isCur = newVal.some(d => d.iso === todayIso)
  selectedIso.value = isCur ? todayIso : newVal[0].iso
})

const selectedLabel = computed(() => {
  const found = weekDates.value.find(d => d.iso === selectedIso.value)
  return found ? `${found.name}, ${found.day}` : selectedIso.value
})
</script>

<style scoped>
.daily-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.days-row {
  display: flex;
  gap: 4px;
  align-items: center;
  min-height: 52px; /* компактная высота строки дней */
}
.day-button {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 4px;
  border-radius: 10px;
  border: 1px solid #eef3f8;
  background: #fbfdff;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.08s;
}
.day-button .day-number {
  font-weight: 600;
  font-size: 1rem;
}
.day-button .day-name {
  font-size: 0.8rem;
  color: #666;
}
.day-button .lessons-count {
  margin-top: 4px;
  background: #e9eef6;
  color: #0b6fb1;
  padding: 3px 8px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
}
.day-button.today {
  box-shadow: inset 0 0 0 2px rgba(39,167,231,0.12);
  border-color: rgba(39,167,231,0.28);
}
.day-button.selected {
  background: #27a7e758;
  box-shadow: inset 0 0 0 3px rgba(39, 167, 231, 0.133);
  transform: translateY(-1px);
}

.lessons-list {
  background: #ffffff;
  border-radius: 12px;
  padding: 0px;
  /* box-shadow: 0 6px 18px rgba(0,0,0,0.04); */
}
.cards { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px }
.lesson-card { padding: 0; border-radius: 0; background: transparent; border: none }
.time { font-size: 0.85rem; color: #345; }
.subject { font-weight: 600; margin-top: 6px }
.meta { font-size: 0.85rem; color: #666; margin-top: 4px }
.no-lessons { color: #888; margin: 30px 0px; font-weight: 500; text-align: center }

/* skeleton for cards (single column, 3 items) */
.skeleton-list { list-style: none; padding: 12px; margin: 0; display: flex; flex-direction: column; gap: 8px }
.skeleton-card { padding: 12px; border-radius: 10px; background: #fff; box-shadow: 0 6px 18px rgba(20,40,80,0.04); min-height: 68px; display:flex; flex-direction:column; gap:8px }
.sk-line { border-radius: 6px; background: linear-gradient(90deg,#eef3f8 25%, #f6f9fc 50%, #eef3f8 75%); background-size: 200% 100%; animation: shimmer 1.1s linear infinite }
.sk-line.top { height: 14px; width: 85% }
.sk-line.mid { height: 10px; width: 45% }
.sk-line.bot { height: 12px; width: 65% }

@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

.lesson-relation { margin-top: 8px }
.relation-btn { background: transparent; border: none; color: #0b6fb1; font-weight: 600; cursor: pointer; padding: 4px 0 }
.relation-btn:hover { text-decoration: underline }
</style>
