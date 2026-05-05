import api from './axios'

function normalizeTitle(value) {
  return String(value || '').trim().toLowerCase()
}

export async function fetchLessonsByPeriod({ date, lessonNumber }) {
  const res = await api.get('/lessons/by-period/', {
    params: {
      'filter[date]': date,
      'filter[lesson_number]': lessonNumber
    }
  })

  const payload = res.data || {}
  const included = Array.isArray(payload.included) ? payload.included : []
  const classroomsById = new Map()

  included.forEach(item => {
    if (item.type === 'classrooms') {
      classroomsById.set(String(item.id), item.attributes?.title || '')
    }
  })

  const occupiedClassroomIds = new Set()
  const occupiedClassroomTitles = new Set()

  const lessons = Array.isArray(payload.data) ? payload.data : []
  lessons.forEach(item => {
    const relId = item.relationships?.classroom?.data?.id
    if (relId) {
      occupiedClassroomIds.add(String(relId))
      const relTitle = classroomsById.get(String(relId))
      if (relTitle) occupiedClassroomTitles.add(normalizeTitle(relTitle))
    }

    const attrTitle = item.attributes?.classroom
    if (attrTitle) occupiedClassroomTitles.add(normalizeTitle(attrTitle))
  })

  return {
    occupiedClassroomIds,
    occupiedClassroomTitles
  }
}
