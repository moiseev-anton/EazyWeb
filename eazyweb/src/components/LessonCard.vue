<template>
  <div class="lesson-card-root">
    <div class="period-line">
      <div class="number">{{ periodNumber }}</div>
      <div class="time">
        <span class="time-start">{{ startTime }}</span>
        <span class="time-sep">-</span>
        <span class="time-end">{{ endTime }}</span>
      </div>
    </div>

    <div class="content-col">
      <div v-if="hasSecondRow" class="second-row">
        <template v-if="single">
          <LessonInfo
            @open-entity="(e) => emit('open-entity', e)"
            :lesson="lessons[0]"
            :groupsMap="groupsMap"
            :teachersMap="teachersMap"
            :showSubject="showSubject"
            :prefer="prefer"
          />
        </template>
        <template v-else-if="sameSubject">
          <div class="subject-main" v-if="showSubject">{{ commonSubject }}</div>
        </template>
      </div>

      <div v-if="!single" class="multiple-blocks">
        <div v-for="l in lessons" :key="l.id" class="inner-block">
          <LessonInfo
            @open-entity="(e) => emit('open-entity', e)"
            :lesson="l"
            :groupsMap="groupsMap"
            :teachersMap="teachersMap"
            :showSubject="!sameSubject"
            :prefer="prefer"
          />
        </div>
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
  prefer: { type: String, default: 'auto' }
})

const single = computed(() => (props.lessons || []).length === 1)
const lessons = computed(() => props.lessons || [])

const periodNumber = computed(() => lessons.value[0]?.attributes?.number || '')
const startTime = computed(() => {
  const a = lessons.value[0]?.attributes
  return a?.startTime?.slice(0, 5) || ''
})
const endTime = computed(() => {
  const a = lessons.value[0]?.attributes
  return a?.endTime?.slice(0, 5) || ''
})

const subjects = computed(() => lessons.value.map(l => l.attributes?.subject || ''))
const commonSubject = computed(() => subjects.value[0] || '')
const sameSubject = computed(() => lessons.value.length > 1 && subjects.value.every(s => s === subjects.value[0]))
const hasSecondRow = computed(() => single.value || (sameSubject.value && props.showSubject))
</script>

<style scoped>
.lesson-card-root {
  --card-inline-pad: 6px;
  --font-ui: "Inter", "Segoe UI", "Roboto", "Noto Sans", sans-serif;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;
  padding: var(--card-inline-pad);
  border-radius: 14px;
  background: linear-gradient(180deg, #d8e9fd 0%, #cde7ff 100%);
  box-shadow: 0 8px 22px rgba(10, 40, 80, 0.06);
  border: 1px solid rgba(11, 111, 177, 0.08);
  font-family: var(--font-ui);
}

.period-line {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
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
  font-size: 1.1rem;
  font-family: var(--font-ui);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  box-shadow: inset 0 0 0 1px rgba(11, 111, 177, 0.1);
}

.time {
  color: #4f5965;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 98px;
  font-family: var(--font-ui);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
}

.time-sep {
  opacity: 0.7;
}

.content-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.second-row {
  padding-inline: 8px;
}

.subject-main {
  font-weight: 700;
}

.multiple-blocks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inner-block {
  background: #e0eef7;
  padding: 10px 8px;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(11, 111, 177, 0.08);
}

@container (min-width: 420px) {
  .lesson-card-root {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 8px;
    row-gap: 0;
    align-items: stretch;
  }

  .period-line {
    grid-column: 1;
    grid-row: 1;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    min-height: 100%;
  }

  .number {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
  }

  .time {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    gap: 2px;
    line-height: 1.15;
    font-size: 0.8rem;
  }

  .time-sep {
    display: none;
  }

  .content-col {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
  }

  .second-row {
    padding: 0;
  }
}

@container (min-width: 466px) {
  .lesson-card-root {
    grid-template-columns: 40px 40px minmax(0, 1fr);
    column-gap: 6px;
    align-items: start;
  }

  .period-line {
    grid-column: 1 / 3;
    grid-row: 1;
    height: 40px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    min-height: 0;
  }

  .number {
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
  }

  .time {
    flex: 0 0 40px;
    min-width: 0;
    width: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    line-height: 1.2;
    font-size: 0.8rem;
    text-align: center;
  }

  .time-sep {
    display: none;
  }

  .content-col {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
