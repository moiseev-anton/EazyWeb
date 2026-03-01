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

const selectedEntity = ref(null)
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
  background: linear-gradient(135deg, #0f1117 0%, #171b26 100%);
  color: #e2e8f0;
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
  background: linear-gradient(135deg, #0f1117 0%, #171b26 100%);
  color: #e2e8f0;
}

.teachers-hero {
  padding: 20px 24px;
  border-radius: 20px;
  background: rgba(30, 41, 59, 0.28);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(100, 116, 139, 0.22);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.38);
}

.teachers-hero h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #818cf8;
  letter-spacing: -0.02em;
}

.teachers-hero p {
  margin: 8px 0 0;
  color: #94a3b8;
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
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
}

.letter-header {
  padding: 12px 18px;
  font-weight: 700;
  font-size: 1.05rem;
  color: #87cbc1;
  background: rgba(15, 23, 42, 0.35);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.teachers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 16px 16px;
}

.teacher-btn {
  padding: 10px 16px;
  background: rgba(51, 65, 85, 0.28);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.18s ease;
  color: #e2e8f0;
  font-size: 0.94rem;
  min-width: 138px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.teacher-btn:hover {
  background: rgba(51, 65, 85, 0.42);
  border-color: rgba(148, 163, 184, 0.32);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.teacher-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
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
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
  padding: 32px 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
}

.center-state h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.25rem;
  font-weight: 600;
}

.center-state p {
  margin: 10px 0 0;
  color: #94a3b8;
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
  background: rgba(30, 41, 59, 0.32);
  border-radius: 18px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(10px);
}

.sk-letter,
.sk-pill {
  background: linear-gradient(
    90deg,
    rgba(71, 85, 105, 0.4) 25%,
    rgba(100, 116, 139, 0.6) 50%,
    rgba(71, 85, 105, 0.4) 75%
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
</style>
