<template>
  <div class="lesson-info">
    <div v-if="showSubject" class="subject" :title="subject">{{ subject }}</div>

    <div class="row2">
      <div class="left-stack" v-if="showEntityStack">
        <div class="entity-line" v-if="showGroupLine">
          <a
            v-if="groupEntity"
            class="group-or-teacher"
            href="#"
            :title="groupEntity.name"
            @click.prevent="openEntity(groupEntity)"
          >
            {{ groupEntity.name }}
          </a>
          <span v-else class="group-or-teacher is-static" :title="groupFallbackText">{{ groupFallbackText }}</span>
        </div>

        <div class="entity-line" v-if="showTeacherLine">
          <a
            v-if="teacherEntity"
            class="group-or-teacher"
            href="#"
            :title="teacherEntity.name"
            @click.prevent="openEntity(teacherEntity)"
          >
            {{ teacherEntity.name }}
          </a>
          <span v-else class="group-or-teacher is-static" :title="teacherFallbackText">{{ teacherFallbackText }}</span>
        </div>
      </div>

      <div class="subgroup" :class="{ 'is-empty': !showSubgroup }" :aria-hidden="!showSubgroup">
        <span v-if="showSubgroup">{{ subgroup }} подгруппа</span>
      </div>

      <div class="classroom" :title="classroomTitle">
        <span class="classroom-inner" aria-hidden="true">
          <svg class="icon pin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span class="classroom-text">{{ classroomDisplay }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  lesson: { type: Object, required: true },
  groupsMap: { type: Object, default: () => ({}) },
  teachersMap: { type: Object, default: () => ({}) },
  prefer: { type: String, default: 'auto' },
  showSubject: { type: Boolean, default: true }
})

const emit = defineEmits(['open-entity'])
const router = useRouter()
const route = useRoute()

const subject = computed(() => props.lesson.attributes?.subject || '')
const classroom = computed(() => {
  const value = props.lesson.attributes?.classroom
  if (value === null || value === undefined) return ''
  return String(value).trim()
})
const classroomDisplay = computed(() => classroom.value || '---')
const classroomTitle = computed(() => classroom.value || 'Кабинет не указан')
const subgroup = computed(() => props.lesson.attributes?.subgroup || '0')

const relationData = computed(() => {
  const groupRel = props.lesson.relationships?.group?.data
  const teacherRel = props.lesson.relationships?.teacher?.data
  const group = groupRel && props.groupsMap && props.groupsMap[groupRel.id]
    ? props.groupsMap[groupRel.id]
    : null
  const teacher = teacherRel && props.teachersMap && props.teachersMap[teacherRel.id]
    ? props.teachersMap[teacherRel.id]
    : null

  return {
    groupRel,
    teacherRel,
    groupTitle: group?.title || '',
    teacherShort: teacher?.shortName || teacher?.fullName || '',
    group,
    teacher
  }
})

const groupEntity = computed(() => {
  const { groupRel, groupTitle, group } = relationData.value
  if (!groupRel || !groupTitle) return null
  return { id: groupRel.id, type: 'group', name: groupTitle, endpoint: group?.endpoint || null }
})

const teacherEntity = computed(() => {
  const { teacherRel, teacherShort, teacher } = relationData.value
  if (!teacherRel || !teacherShort) return null
  return { id: teacherRel.id, type: 'teacher', name: teacherShort, endpoint: teacher?.endpoint || null }
})

const showGroupLine = computed(() => ['group', 'both', 'auto'].includes(props.prefer))
const showTeacherLine = computed(() => ['teacher', 'both'].includes(props.prefer))

const groupFallbackText = computed(() => 'не указано')
const teacherFallbackText = computed(() => 'не указано')

const showEntityStack = computed(() => {
  if (showGroupLine.value && (groupEntity.value || props.prefer === 'group' || props.prefer === 'both')) return true
  if (showTeacherLine.value && (teacherEntity.value || props.prefer === 'teacher' || props.prefer === 'both')) return true
  return false
})

const showSubgroup = computed(() => {
  const sg = subgroup.value
  return sg !== undefined && sg !== null && String(sg) !== '0' && String(sg) !== ''
})

function openEntity(obj) {
  if (!obj) return

  emit('open-entity', obj)

  if (!['schedule', 'groups', 'teachers', 'classrooms'].includes(route.name)) {
    router.push({ name: 'schedule', query: { openId: obj.id, openType: obj.type, openName: obj.name } }).catch(() => {})
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
  color: var(--color-text-primary);
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
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.left-stack {
  flex: 1 1 140px;
  min-width: 140px;
  max-width: 100%;
  flex-shrink: 1;
  order: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-height: 24px;
}

.entity-line {
  min-width: 0;
}

.group-or-teacher {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-accent);
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
  color: var(--color-accent-strong);
  text-decoration: underline;
}

.group-or-teacher.is-static {
  color: var(--color-text-secondary);
  cursor: default;
  pointer-events: none;
  text-decoration: none;
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
  color: var(--color-text-secondary);
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
  color: var(--color-accent-soft);
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
  padding: 4px 0;
  border-radius: 10px;
}

.icon.pin {
  width: 14px;
  height: 14px;
  color: var(--color-accent-soft);
  flex: 0 0 auto;
}

.classroom-text {
  font-size: 0.9rem;
  color: var(--color-accent-soft);
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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
