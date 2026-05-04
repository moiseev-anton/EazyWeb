import { computed, ref } from 'vue'

const selectionMap = {
  groups: ref(null),
  teachers: ref(null),
  classrooms: ref(null)
}

export function useEntitySelection(routeName) {
  const selectedEntity = computed({
    get: () => selectionMap[routeName]?.value ?? null,
    set: (value) => {
      if (!selectionMap[routeName]) return
      selectionMap[routeName].value = value
    }
  })

  function clearSelection() {
    if (!selectionMap[routeName]) return
    selectionMap[routeName].value = null
  }

  return {
    selectedEntity,
    clearSelection
  }
}

export function hasEntitySelection(routeName) {
  return !!selectionMap[routeName]?.value
}

export function clearEntitySelection(routeName) {
  if (!selectionMap[routeName]) return
  selectionMap[routeName].value = null
}
