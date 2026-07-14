<template>
  <ScheduleDashboard
    v-if="selectedEntity"
    :entityId="selectedEntity.id"
    :entityType="selectedEntity.type"
    :entityName="selectedEntity.name"
    :showBackButton="true"
    @back="selectedEntity = null"
    @open-entity="handleOpenEntity"
  />

  <div v-else class="classrooms-view">
    <header class="classrooms-hero">
      <h1>Кабинеты</h1>
      <p>Выберите кабинет из списка, чтобы открыть его расписание.</p>
    </header>

    <section class="traffic-panel">
      <div class="traffic-panel-top">
        <div class="panel-copy">
          <!-- <h3>Занятость кабинетов</h3> -->
          <p>Занятость кабинетов</p>
        </div>
      </div>

      <div class="traffic-controls">
        <div class="calendar-block">
          <button ref="calendarButtonRef" class="calendar-button" @click="toggleCalendar">
            <span class="calendar-label">{{ selectedDateLabel }}</span>
            <ChevronDownIcon class="calendar-arrow" aria-hidden="true" />
          </button>
        </div>

        <div class="period-stepper" :class="{ disabled: availabilityLoading }">
          <button
            class="stepper-btn"
            @click="changeLessonNumber(-1)"
            :disabled="availabilityLoading || selectedLessonNumber === null"
          >
            <ChevronLeftIcon class="stepper-arrow" aria-hidden="true" />
          </button>

          <button
            ref="lessonPickerButtonRef"
            class="stepper-value"
            :class="{ empty: selectedLessonNumber === null }"
            @click="toggleLessonPicker"
            :disabled="availabilityLoading"
          >
            {{ selectedLessonNumber === null ? '---' : selectedLessonNumber }}
          </button>

          <button
            class="stepper-btn"
            @click="changeLessonNumber(1)"
            :disabled="availabilityLoading || selectedLessonNumber === lessonNumbers[lessonNumbers.length - 1]"
          >
            <ChevronRightIcon class="stepper-arrow" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div v-if="availabilityError" class="traffic-status">
        <span class="status-chip is-error">{{ availabilityError }}</span>
      </div>
    </section>

    <div v-if="calendarVisible" class="overlay" @click="calendarVisible = false">
      <div class="calendar-popup" :style="popupStyle" @click.stop>
        <VueDatePicker
          v-model="selectedDate"
          inline
          auto-apply
          :time-config="{ enableTimePicker: false }"
          :locale="ru"
          @update:model-value="onDateSelected"
          class="classrooms-datepicker"
        />
      </div>
    </div>

    <div v-if="lessonPickerVisible" class="overlay" @click="lessonPickerVisible = false">
      <div class="lesson-picker-popup" :style="lessonPickerPopupStyle" @click.stop>
        <div class="lesson-picker-grid">
          <button
            v-for="num in lessonNumbers"
            :key="`lesson-pick-${num}`"
            class="lesson-picker-option"
            :class="{ active: selectedLessonNumber === num }"
            @click="pickLessonNumber(num)"
          >
            {{ num }}
          </button>
          <button class="lesson-picker-option clear" @click="pickLessonNumber(null)">
            ---
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="classrooms-skeleton" aria-busy="true">
      <div class="letter-skel" v-for="n in 5" :key="n">
        <div class="sk-letter"></div>
        <div class="sk-classrooms">
          <span class="sk-pill" v-for="m in 6" :key="`${n}-${m}`"></span>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-offset">
      <LoadError :detail="' кабинетов'" @retry="load" />
    </div>

    <section v-else-if="groups.length === 0" class="center-state">
      <h3>Список кабинетов пуст</h3>
      <p>Данные появятся, когда они будут доступны на сервере.</p>
    </section>

    <div v-else class="classrooms-container">
      <section v-for="group in groups" :key="group.symbol" class="letter-section">
        <div class="letter-header">{{ group.symbol }}</div>
        <div class="letter-content">
          <section
            v-for="subgroup in group.subgroups"
            :key="`${group.symbol}-${subgroup.subsymbol}`"
            class="subgroup-section"
          >
            <div class="classrooms-list">
              <button
                v-for="classroom in subgroup.classrooms"
                :key="classroom.id"
                class="classroom-btn"
                :class="classroomTrafficClass(classroom)"
                @click="selectClassroom(classroom)"
              >
                <span class="classroom-name">{{ classroom.title }}</span>
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import { fetchClassrooms, groupClassroomsByFirstSymbol } from '../api/classroomsService'
import { fetchLessonsByPeriod } from '../api/periodLessonsService'
import LoadError from '../components/LoadError.vue'
import { useEntitySelection } from '../composables/entitySelection'

