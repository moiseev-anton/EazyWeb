<template>
  <div class="lesson-info">
    <div v-if="showSubject" class="subject" :title="subject">{{ subject }}</div>

    <div class="row2">
      <div class="left" v-if="leftText">
        <a class="group-or-teacher" href="#" :title="leftText" @click.prevent="openLeft">{{ leftText }}</a>
      </div>

      <div class="subgroup" :class="{ 'is-empty': !showSubgroup }" :aria-hidden="!showSubgroup">
        <span v-if="showSubgroup">{{ subgroup }} подгруппа</span>
      </div>

      <div class="classroom" v-if="classroom" :title="classroom">
        <span class="classroom-inner" aria-hidden="true">
          <svg class="icon pin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span class="classroom-text">{{ classroom }}</span>
        </span>
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

const emit = defineEmits(['open-entity'])
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

function openLeft() {
  // determine which relation to open based on prefer and availability
  // openLeft called
  const groupRel = props.lesson.relationships?.group?.data
  const teacherRel = props.lesson.relationships?.teacher?.data

  const emitEntity = (obj) => {
    emit('open-entity', obj)

    if (!['schedule', 'groups', 'teachers'].includes(route.name)) {
      router.push({ name: 'schedule', query: { openId: obj.id, openType: obj.type, openName: obj.name } }).catch(() => {})
    }
  }

  if (props.prefer === 'group' && groupRel) {
    const g = props.groupsMap && props.groupsMap[groupRel.id]
    emitEntity({ id: groupRel.id, type: 'group', name: g?.title || g?.name || '', endpoint: g?.endpoint || null })
    return
  }
  if (props.prefer === 'teacher' && teacherRel) {
    const t = props.teachersMap && props.teachersMap[teacherRel.id]
    emitEntity({ id: teacherRel.id, type: 'teacher', name: t?.shortName || t?.fullName || '', endpoint: t?.endpoint || null })
    return
  }

  // auto: prefer group then teacher
  if (groupRel) {
    const g = props.groupsMap && props.groupsMap[groupRel.id]
    emitEntity({ id: groupRel.id, type: 'group', name: g?.title || g?.name || '', endpoint: g?.endpoint || null })
    return
  }
  if (teacherRel) {
    const t = props.teachersMap && props.teachersMap[teacherRel.id]
    emitEntity({ id: teacherRel.id, type: 'teacher', name: t?.shortName || t?.fullName || '', endpoint: t?.endpoint || null })
    return
  }
}
</script>

<style scoped>
.lesson-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subject {
  font-weight: 700;
  font-size: 1.05rem;
  line-height: 1.3;
  color: #e2e8f0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.01em;
}

.row2 {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  width: 100%;
  gap: 10px;
  font-size: 0.9rem;
  color: #94a3b8;
}

.left {
  flex: 1 1 140px;
  min-width: 140px;
  max-width: 100%;
  flex-shrink: 1;
  order: 1;
}

.group-or-teacher {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #818cf8;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.18s ease;
}

.group-or-teacher:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

.subgroup {
  flex: 1 1 70px;
  min-width: 70px;
  max-width: 100%;
  flex-shrink: 2;
  order: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #94a3b8;
  text-align: center;
  font-weight: 500;
}

.subgroup.is-empty {
  visibility: hidden;
  pointer-events: none;
}

.classroom {
  flex: 0 0 80px;
  width: 80px;
  flex-shrink: 0;
  order: 3;
  color: #87cbc1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.classroom-inner {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  /* background: rgba(135, 203, 193, 0.14);
  border: 1px solid rgba(135, 203, 193, 0.35); */
  padding: 4px 6px;
  border-radius: 10px;
}

.icon.pin {
  width: 14px;
  height: 14px;
  color: #87cbc1;
  flex: 0 0 auto;
}

.classroom-text {
  font-size: 0.9rem;
  color: #87cbc1;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive */
@media (max-width: 420px) {
  .subgroup {
    flex-basis: 60px;
    min-width: 60px;
  }

  .classroom {
    flex-basis: 70px;
  }

  .classroom-text {
    font-size: 0.85rem;
  }
}
</style>
