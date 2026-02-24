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
        <div v-if="(periodsMap[selectedIso] || []).length === 0" class="no-lessons">Нет занятий</div>
        <ul class="cards">
          <li v-for="group in periodsMap[selectedIso] || []" :key="group.key" class="lesson-card">
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
    const number = l.attributes?.number || ''
    const startTime = l.attributes?.startTime || ''
    const endTime = l.attributes?.endTime || ''
    const periodKey = `${number}|${startTime}|${endTime}`
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

function selectDay(iso) {
  selectedIso.value = iso
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

/* ===== ДНИ НЕДЕЛИ ===== */
.days-wrap {
  border-radius: 18px;
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  padding: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
}

.days-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.day-button {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(51, 65, 85, 0.28);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.day-button:hover {
  background: rgba(51, 65, 85, 0.42);
  border-color: rgba(148, 163, 184, 0.32);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.day-button.today {
  border-color: rgba(135, 203, 193, 0.45); /* #87cbc1 */
  background: rgba(135, 203, 193, 0.18);
}

.day-button.selected {
  border-color: rgba(129, 140, 248, 0.55); /* #818cf8 */
  background: rgba(129, 140, 248, 0.22);
  transform: translateY(-1px);
}

.day-name {
  font-size: 0.82rem;
  color: #94a3b8;
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
  color: #e2e8f0;
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
  background: rgba(148, 163, 184, 0.28);
  backdrop-filter: blur(6px);
  color: #cbd5e1;
  font-weight: 700;
  font-size: 0.78rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
}

/* ===== СПИСОК ЗАНЯТИЙ ===== */
.lessons-list {
  border-radius: 18px;
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  padding: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
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
  background: rgba(51, 65, 85, 0.32);
  border: 1px solid rgba(148, 163, 184, 0.12);
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
    rgba(71, 85, 105, 0.4) 25%,
    rgba(100, 116, 139, 0.6) 50%,
    rgba(71, 85, 105, 0.4) 75%
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

@media (max-width: 400px) {
  .days-row {
    gap: 6px;
  }

  .day-button {
    padding: 7px 2px;
  }
}
</style>