const { selectedEntity } = useEntitySelection('classrooms')
const isLoading = ref(false)
const error = ref(null)
const groups = ref([])

const selectedDate = ref(new Date())
const selectedLessonNumber = ref(null)
const lessonNumbers = [1, 2, 3, 4, 5, 6]
const availabilityLoading = ref(false)
const availabilityError = ref('')
const occupiedClassroomIds = ref(new Set())
const occupiedClassroomTitles = ref(new Set())

const calendarVisible = ref(false)
const calendarButtonRef = ref(null)
const popupStyle = ref({})
const lessonPickerVisible = ref(false)
const lessonPickerButtonRef = ref(null)
const lessonPickerPopupStyle = ref({})
let rafId = null

const trafficEnabled = computed(() => selectedLessonNumber.value !== null)
const selectedDateIso = computed(() => format(selectedDate.value, 'yyyy-MM-dd'))
const selectedDateLabel = computed(() => format(selectedDate.value, 'd MMMM yyyy', { locale: ru }))

async function load() {
  isLoading.value = true
  error.value = null
  try {
    const data = await fetchClassrooms()
    groups.value = groupClassroomsByFirstSymbol(data)
  } catch (e) {
    console.error(e)
    error.value = e.message || 'Не удалось загрузить список кабинетов'
  } finally {
    isLoading.value = false
  }
}

async function loadAvailability() {
  if (!trafficEnabled.value) {
    availabilityError.value = ''
    occupiedClassroomIds.value = new Set()
    occupiedClassroomTitles.value = new Set()
    return
  }

  availabilityLoading.value = true
  availabilityError.value = ''

  try {
    const result = await fetchLessonsByPeriod({
      date: selectedDateIso.value,
      lessonNumber: selectedLessonNumber.value
    })
    occupiedClassroomIds.value = result.occupiedClassroomIds
    occupiedClassroomTitles.value = result.occupiedClassroomTitles
  } catch (e) {
    console.error(e)
    occupiedClassroomIds.value = new Set()
    occupiedClassroomTitles.value = new Set()
    availabilityError.value = 'Не удалось определить занятость'
  } finally {
    availabilityLoading.value = false
  }
}

function normalizeTitle(value) {
  return String(value || '').trim().toLowerCase()
}

function isClassroomBusy(classroom) {
  if (!trafficEnabled.value) return false
  return occupiedClassroomIds.value.has(String(classroom.id))
    || occupiedClassroomTitles.value.has(normalizeTitle(classroom.title))
}

function classroomTrafficClass(classroom) {
  if (!trafficEnabled.value) return 'is-neutral'
  return isClassroomBusy(classroom) ? 'is-busy' : 'is-free'
}

function selectLessonNumber(number) {
  selectedLessonNumber.value = number
}

function changeLessonNumber(direction) {
  if (selectedLessonNumber.value === null) {
    if (direction > 0) selectedLessonNumber.value = lessonNumbers[0]
    return
  }

  const currentIndex = lessonNumbers.indexOf(selectedLessonNumber.value)
  if (currentIndex < 0) return

  const nextIndex = currentIndex + direction
  if (nextIndex < 0 || nextIndex >= lessonNumbers.length) return

  selectedLessonNumber.value = lessonNumbers[nextIndex]
}

