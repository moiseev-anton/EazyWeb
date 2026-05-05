import api from './axios'

// Cache for groups data
let groupsCache = null
let cacheTimestamp = null
const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

/**
 * Fetch all groups with faculty information
 * Returns data structured as: groups with faculty relationships resolved
 */
export async function fetchGroupsWithFaculties(useCache = true) {
  // Check cache first
  if (useCache && groupsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return groupsCache
  }

  try {
    const response = await api.get('/groups/', {
      params: {
        include: 'faculty'
      }
    })

    const structuredData = parseJsonApiResponse(response.data)
    groupsCache = structuredData
    cacheTimestamp = Date.now()

    return structuredData
  } catch (error) {
    console.error('Error fetching groups:', error)
    throw error
  }
}

/**
 * Parse JSON:API response and structure data
 * Returns: { faculties: {}, groups: [] }
 */
function parseJsonApiResponse(jsonApiData) {
  const faculties = {}
  const groups = []

  // Index included faculties
  if (jsonApiData.included && Array.isArray(jsonApiData.included)) {
    jsonApiData.included.forEach(item => {
      if (item.type === 'faculties') {
        faculties[item.id] = {
          id: item.id,
          title: item.attributes.title,
          shortTitle: item.attributes.shortTitle
        }
      }
    })
  }

  // Process groups
  if (jsonApiData.data && Array.isArray(jsonApiData.data)) {
    jsonApiData.data.forEach(item => {
      if (item.type === 'groups') {
        const facultyId = item.relationships?.faculty?.data?.id
        groups.push({
          id: item.id,
          title: item.attributes.title,
          grade: item.attributes.grade,
          endpoint: item.attributes.endpoint,
          facultyId: facultyId
        })
      }
    })
  }

  return { faculties, groups }
}

/**
 * Get structured data: groups organized by faculties and courses within each faculty
 * Returns: { faculties: [{id, title, shortTitle, courses: [{number, groups: []}]}] }
 */
export function organizedGroupsByFacultyAndCourse(parsedData) {
  const { faculties, groups } = parsedData

  // Group by faculty and then by course
  const result = Object.values(faculties).map(faculty => {
    const facultyGroups = groups.filter(g => g.facultyId === faculty.id)
    
    // Group by grade (course)
    const courseMap = {}
    facultyGroups.forEach(group => {
      if (!courseMap[group.grade]) {
        courseMap[group.grade] = []
      }
      courseMap[group.grade].push(group)
    })

    // Convert to array and sort by course number
    const courses = Object.entries(courseMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([courseNumber, courseGroups]) => ({
        number: Number(courseNumber),
        groups: courseGroups.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
      }))

    return {
      ...faculty,
      courses
    }
  }).sort((a, b) => a.title.localeCompare(b.title, 'ru'))

  return result
}

/**
 * Clear cache
 */
export function clearGroupsCache() {
  groupsCache = null
  cacheTimestamp = null
}
