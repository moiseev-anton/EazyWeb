import api from './axios'

let cache = null
let cacheTs = null
const CACHE_TTL = 1000 * 60 * 15

export async function fetchClassrooms(useCache = true) {
  if (useCache && cache && cacheTs && Date.now() - cacheTs < CACHE_TTL) {
    return cache
  }

  try {
    const res = await api.get('/classrooms/')
    const data = res.data || {}
    const classrooms = Array.isArray(data.data)
      ? data.data
          .map(item => ({
            id: item.id,
            title: item.attributes?.title || ''
          }))
          .filter(classroom => classroom.title && classroom.title.toLowerCase() !== 'дист')
      : []

    cache = classrooms
    cacheTs = Date.now()
    return classrooms
  } catch (e) {
    console.error('fetchClassrooms error', e)
    throw e
  }
}

export function groupClassroomsByFirstSymbol(classrooms) {
  const map = new Map()

  classrooms.forEach(classroom => {
    const title = String(classroom.title || '').trim()
    const symbol = (title[0] || '?').toUpperCase()

    if (!map.has(symbol)) map.set(symbol, [])
    map.get(symbol).push(classroom)
  })

  return Array.from(map.entries())
    .map(([symbol, list]) => ({
      symbol,
      classrooms: list.sort((a, b) => a.title.localeCompare(b.title, 'ru', { numeric: true }))
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol, 'ru', { numeric: true }))
}

export function clearClassroomsCache() {
  cache = null
  cacheTs = null
}
