import api from './axios'

let cache = null
let cacheTs = null
const CACHE_TTL = 1000 * 60 * 15 // 15 min

export async function fetchTeachers(useCache = true) {
  if (useCache && cache && cacheTs && Date.now() - cacheTs < CACHE_TTL) {
    return cache
  }

  try {
    const res = await api.get('/teachers/')
    const data = res.data || {}
    const teachers = Array.isArray(data.data)
      ? data.data.map(item => ({
          id: item.id,
          fullName: item.attributes?.fullName || '',
          shortName: item.attributes?.shortName || '',
          endpoint: item.attributes?.endpoint || ''
        }))
      : []

    cache = teachers
    cacheTs = Date.now()
    return teachers
  } catch (e) {
    console.error('fetchTeachers error', e)
    throw e
  }
}

export function groupTeachersByLetter(teachers) {
  const map = new Map()
  teachers.forEach(t => {
    // try to pick surname first letter from fullName
    let letter = ''
    if (t.fullName) {
      const parts = t.fullName.trim().split(/\s+/)
      if (parts.length) letter = parts[0][0]
    }
    if (!letter && t.shortName) letter = t.shortName.trim()[0]
    letter = (letter || '?').toUpperCase()
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter).push(t)
  })

  // Convert to sorted array by letter (locale ru)
  const arr = Array.from(map.entries())
    .map(([letter, list]) => ({
      letter,
      teachers: list.sort((a, b) => (a.shortName || a.fullName).localeCompare(b.shortName || b.fullName, 'ru'))
    }))
    .sort((a, b) => a.letter.localeCompare(b.letter, 'ru'))

  return arr
}

export function clearTeachersCache() {
  cache = null
  cacheTs = null
}
