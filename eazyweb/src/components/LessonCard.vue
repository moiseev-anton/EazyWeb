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
  --card-pad: 10px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: auto 1fr;           /* слева period-line, справа content */
  column-gap: 12px;
  align-items: start;                        /* выравнивание по верху */
  width: 100%;
  min-width: 0;
  padding: var(--card-pad);
  border-radius: 16px;
background: linear-gradient(135deg, 
    rgba(129, 140, 248, 0.10) 0%, 
    rgba(135, 203, 193, 0.06) 100%
  ), rgba(30, 41, 59, 0.36);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(129, 140, 248, 0.28);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(129, 140, 248, 0.18),
    inset 0 0 16px rgba(129, 140, 248, 0.08);
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);       /* hover без translateY */
}

/* .lesson-card-root:hover {
  transform: translateY(-5px) scale(1.015);
  box-shadow: 
    0 20px 48px rgba(0, 0, 0, 0.45),
    0 0 20px 6px rgba(129, 140, 248, 0.28);
} */

.period-line {
  display: flex;
  flex-direction: column;                    /* по умолчанию вертикально */
  align-items: center;
  gap: 6px;
  justify-content: flex-start;               /* прижимаем к верху */
}

.number {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(129, 140, 248, 0.18);
  border: 1px solid rgba(129, 140, 248, 0.35);
  color: #818cf8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.18rem;
  font-variant-numeric: tabular-nums;
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.12);
  flex-shrink: 0;
}

.time {
  color: #87cbc1;
  font-size: 0.92rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 40px;
}

.time-start,
.time-end {
  color: #87cbc1;
}

.time-sep {
  opacity: 0.5;
  font-weight: 400;
}

.content-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.subject-main {
  font-weight: 700;
  font-size: 1.05rem;
  color: #e2e8f0;
  line-height: 1.3;
}

.multiple-blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inner-block {
  background: rgba(51, 65, 85, 0.28);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  padding: 10px 12px;
}

/* ── ≥ 420px ── number и time вертикально слева, content справа ── */
@container (min-width: 420px) {
  .period-line {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
  }

  .time {
    flex-direction: column;
    gap: 2px;
    font-size: 0.88rem;
    line-height: 1.15;
    text-align: center;
  }

  .time-sep {
    display: none;
  }
}

/* ── ≥ 480px ── number слева, time справа от него (горизонтально), на одной высоте с центром number ── */
@container (min-width: 480px) {
  .lesson-card-root {
    grid-template-columns: 44px auto 1fr;    /* number | time | content */
    column-gap: 12px;
    align-items: start;                      /* всё по верху */
  }

  .period-line {
    grid-column: 1 / 3;                      /* занимает два первых столбца */
    flex-direction: row;
    align-items: center;                     /* центрируем по вертикали относительно number */
    justify-content: flex-start;
    gap: 12px;
    height: 44px;                            /* фиксированная высота = высоте number */
  }

  .number {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  .time {
    flex: 0 0 auto;
    min-width: 40px;
    justify-content: center;
    font-size: 0.9rem;
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

/* ── < 420px ── всё вертикально ── */
@container (max-width: 419px) {
  .lesson-card-root {
    display: flex;
    flex-direction: column;
  }

  .period-line {
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 12px;
    min-height: auto;
  }

  .time {
    flex-direction: row;
    gap: 6px;
    font-size: 0.92rem;
  }

  .time-sep {
    display: inline;
  }
}
</style>
