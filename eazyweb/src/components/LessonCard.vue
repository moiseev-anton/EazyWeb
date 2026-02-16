<template>
  <div class="lesson-card-root">
    <div class="period-line">
      <div class="number">{{ periodNumber }}</div>
      <div class="time">{{ timeRange }}</div>
    </div>

    <div v-if="hasSecondRow" class="second-row">
      <template v-if="single">
        <LessonInfo @open-entity="(e) => emit('open-entity', e)" :lesson="lessons[0]" :groupsMap="groupsMap" :teachersMap="teachersMap" :showSubject="showSubject" :prefer="prefer" />
      </template>
      <template v-else-if="sameSubject">
        <div class="subject-main" v-if="showSubject">{{ commonSubject }}</div>
      </template>
    </div>

    <!-- multiple lessons blocks -->
    <div v-if="!single" class="multiple-blocks">
      <div v-for="l in lessons" :key="l.id" class="inner-block">
        <LessonInfo @open-entity="(e) => emit('open-entity', e)" :lesson="l" :groupsMap="groupsMap" :teachersMap="teachersMap" :showSubject="!sameSubject" :prefer="prefer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LessonInfo from './LessonInfo.vue'
const emit = defineEmits(['open-entity'])

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
const hasSecondRow = computed(() => single.value || (sameSubject.value && props.showSubject))
</script>

<style scoped>
.lesson-card-root {
  --card-max-width: 420px;
  --card-inline-pad: 6px;
  --content-inline-pad: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: min(var(--card-max-width), 100%);
  min-width: 0;
  padding: var(--card-inline-pad);
  border-radius: 14px;
  background: linear-gradient(180deg, #d8e9fd 0%, #cde7ff 100%);
  box-shadow: 0 8px 22px rgba(10, 40, 80, 0.06);
  border: 1px solid rgba(11, 111, 177, 0.08);
}

.period-line {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  /* padding-inline: var(--content-inline-pad); */
}

.number {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e7f4ff;
  color: #0b6fb1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(11, 111, 177, 0.1);
}

.time {
  color: #4f5965;
  font-size: 1rem;
  font-weight: 600;
  min-width: 98px;
}

.second-row {
  padding-inline: 8px;
  /* padding-inline: var(--content-inline-pad); */
}

.main-area { flex: 1 1 0 }
.subject-main { font-weight: 700 }
.info-collapsed { opacity: 0.9 }

.multiple-blocks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inner-block {
  background: #e0eef7 ;
  padding: 10px 8px;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(11, 111, 177, 0.08);
}
</style>
