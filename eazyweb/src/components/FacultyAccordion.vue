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
      <LoadError :detail="'группы'" @retry="retry" />
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
  gap: 12px;
  padding: 16px;
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0) 55%),
    radial-gradient(100% 120% at 100% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 60%),
    #f5f9fc;
}

.accordion-hero {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(14, 116, 144, 0.2);
  background: linear-gradient(135deg, #ffffff 0%, #eef8ff 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.accordion-hero h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #0f172a;
}

.accordion-hero p {
  margin: 6px 0 0;
  color: #5b687a;
  font-size: 0.95rem;
}

.accordion-loading {
  flex: 1;
  padding: 2px;
}

.faculty-skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faculty-item {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid #e6edf5;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.sk-header,
.sk-course-line.short,
.sk-pill {
  background: linear-gradient(90deg, #eaf0f6 25%, #f7fbff 50%, #eaf0f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.1s linear infinite;
}

.sk-header {
  height: 14px;
  width: 54%;
  border-radius: 8px;
  margin-bottom: 10px;
}

.sk-course {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.sk-course-line.short {
  height: 10px;
  width: 28%;
  border-radius: 8px;
}

.sk-groups {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sk-pill {
  width: 96px;
  height: 30px;
  border-radius: 999px;
  display: inline-block;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
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
  border-radius: 16px;
  border: 1px solid #dbe6f0;
  background: #fff;
  color: #4b5563;
  padding: 28px 20px;
}

.accordion-empty h3 {
  margin: 0;
  color: #111827;
}

.accordion-empty p {
  margin: 8px 0 0;
}

.accordion-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 0;
}

.accordion-item {
  border-radius: 16px;
  border: 1px solid #dbe7f2;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
}

.accordion-header {
  width: 100%;
  padding: 13px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: none;
  cursor: pointer;
  text-align: left;
  color: #0f172a;
  background: linear-gradient(135deg, #ffffff 0%, #f2f8ff 100%);
  transition: background 0.2s ease, color 0.2s ease;
}

.accordion-header:hover {
  background: linear-gradient(135deg, #eff7ff 0%, #e8f3ff 100%);
}

.accordion-header.open {
  background: linear-gradient(135deg, #e8f4ff 0%, #def0ff 100%);
}

.faculty-title {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.faculty-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.faculty-meta {
  font-size: 0.82rem;
  color: #64748b;
}

.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #334155;
  transition: transform 0.25s ease;
}

.accordion-header.open .toggle-icon {
  transform: rotate(180deg);
}

.accordion-content {
  padding: 6px 12px 10px;
  background: #fff;
}

.course-section {
  padding: 10px 0 8px;
  margin-top: 0;
  background: transparent;
}

.course-section + .course-section {
  border-top: 1px solid #e8eff6;
}

.course-header {
  display: block;
  margin-bottom: 8px;
}

.course-badge {
  display: inline-block;
  padding: 0;
  background: transparent;
  color: #7a889c;
  font-weight: 500;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-btn {
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #d9e7f2;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  text-align: left;
  transition: background 0.16s, transform 0.1s, box-shadow 0.16s, border-color 0.16s;
  color: #1e293b;
  font-size: 0.9rem;
  min-width: 110px;
}

.group-btn:hover {
  background: #f3faff;
  border-color: #b8d9f2;
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(14, 116, 144, 0.12);
}

.group-btn:active {
  transform: translateY(0);
}

.group-title {
  font-weight: 600;
}

.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.24s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1200px;
  opacity: 1;
}

@media (max-width: 768px) {
  .faculty-accordion {
    padding: 12px;
  }

  .accordion-hero {
    padding: 14px;
  }

  .accordion-header {
    padding: 12px 14px;
  }

  .faculty-name {
    font-size: 0.95rem;
  }

  .course-section {
    padding: 9px;
  }

  .group-btn {
    min-width: 96px;
  }
}

@media (max-width: 360px) {
  .faculty-accordion {
    padding: 10px;
  }

  .accordion-hero p {
    font-size: 0.9rem;
  }

  .accordion-content {
    padding: 6px 8px 8px;
  }

  .group-btn {
    width: 100%;
  }
}
</style>
