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
  padding: 12px;
  background: linear-gradient(135deg, #0f1117 0%, #171b26 100%);
  color: #e2e8f0;
}

.accordion-hero {
  padding: 20px 24px;
  border-radius: 20px;
  background: rgba(30, 41, 59, 0.28);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(100, 116, 139, 0.22);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.38);
}

.accordion-hero h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #818cf8;           /* как в teachers-hero h1 */
  letter-spacing: -0.02em;
}

.accordion-hero p {
  margin: 8px 0 0;
  color: #94a3b8;
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
  background: rgba(30, 41, 59, 0.32);
  border-radius: 18px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(10px);
}

.sk-header,
.sk-course-line.short,
.sk-pill {
  background: linear-gradient(
    90deg,
    rgba(71, 85, 105, 0.4) 25%,
    rgba(100, 116, 139, 0.6) 50%,
    rgba(71, 85, 105, 0.4) 75%
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
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
  padding: 32px 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
}

.accordion-empty h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.25rem;
  font-weight: 600;
}

.accordion-empty p {
  margin: 10px 0 0;
  color: #94a3b8;
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
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
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
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.35);
  transition: all 0.22s ease;
}

.accordion-header:hover {
  background: rgba(51, 65, 85, 0.42);
}

.accordion-header.open {
  background: rgba(51, 65, 85, 0.38);
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
  color: #87cbc1;           /* твой спокойный мятный */
}

.faculty-meta {
  font-size: 0.88rem;
  color: #94a3b8;
}

.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #525252;           /* как у тебя */
  transition: transform 0.25s ease, color 0.25s ease;
}

.accordion-header.open .toggle-icon {
  transform: rotate(180deg);
  color: #717171;
}

.accordion-content {
  padding: 8px 16px 12px;
  background: rgba(15, 23, 42, 0.2);
}

.course-section {
  padding: 12px 0 10px;
}

.course-section + .course-section {
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.course-header {
  margin-bottom: 10px;
}

.course-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  color: #5f9d94;           /* твой приглушённый teal */
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
  background: rgba(51, 65, 85, 0.28);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: left;
  transition: all 0.18s ease;
  color: #e2e8f0;
  font-size: 0.94rem;
  min-width: 118px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.group-btn:hover {
  background: rgba(51, 65, 85, 0.42);
  border-color: rgba(148, 163, 184, 0.32);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.group-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
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
  .faculty-accordion {
    padding: 10px;
  }

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
