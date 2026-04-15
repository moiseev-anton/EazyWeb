import api from './axios'

// Helper to parse json:api response and resolve included entities
function buildIncludedMap(included) {
  const map = { groups: {}, teachers: {} }
  if (!included || !Array.isArray(included)) return map
  included.forEach(item => {
    if (item.type === 'groups') {
      map.groups[item.id] = {
        id: item.id,
        title: item.attributes.title,
        grade: item.attributes.grade,
        endpoint: item.attributes.endpoint
      }
    } else if (item.type === 'teachers') {
      map.teachers[item.id] = {
        id: item.id,
        fullName: item.attributes.fullName,
        shortName: item.attributes.shortName,
        endpoint: item.attributes.endpoint
      }
    }
  })
  return map
}

function resolveRelationId(relationshipData) {
  if (!relationshipData || Array.isArray(relationshipData)) return null
  return relationshipData.id || null
}

function normalizeLessonPart(part) {
  if (part === null || part === undefined || part === '') return null
  const numericPart = Number(part)
  return Number.isFinite(numericPart) ? numericPart : null
}

export async function fetchLessons({ date_from, date_to, group = null, teacher = null, include = 'group,teacher' } = {}) {
  const params = {
    'filter[date_from]': date_from,
    'filter[date_to]': date_to
  }
  if (group) params['filter[group]'] = group
  if (teacher) params['filter[teacher]'] = teacher
  if (include) params.include = include

  const res = await api.get('/lessons/', { params })
  const payload = res.data || {}
  const includedMap = buildIncludedMap(payload.included)

  // attach resolved relations into each lesson for easier consumption
  const lessons = Array.isArray(payload.data) ? payload.data.map(item => {
    const groupRelId = resolveRelationId(item.relationships?.group?.data)
    const teacherRelId = resolveRelationId(item.relationships?.teacher?.data)
    return {
      ...item,
      attributes: {
        ...item.attributes,
        part: normalizeLessonPart(item.attributes?.part)
      },
      _resolved: {
        group: groupRelId ? includedMap.groups[groupRelId] : null,
        teacher: teacherRelId ? includedMap.teachers[teacherRelId] : null
      }
    }
  }) : []

  return { lessons, included: includedMap }
}
