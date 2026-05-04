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
  const firstSymbolMap = new Map()

  classrooms.forEach(classroom => {
    const title = String(classroom.title || '').trim()
    const firstSymbol = (title[0] || '?').toUpperCase()
    const secondSymbol = (title[1] || '?').toUpperCase()

    if (!firstSymbolMap.has(firstSymbol)) firstSymbolMap.set(firstSymbol, new Map())

    const secondSymbolMap = firstSymbolMap.get(firstSymbol)
    if (!secondSymbolMap.has(secondSymbol)) secondSymbolMap.set(secondSymbol, [])
    secondSymbolMap.get(secondSymbol).push(classroom)
  })

  return Array.from(firstSymbolMap.entries())
    .map(([symbol, secondSymbolMap]) => ({
      symbol,
      subgroups: Array.from(secondSymbolMap.entries())
        .map(([subsymbol, list]) => ({
          subsymbol,
          classrooms: list.sort((a, b) => a.title.localeCompare(b.title, 'ru', { numeric: true }))
        }))
        .sort((a, b) => a.subsymbol.localeCompare(b.subsymbol, 'ru', { numeric: true }))
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol, 'ru', { numeric: true }))
}

export function clearClassroomsCache() {
  cache = null
  cacheTs = null
}
