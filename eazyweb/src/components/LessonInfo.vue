<template>
  <div class="lesson-info">
    <div v-if="showSubject" class="subject" :title="subject">{{ subject }}</div>

    <div class="row2">
      <div class="left" v-if="leftText">
        <a class="group-or-teacher" href="#" :title="leftText" @click.prevent="openLeft">{{ leftText }}</a>
      </div>

      <div class="subgroup" :class="{ 'is-empty': !showSubgroup }" :aria-hidden="!showSubgroup">
        <span v-if="showSubgroup">{{ subgroup }} subgroup</span>
      </div>

      <div class="classroom" v-if="classroom" :title="classroom">
        <span class="classroom-inner" aria-hidden="true">
          <svg class="icon pin" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 5.4 10.308 5.715 10.658a1 1 0 0 0 1.57 0C12.6 18.308 18 12.418 18 8c0-3.314-2.686-6-6-6z" stroke="#6b6b6b" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" fill="rgba(11,111,177,0.04)"/>
            <circle cx="12" cy="8" r="2" fill="#0b6fb1"/>
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

    // Р В РЎСљР В Р’В°Р В Р вЂ Р В РЎвЂР В РЎвЂ“Р В Р’В°Р РЋРІР‚В Р В РЎвЂР РЋР РЏ Р В Р вЂ¦Р В Р’В° /schedule Р РЋРІР‚С™Р В РЎвЂўР В Р’В»Р РЋР Р‰Р В РЎвЂќР В РЎвЂў Р В Р’ВµР РЋР С“Р В Р’В»Р В РЎвЂ Р В РЎВР РЋРІР‚в„– Р В РЎСљР В РІР‚Сћ Р В Р вЂ¦Р В Р’В° Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚В Р В Р’В°Р РЋРІР‚В¦,
    // Р В РЎвЂќР В РЎвЂўР РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋРІР‚в„–Р В Р’Вµ Р РЋРЎвЂњР В Р’В¶Р В Р’Вµ Р РЋРЎвЂњР В РЎВР В Р’ВµР РЋР вЂ№Р РЋРІР‚С™ Р В РЎвЂўР РЋРІР‚С™Р В РЎвЂќР РЋР вЂљР РЋРІР‚в„–Р В Р вЂ Р В Р’В°Р РЋРІР‚С™Р РЋР Р‰ Р РЋР С“Р РЋРЎвЂњР РЋРІР‚В°Р В Р вЂ¦Р В РЎвЂўР РЋР С“Р РЋРІР‚С™Р РЋР Р‰ inline (groups, teachers, schedule)
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

.row2 {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  width: 100%;
  gap: 8px;
  font-size: 0.86rem;
  color: #445;
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
  color: #0b6fb1;
  text-decoration: underline;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.subgroup {
  flex: 1 1 64px;
  min-width: 64px;
  max-width: 100%;
  flex-shrink: 2;
  order: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #6b6b6b;
  text-align: center;
}

.subgroup.is-empty {
  visibility: hidden;
  pointer-events: none;
}

.classroom {
  flex: 0 0 90px;
  width: 90px;
  flex-shrink: 0;
  order: 3;
  color: #6b6b6b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.classroom-inner {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* gap: 6px; */
  /* background: rgba(11,111,177,0.05); */
  padding: 6px 0px;
  border-radius: 8px;
}

.classroom .icon { flex: 0 0 auto }

.classroom-text {
  width: 52px;
  font-size: 0.88rem;
  color: #445;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


@media (max-width: 420px) {
  .subgroup {
    flex-basis: 64px;
    min-width: 64px;
    text-align: center;
  }

  .classroom {
    flex-basis: 71px;
  }
}
</style>
