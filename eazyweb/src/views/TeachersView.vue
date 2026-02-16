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
  gap: 12px;
  padding: 6px;
  background: transparent;
}

.teachers-hero {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(14, 116, 144, 0.2);
  background: #ffffff;
}

.teachers-hero h1 {
  margin: 0;
  font-size: 1.2rem;
  color: #0f172a;
}

.teachers-hero p {
  margin: 6px 0 0;
  color: #5b687a;
  font-size: 0.95rem;
}

.teachers-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 0;
}

.letter-section {
  border-radius: 16px;
  border: 1px solid #dbe7f2;
  background: #fff;
  overflow: hidden;
}

.letter-header {
  padding: 10px 14px;
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a;
  border-bottom: 1px solid #eaf1f8;
  background: #f8fafc;
}

.teachers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px 12px;
}

.teacher-btn {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d9e7f2;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: background 0.16s, transform 0.1s, border-color 0.16s;
  color: #1e293b;
  font-size: 0.9rem;
  min-width: 130px;
}

.teacher-btn:hover {
  background: #f2f5f9;
  border-color: #b8d9f2;
  transform: translateY(-1px);
}

.teacher-btn:active {
  transform: translateY(0);
}

.teacher-name {
  font-weight: 600;
}

.center-state {
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

.center-state h3 {
  margin: 0;
  color: #111827;
}

.center-state p {
  margin: 8px 0 0;
}

.error-offset {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.teachers-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.letter-skel {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid #e6edf5;
}

.sk-letter,
.sk-pill {
  background: #e7edf4;
  background-size: 200% 100%;
  animation: shimmer 1.1s linear infinite;
}

.sk-letter {
  height: 14px;
  width: 70px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.sk-teachers {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sk-pill {
  width: 128px;
  height: 34px;
  border-radius: 10px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .teachers-view {
    padding: 12px;
  }

  .teachers-hero {
    padding: 14px;
  }

  .teachers-list {
    padding: 9px 10px 10px;
  }

  .teacher-btn {
    min-width: 112px;
  }
}

@media (max-width: 360px) {
  .teachers-view {
    padding: 10px;
  }

  .teachers-hero p {
    font-size: 0.9rem;
  }

  .teachers-list {
    padding: 8px;
  }

  .teacher-btn {
    width: 100%;
  }
}
</style>