function pickLessonNumber(number) {
  selectedLessonNumber.value = number
  lessonPickerVisible.value = false
}

function toggleLessonPicker() {
  if (lessonPickerVisible.value) {
    lessonPickerVisible.value = false
    return
  }

  lessonPickerVisible.value = true
  nextTick(() => {
    positionLessonPickerNearButton()
  })
}

function selectClassroom(classroom) {
  selectedEntity.value = { id: classroom.id, name: classroom.title, type: 'classroom' }
}

function handleOpenEntity(entity) {
  selectedEntity.value = { ...entity }
}

function onDateSelected(value) {
  if (!value) return
  selectedDate.value = Array.isArray(value) ? value[0] : value
  calendarVisible.value = false
}

function positionPopupNearButton() {
  const btn = calendarButtonRef.value
  if (!btn) return

  const rect = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const pickerWidth = 320
  let left = rect.left

  if (left + pickerWidth > vw - 8) left = Math.max(8, vw - pickerWidth - 8)

  popupStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${left}px`
  }
}

function positionLessonPickerNearButton() {
  const btn = lessonPickerButtonRef.value
  if (!btn) return

  const rect = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const pickerWidth = 220
  let left = rect.left + rect.width / 2 - pickerWidth / 2

  if (left + pickerWidth > vw - 8) left = Math.max(8, vw - pickerWidth - 8)
  if (left < 8) left = 8

  lessonPickerPopupStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${left}px`
  }
}

function handleReposition() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    positionPopupNearButton()
    positionLessonPickerNearButton()
  })
}

function addRepositionListeners() {
  window.addEventListener('resize', handleReposition, { passive: true })
  window.addEventListener('scroll', handleReposition, { passive: true })
}

function removeRepositionListeners() {
  window.removeEventListener('resize', handleReposition)
  window.removeEventListener('scroll', handleReposition)
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function toggleCalendar() {
  if (calendarVisible.value) {
    calendarVisible.value = false
    return
  }

  calendarVisible.value = true
  nextTick(() => {
    positionPopupNearButton()
  })
}

watch(calendarVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      positionPopupNearButton()
      addRepositionListeners()
    })
  } else {
    removeRepositionListeners()
  }
})

watch(lessonPickerVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      positionLessonPickerNearButton()
      addRepositionListeners()
    })
  } else if (!calendarVisible.value) {
    removeRepositionListeners()
  }
})

watch([selectedDateIso, selectedLessonNumber], () => {
  loadAvailability()
}, { immediate: true })

onMounted(() => load())
onBeforeUnmount(() => removeRepositionListeners())
</script>

<style scoped>
.classrooms-view {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.classrooms-hero {
  padding: 20px 24px;
  border-radius: 20px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: var(--surface-backdrop);
  -webkit-backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-surface);
}

.traffic-panel {
  padding: 12px 14px;
  border-radius: 20px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: var(--surface-backdrop);
  -webkit-backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-surface);
}

.classrooms-hero h1,
.panel-copy h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.02em;
}

.classrooms-hero p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.96rem;
  line-height: 1.45;
}

.panel-copy p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.96rem;
  line-height: 1.45;
}

.panel-copy h3 {
  font-size: 1.12rem;
}

.traffic-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.traffic-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  align-items: center;
}

.calendar-block {
  display: flex;
  align-items: center;
}

.calendar-button {
  width: min(100%, 180px);
  max-width: 180px;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--color-bg-surface-strong);
  border: 1px solid var(--color-border-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-raised);
  color: var(--color-text-primary);
  font-weight: 600;
  text-transform: capitalize;
  gap: 8px;
}

.calendar-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-arrow {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  width: 16px;
  height: 16px;
}

.calendar-button:hover,
.stepper-btn:hover:not(:disabled),
.stepper-value:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.period-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.period-stepper.disabled {
  opacity: 0.85;
}

.stepper-btn,
.stepper-value {
  height: 40px;
  border-radius: 12px;
  background: var(--color-bg-surface-strong);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-primary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-raised);
}

