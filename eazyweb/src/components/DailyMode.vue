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
      <h3 class="lessons-title">{{ selectedLabel }}</h3>
      <div v-if="(lessonsMap[selectedIso] || []).length === 0" class="no-lessons">Нет уроков</div>
      <ul class="cards">
        <li v-for="lesson in lessonsMap[selectedIso] || []" :key="lesson.id" class="lesson-card">
          <div class="time">{{ lesson.attributes.startTime }} — {{ lesson.attributes.endTime }}</div>
          <div class="subject">{{ lesson.attributes.subject }}</div>
          <div class="meta">№{{ lesson.attributes.number }} · {{ lesson.attributes.classroom }}</div>

          <div class="lesson-relation">
            <button
              v-if="entityType === 'group' && lesson._resolved?.teacher"
              class="relation-btn"
              @click="() => emit('open-entity', { id: lesson._resolved.teacher.id, type: 'teacher', name: lesson._resolved.teacher.shortName || lesson._resolved.teacher.fullName, endpoint: lesson._resolved.teacher.endpoint })"
            >
              {{ lesson._resolved.teacher.shortName || lesson._resolved.teacher.fullName }}
            </button>

            <button
              v-else-if="entityType === 'teacher' && lesson._resolved?.group"
              class="relation-btn"
              @click="() => emit('open-entity', { id: lesson._resolved.group.id, type: 'group', name: lesson._resolved.group.title, endpoint: lesson._resolved.group.endpoint })"
            >
              {{ lesson._resolved.group.title }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const props = defineProps({
  // monday date of the week — ISO string or Date
  weekStart: { type: [String, Date], required: true },
  // lessons array in json:api format
  lessons: { type: Array, default: () => [] },
  // show counterpart entity: 'group' or 'teacher'
  entityType: { type: String, default: 'group' }
})

const emit = defineEmits(['open-entity'])

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
const lessonsMap = computed(() => {
  const m = {}
  for (const l of props.lessons || []) {
    const date = l.attributes?.date
    if (!date) continue
    if (!m[date]) m[date] = []
    m[date].push(l)
  }
  // sort lessons by number
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
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.04);
}
.cards { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px }
.lesson-card {
  padding: 10px;
  border-radius: 10px;
  background: #f8fbff;
  border: 1px solid #e6f0fa;
}
.time { font-size: 0.85rem; color: #345; }
.subject { font-weight: 600; margin-top: 6px }
.meta { font-size: 0.85rem; color: #666; margin-top: 4px }
.no-lessons { color: #888 }

.lesson-relation { margin-top: 8px }
.relation-btn { background: transparent; border: none; color: #0b6fb1; font-weight: 600; cursor: pointer; padding: 4px 0 }
.relation-btn:hover { text-decoration: underline }
</style>
