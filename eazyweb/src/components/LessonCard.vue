<template>
  <div class="lesson-card-root">
    <div class="period-line">
      <div class="number">{{ periodNumber }}</div>
      <div class="time">{{ timeRange }}</div>
      <div class="main-area">
        <template v-if="single">
          <LessonInfo :lesson="lessons[0]" :groupsMap="groupsMap" :teachersMap="teachersMap" :showSubject="showSubject" :prefer="prefer" />
        </template>
        <template v-else-if="sameSubject">
          <div class="subject-main" v-if="showSubject">{{ commonSubject }}</div>
          <LessonInfo v-if="showSubject" class="info-collapsed" :lesson="lessons[0]" :groupsMap="groupsMap" :teachersMap="teachersMap" :showSubject="false" :prefer="prefer" />
        </template>
        <template v-else>
          <!-- no subject in main area when multiple different subjects -->
        </template>
      </div>
    </div>

    <!-- multiple lessons blocks -->
    <div v-if="!single" class="multiple-blocks">
      <div v-for="l in lessons" :key="l.id" class="inner-block">
        <LessonInfo :lesson="l" :groupsMap="groupsMap" :teachersMap="teachersMap" :showSubject="!sameSubject" :prefer="prefer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LessonInfo from './LessonInfo.vue'

const props = defineProps({
  lessons: { type: Array, required: true },
  groupsMap: { type: Object, default: () => ({}) },
  teachersMap: { type: Object, default: () => ({}) },
  showSubject: { type: Boolean, default: true },
  prefer: { type: String, default: 'auto' } // 'group'|'teacher'|'auto'
})

const single = computed(() => (props.lessons || []).length === 1)
const lessons = computed(() => props.lessons || [])

// period derived from first lesson
const periodNumber = computed(() => lessons.value[0]?.attributes?.number || '')
const timeRange = computed(() => {
  const a = lessons.value[0]?.attributes
  if (!a) return ''
  return `${a.startTime?.slice(0,5) || ''} - ${a.endTime?.slice(0,5) || ''}`
})

const subjects = computed(() => lessons.value.map(l => l.attributes?.subject || ''))
const commonSubject = computed(() => subjects.value[0] || '')
const sameSubject = computed(() => lessons.value.length > 1 && subjects.value.every(s => s === subjects.value[0]))
</script>

<style scoped>
.lesson-card-root { display: flex; flex-direction: column; gap: 8px }
.period-line { display: flex; gap: 12px; align-items: flex-start }
.number { width: 36px; height: 36px; border-radius: 8px; background: #eef9ff; color: #0b6fb1; display:flex; align-items:center; justify-content:center; font-weight:700 }
.time { color: #666; font-size: 0.9rem; min-width: 98px }
.main-area { flex: 1 1 0 }
.subject-main { font-weight:700; margin-bottom:6px }
.info-collapsed { opacity: 0.9 }

.multiple-blocks { display: flex; flex-direction: column; gap: 8px; margin-top: 6px }
.inner-block { background: #fbfcff; border: 1px solid #e9f1fb; padding: 8px; border-radius: 8px }

/* compact card look */
.lesson-card-root { padding: 8px; border-radius: 10px; background: white; border: 1px solid #eef5fa }
</style>