.stepper-btn {
  width: 30px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.stepper-value {
  min-width: 48px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.stepper-arrow {
  width: 16px;
  height: 16px;
}

.stepper-value.empty {
  color: var(--color-text-secondary);
}

.stepper-btn:disabled,
.stepper-value:disabled {
  cursor: default;
  opacity: 0.6;
}

.traffic-status {
  min-height: 26px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--color-bg-hover-soft);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-size: 0.84rem;
  font-weight: 600;
}

.status-chip.is-error {
  color: var(--color-danger-soft);
}

.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-backdrop-strong);
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.calendar-popup {
  position: absolute;
  z-index: 1002;
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-modal);
  overflow: hidden;
}

.lesson-picker-popup {
  position: absolute;
  z-index: 1002;
  background: var(--color-bg-surface-strong);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-modal);
  overflow: hidden;
  padding: 10px;
}

.lesson-picker-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}

.lesson-picker-option {
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-strong);
  color: var(--color-text-primary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.lesson-picker-option:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.lesson-picker-option.active {
  background: var(--color-accent-bg);
  border-color: var(--color-accent-border);
  color: var(--color-accent-strong);
}

.lesson-picker-option.clear {
  margin-top: 2px;
}

.classrooms-datepicker {
  border-radius: 0 !important;
  box-shadow: none !important;
}

.classrooms-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;
}

.letter-section {
  border-radius: 18px;
  background: var(--color-bg-surface-subtle);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--color-border-soft);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.letter-header {
  padding: 12px 18px;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-success);
  background: var(--color-overlay-soft);
  border-bottom: 1px solid var(--color-border-soft);
}

.letter-content {
  padding: 12px 0 10px;
}

.subgroup-section + .subgroup-section {
  border-top: 1px solid var(--color-border-soft);
}

.classrooms-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 16px 16px;
}

.classroom-btn {
  padding: 10px 16px;
  background: var(--color-bg-surface-strong);
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.18s ease;
  color: var(--color-text-primary);
  font-size: 0.94rem;
  min-width: 96px;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-raised);
}

.classroom-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.classroom-btn.is-neutral {
  background: var(--color-bg-surface-strong);
  border-color: var(--color-border-soft);
}

.classroom-btn.is-free {
  background: var(--color-accent-soft-bg);
  border-color: var(--color-accent-soft-border);
}

.classroom-btn.is-busy {
  background: var(--color-danger-soft-bg);
  border-color: var(--color-danger-soft);
}

.classroom-btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-raised);
}

.classroom-name {
  font-weight: 600;
  letter-spacing: -0.01em;
}

.center-state {
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

.center-state h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.center-state p {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
}

.error-offset {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.classrooms-skeleton {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.letter-skel {
  background: var(--color-bg-surface-strong);
  border-radius: 18px;
  padding: 16px;
  border: 1px solid var(--color-border-soft);
  backdrop-filter: blur(10px);
}

.sk-letter,
.sk-pill {
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 25%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.sk-letter {
  height: 16px;
  width: 80px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.sk-classrooms {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sk-pill {
  width: 96px;
  height: 38px;
  border-radius: 14px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .classrooms-hero {
    padding: 18px 20px;
  }

  .traffic-panel {
    padding: 12px 14px;
  }

  .traffic-controls {
    flex-wrap: nowrap;
    align-items: center;
  }

  .period-stepper {
    justify-content: flex-end;
    flex: 0 0 auto;
  }

  .calendar-block {
    min-width: 0;
    flex: 1 1 auto;
  }

  .calendar-button {
    width: 100%;
    min-width: 0;
  }

  .classrooms-list {
    padding: 12px 14px 14px;
  }
}

@media (max-width: 360px) {
  .classrooms-hero p,
  .panel-copy p {
    font-size: 0.92rem;
  }

  .classrooms-list {
    padding: 10px;
  }

  .classroom-btn {
    width: 100%;
    min-width: unset;
  }
}
</style>
