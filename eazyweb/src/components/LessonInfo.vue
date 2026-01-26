<template>
  <div class="lesson-info">
    <div v-if="showSubject" class="subject" :title="subject">{{ subject }}</div>

    <div class="row2">
      <div class="left" v-if="leftText">
        <div class="group-or-teacher" :title="leftText">{{ leftText }}</div>
      </div>

      <div class="subgroup" v-if="showSubgroup">
        {{ subgroup }} подгруппа
      </div>

      <div class="classroom" v-if="classroom" :title="classroom">
        {{ classroom }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lesson: { type: Object, required: true },
  // maps for resolving relationships (optional)
  groupsMap: { type: Object, default: () => ({}) },
  teachersMap: { type: Object, default: () => ({}) },
  // show/hide subject and which to prefer: 'group'|'teacher'|'auto'
  prefer: { type: String, default: 'auto' },
  showSubject: { type: Boolean, default: true }
})

const subject = computed(() => props.lesson.attributes?.subject || '')
const classroom = computed(() => props.lesson.attributes?.classroom || '')
const subgroup = computed(() => props.lesson.attributes?.subgroup || '0')

const leftText = computed(() => {
  // If prefer is 'group' or 'teacher' or auto
  const groupRel = props.lesson.relationships?.group?.data
  const teacherRel = props.lesson.relationships?.teacher?.data
  let groupTitle = ''
  let teacherShort = ''

  if (groupRel && props.groupsMap && props.groupsMap[groupRel.id]) {
    groupTitle = props.groupsMap[groupRel.id].title || ''
  }
  if (teacherRel && props.teachersMap && props.teachersMap[teacherRel.id]) {
    teacherShort = props.teachersMap[teacherRel.id].shortName || ''
  }

  if (props.prefer === 'group') return groupTitle || teacherShort
  if (props.prefer === 'teacher') return teacherShort || groupTitle
  // auto: prefer group title if present, else teacher
  return groupTitle || teacherShort || ''
})

const showSubgroup = computed(() => {
  const sg = subgroup.value
  return sg !== undefined && sg !== null && String(sg) !== '0' && String(sg) !== ''
})
</script>

<style scoped>
.lesson-info { display: flex; flex-direction: column; gap: 6px }
.subject {
  font-weight: 600;
  font-size: 0.98rem;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.row2 { display: flex; gap: 8px; align-items: center; font-size: 0.86rem; color: #445 }
.left { flex: 1 1 0; min-width: 0 }
.group-or-teacher { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.subgroup { flex: 0 1 80px; min-width: 48px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #6b6b6b }
.classroom { flex: 0 0 auto; color: #6b6b6b; margin-left: 8px }

/* Shrink priority: subgroup should shrink before left element; left has lower shrink */
.left { flex-shrink: 1 }
.subgroup { flex-shrink: 2 }
</style>
