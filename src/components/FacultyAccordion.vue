<template>
  <div class="faculty-accordion">
    <header class="accordion-hero">
      <h2>Выбор группы</h2>
      <p>Выберите факультет и курс, чтобы открыть расписание нужной группы.</p>
    </header>

    <div v-if="isLoading" class="accordion-loading" aria-busy="true">
      <div class="faculty-skeleton">
        <div class="faculty-item" v-for="n in 4" :key="n">
          <div class="sk-header"></div>
          <div class="sk-course" v-for="m in 2" :key="`${n}-${m}`">
            <div class="sk-course-line short"></div>
            <div class="sk-groups">
              <span class="sk-pill" v-for="k in 5" :key="`${n}-${m}-${k}`"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-offset">
      <LoadError :detail="' группы'" @retry="retry" />
    </div>

    <section v-else-if="faculties.length === 0" class="accordion-empty">
      <h3>Нет данных по группам</h3>
      <p>Попробуйте обновить страницу чуть позже.</p>
    </section>

    <div v-else class="accordion-container">
      <article v-for="faculty in faculties" :key="faculty.id" class="accordion-item">
        <button
          class="accordion-header"
          :class="{ open: expandedFacultyIds.has(faculty.id) }"
          @click="toggleFaculty(faculty.id)"
        >
          <span class="faculty-title">
            <span class="faculty-name">{{ faculty.title }}</span>
            <span class="faculty-meta">{{ faculty.shortTitle || '' }}</span>
          </span>
          <span class="toggle-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 8L10 12L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </button>

        <transition name="expand">
          <div v-show="expandedFacultyIds.has(faculty.id)" class="accordion-content">
            <section v-for="course in faculty.courses" :key="`course-${faculty.id}-${course.number}`" class="course-section">
              <div class="course-header">
                <span class="course-badge">{{ course.number }} курс</span>
              </div>

              <div class="groups-list">
                <button
                  v-for="group in course.groups"
                  :key="group.id"
                  class="group-btn"
                  @click="selectGroup(group)"
                >
                  <span class="group-title">{{ group.title }}</span>
                </button>
              </div>
            </section>
          </div>
        </transition>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchGroupsWithFaculties, organizedGroupsByFacultyAndCourse } from '../api/groupsService'
import LoadError from './LoadError.vue'

const emit = defineEmits(['group-selected'])

const isLoading = ref(false)
const error = ref(null)
const faculties = ref([])
const expandedFacultyIds = ref(new Set())

async function loadFaculties() {
  isLoading.value = true
  error.value = null

  try {
    const parsedData = await fetchGroupsWithFaculties()
    const organized = organizedGroupsByFacultyAndCourse(parsedData)
    faculties.value = organized
  } catch (err) {
    console.error('Failed to load faculties:', err)
    error.value = err.message || 'Не удалось загрузить данные'
  } finally {
    isLoading.value = false
  }
}

function toggleFaculty(facultyId) {
  const set = expandedFacultyIds.value
  if (set.has(facultyId)) set.delete(facultyId)
  else set.add(facultyId)
  expandedFacultyIds.value = new Set(set)
}

function selectGroup(group) {
  emit('group-selected', {
    id: group.id,
    name: group.title,
    endpoint: group.endpoint
  })
}

function retry() {
  loadFaculties()
}

onMounted(() => {
  expandedFacultyIds.value = new Set()
  loadFaculties()
})
</script>

<style scoped>
.faculty-accordion {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* padding: 12px; */
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.accordion-hero {
  padding: 20px 24px;
  border-radius: 20px;
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-surface);
}

.accordion-hero h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.02em;
}

.accordion-hero p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.96rem;
  line-height: 1.45;
}

.accordion-loading {
  flex: 1;
  padding: 4px;
}

.faculty-skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.faculty-item {
  background: var(--color-bg-surface-strong);
  border-radius: 18px;
  padding: 16px;
  border: 1px solid var(--color-border-soft);
  backdrop-filter: blur(10px);
}

.sk-header,
.sk-course-line.short,
.sk-pill {
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 25%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
  border-radius: 10px;
}

.sk-header {
  height: 16px;
  width: 60%;
  margin-bottom: 12px;
}

.sk-course {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.sk-course-line.short {
  height: 12px;
  width: 35%;
}

.sk-groups {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sk-pill {
  width: 108px;
  height: 34px;
  border-radius: 14px;
}

.error-offset {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.accordion-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 18px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  padding: 32px 24px;
  box-shadow: var(--shadow-card);
}

.accordion-empty h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.accordion-empty p {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
}

.accordion-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* padding-right: 4px; */
}

.accordion-item {
  border-radius: 18px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.accordion-header {
  width: 100%;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-primary);
  background: var(--color-overlay-soft);
  transition: all 0.22s ease;
}

.accordion-header:hover {
  background: var(--color-bg-hover);
}

.accordion-header.open {
  background: var(--color-bg-hover-strong);
}

.faculty-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.faculty-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-accent-soft);
}

.faculty-meta {
  font-size: 0.88rem;
  color: var(--color-text-secondary);
}

.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: transform 0.25s ease, color 0.25s ease;
}

.accordion-header.open .toggle-icon {
  transform: rotate(180deg);
  color: var(--color-text-secondary);
}

.accordion-content {
  padding: 8px 16px 12px;
  background: var(--color-overlay-soft);
}

.course-section {
  padding: 12px 0 10px;
}

.course-section + .course-section {
  border-top: 1px solid var(--color-border-soft);
}

.course-header {
  margin-bottom: 10px;
}

.course-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  color: var(--color-accent-soft);
  font-weight: 600;
  font-size: 0.8rem;
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.group-btn {
  padding: 10px 16px;
  background: var(--color-bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: left;
  transition: all 0.18s ease;
  color: var(--color-text-primary);
  font-size: 0.94rem;
  min-width: 118px;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-raised);
}

.group-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.group-btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-raised);
}

.group-title {
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Transition */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.32s ease, opacity 0.26s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1400px;
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .accordion-hero {
    padding: 18px 20px;
  }

  .accordion-header {
    padding: 13px 16px;
  }

  .faculty-name {
    font-size: 1rem;
  }

  .group-btn {
    min-width: 104px;
  }
}

@media (max-width: 360px) {
  /* .faculty-accordion {
    padding: 10px;
  } */

  .accordion-hero p {
    font-size: 0.92rem;
  }

  .accordion-content {
    padding: 8px 12px 10px;
  }

  .group-btn {
    width: 100%;
    min-width: unset;
  }
}
</style>
