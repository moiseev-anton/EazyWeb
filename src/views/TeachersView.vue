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

  <div v-else class="teachers-view">
    <header class="teachers-hero">
      <h1>Преподаватели</h1>
      <p>Выберите преподавателя из списка, чтобы открыть его расписание.</p>
    </header>

    <div v-if="isLoading" class="teachers-skeleton" aria-busy="true">
      <div class="letter-skel" v-for="n in 5" :key="n">
        <div class="sk-letter"></div>
        <div class="sk-teachers">
          <span class="sk-pill" v-for="m in 6" :key="`${n}-${m}`"></span>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-offset">
      <LoadError :detail="' преподавателей'" @retry="load" />
    </div>

    <section v-else-if="groups.length === 0" class="center-state">
      <h3>Список преподавателей пуст</h3>
      <p>Данные появятся, когда они будут доступны на сервере.</p>
    </section>

    <div v-else class="teachers-container">
      <section v-for="group in groups" :key="group.letter" class="letter-section">
        <div class="letter-header">{{ group.letter }}</div>
        <div class="teachers-list">
          <button
            v-for="t in group.teachers"
            :key="t.id"
            class="teacher-btn"
            @click="selectTeacher({ id: t.id, name: t.shortName || t.fullName, endpoint: t.endpoint })"
          >
            <span class="teacher-name">{{ t.shortName || t.fullName }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import { fetchTeachers, groupTeachersByLetter } from '../api/teachersService'
import LoadError from '../components/LoadError.vue'
import { useEntitySelection } from '../composables/entitySelection'

const { selectedEntity } = useEntitySelection('teachers')
const isLoading = ref(false)
const error = ref(null)
const groups = ref([])

async function load() {
  isLoading.value = true
  error.value = null
  try {
    const data = await fetchTeachers()
    groups.value = groupTeachersByLetter(data)
  } catch (e) {
    console.error(e)
    error.value = e.message || 'Не удалось загрузить список преподавателей'
  } finally {
    isLoading.value = false
  }
}

function selectTeacher(entity) {
  selectedEntity.value = { ...entity, type: 'teacher' }
}

function handleOpenEntity(entity) {
  selectedEntity.value = { ...entity }
}

onMounted(() => load())
</script>

<style scoped>
.teachers-view {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* padding: 12px; */
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.teachers-view {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* padding: 12px; */
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.teachers-hero {
  padding: 20px 24px;
  border-radius: 20px;
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-surface);
}

.teachers-hero h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.02em;
}

.teachers-hero p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.96rem;
  line-height: 1.45;
}

.teachers-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px; /* для скроллбара */
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
  color: var(--color-accent-soft);
  background: var(--color-overlay-soft);
  border-bottom: 1px solid var(--color-border-soft);
}

.teachers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 16px 16px;
}

.teacher-btn {
  padding: 10px 16px;
  background: var(--color-bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.18s ease;
  color: var(--color-text-primary);
  font-size: 0.94rem;
  min-width: 138px;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-raised);
}

.teacher-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--color-backdrop);
}

.teacher-btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-raised);
}

.teacher-name {
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
  color: var(--color-text-inverse);
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

/* Skeleton ── сохраняем анимацию, но адаптируем под тёмную тему */
.teachers-skeleton {
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

.sk-teachers {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sk-pill {
  width: 136px;
  height: 38px;
  border-radius: 14px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Responsive ── слегка увеличены отступы для комфорта */
@media (max-width: 768px) {
  .teachers-hero {
    padding: 18px 20px;
  }

  .teachers-list {
    padding: 12px 14px 14px;
  }

  .teacher-btn {
    min-width: 120px;
  }
}

@media (max-width: 360px) {
  /* .teachers-view {
    padding: 10px;
  } */

  .teachers-hero p {
    font-size: 0.92rem;
  }

  .teachers-list {
    padding: 10px;
  }

  .teacher-btn {
    width: 100%;
    min-width: unset;
  }
}

/* Shared token-based overrides for the teachers directory */
.teachers-view {
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.teachers-hero,
.letter-section,
.center-state,
.teacher-btn {
  background: var(--color-bg-surface-subtle);
  border-color: var(--color-border-soft);
  color: var(--color-text-primary);
}

.teachers-hero,
.letter-section,
.center-state {
  box-shadow: var(--shadow-surface);
}

.teachers-hero h1 {
  color: var(--color-accent);
}

.teachers-hero p,
.center-state p,
.teacher-btn {
  color: var(--color-text-secondary);
}

.letter-header {
  color: var(--color-accent-soft);
  background: var(--color-overlay-soft);
  border-bottom-color: var(--color-border-soft);
}

.teacher-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.letter-skel,
.sk-letter,
.sk-pill {
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 25%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton-base) 75%
  );
}
</style>
