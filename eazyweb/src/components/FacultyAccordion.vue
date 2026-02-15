<template>
  <div class="faculty-accordion">
    <!-- Loading state (skeleton) -->
    <div v-if="isLoading" class="accordion-loading">
      <div class="faculty-skeleton">
        <div class="faculty-item" v-for="n in 4" :key="n">
          <div class="sk-header"></div>
          <div class="sk-course">
            <div class="sk-course-line short"></div>
            <div class="sk-groups">
              <span class="sk-pill" v-for="m in 4" :key="m"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-offset">
      <LoadError :detail="' группы'" @retry="retry" />
    </div>

    <!-- Empty state -->
    <div v-else-if="faculties.length === 0" class="accordion-empty">
      <p>На данный момент информации о группах нет</p>
    </div>

    <!-- Accordion items -->
    <div v-else class="accordion-container">
      <div v-for="faculty in faculties" :key="faculty.id" class="accordion-item">
        <!-- Faculty Header -->
        <button
          class="accordion-header"
          :class="{ open: expandedFacultyIds.has(faculty.id) }"
          @click="toggleFaculty(faculty.id)"
        >
          <span class="faculty-title">
            <span class="faculty-name">{{ faculty.title }}</span>
          </span>
          <span class="toggle-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 8L10 11L13 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </span>
        </button>

        <!-- Faculty Content -->
        <transition name="expand">
          <div v-show="expandedFacultyIds.has(faculty.id)" class="accordion-content">
            <!-- Courses within faculty -->
            <div v-for="course in faculty.courses" :key="`course-${course.number}`" class="course-section">
              <div class="course-header">
                <span class="line"></span>
                <span class="course-number">{{ course.number }} курс</span>
                <span class="small-line"></span>
              </div>

              <!-- Groups within course -->
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
            </div>
          </div>
        </transition>
      </div>
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
// allow multiple open faculties
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
  // force ref change
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
  // start collapsed
  expandedFacultyIds.value = new Set()
  loadFaculties()
})
</script>

<style scoped>
.faculty-accordion {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Loading state */
.accordion-loading {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  /* allow skeleton to sit at top of container */
  height: auto;
  gap: 12px;
  color: #666;
  padding: 8px;
}

/* Skeleton inside accordion */
.faculty-skeleton { width: 100%; padding: 8px; display:flex; flex-direction:column; gap:10px }
.faculty-item { background: #fff; border-radius: 8px; padding: 10px; box-shadow: 0 6px 18px rgba(20,40,80,0.04) }
.sk-header { height: 14px; width: 60%; border-radius: 6px; background: linear-gradient(90deg,#eef3f8 25%, #f6f9fc 50%, #eef3f8 75%); background-size:200% 100%; animation: shimmer 1.1s linear infinite; margin-bottom: 8px }
.sk-course { display:flex; flex-direction:column; gap:8px }
.sk-course-line.short { height: 10px; width: 35%; border-radius:6px; background: linear-gradient(90deg,#eef3f8 25%, #f6f9fc 50%, #eef3f8 75%); background-size:200% 100%; animation: shimmer 1.1s linear infinite }
.sk-groups { display:flex; gap:8px; flex-wrap:wrap }
.sk-pill { width: 100px; height: 32px; border-radius: 16px; display:inline-block; background: linear-gradient(90deg,#eef3f8 25%, #f6f9fc 50%, #eef3f8 75%); background-size:200% 100%; animation: shimmer 1.1s linear infinite }

@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

/* error offset: 30% from top */
.error-offset { margin-top: 30vh; display:flex; justify-content:center }


/* Empty state */
.accordion-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}

/* Accordion container */
.accordion-container {
  flex: 1;
  overflow-y: auto;
  min-width: 280px;
  max-width: 768px;
  
  width: 100%;
  padding: 8px;
}

/* Accordion item */
.accordion-item {
  margin-bottom: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: white;
}

/* Faculty header */
.accordion-header {
  width: 100%;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border: none;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  text-align: left;
}

.accordion-header:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.accordion-header.open {
  /* keep header visual neutral; only rotate icon when open */
}

.faculty-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.faculty-name {
  flex: 1;
  font-weight: 600;
}

.faculty-short {
  font-size: 13px;
  opacity: 0.8;
}

.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.accordion-header.active .toggle-icon {
  transform: rotate(180deg);
  color: white;
}

.toggle-icon svg {
  color: inherit;
}

/* Accordion content */
.accordion-content {
  padding: 6px 0 4px;
  background: white;
}

/* Course section */
.course-section {
  padding: 0;
  border-top: 0px solid #f0f0f0;
}

.course-section:first-child {
  border-top: none;
}

.course-header {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  color: #6b6b6b;
}

.course-header .line {
  flex: 1 1 auto;
  height: 1px;
  background: #e6e6e6;

}

.course-header .line:first-child {
  margin-right: 12px;
}

.course-header .line:last-child {
  margin-left: 12px;
}

.course-header .small-line {
  width: 20px;
  height: 1px;
  background: #e6e6e6;
  display: inline-block;
  margin-left: 8px;
  margin-right: 8px;
}

.course-number {
  display: inline-block;
  font-size: 13px;
  font-weight: 400;
  color: #7a7a7a;
  white-space: nowrap;
}

/* Groups list: horizontal wrapping buttons */

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 12px;
}

.group-btn {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e9e9e9;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: background 0.15s, transform 0.08s, box-shadow 0.12s;
  color: #222;
  font-size: 14px;
  min-width: 120px;
  flex: 0 1 auto;
  box-shadow: 0 0 0 rgba(0,0,0,0);
}

.group-btn:hover {
  background: #f7fbff;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(20,40,80,0.06);
}

.group-btn:active {
  background: #eef4ff;
  transform: translateY(0);
}

.group-title {
  font-weight: 600;
}


.group-btn:hover .group-arrow {
  transform: translateX(4px);
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .accordion-container {
    max-width: 100%;
    padding: 12px;
  }

  .accordion-header {
    padding: 14px;
  }

  .faculty-name {
    font-size: 15px;
  }

  .faculty-short {
    font-size: 12px;
  }

  .toggle-icon {
    width: 18px;
    height: 18px;
  }

  .group-btn {
    padding: 10px 14px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .accordion-container {
    padding: 8px;
  }

  .accordion-header {
    padding: 12px;
    flex-wrap: wrap;
  }

  .faculty-title {
    flex-basis: 100%;
    margin-bottom: 4px;
  }

  .toggle-icon {
    flex-basis: auto;
  }
}
</style>
