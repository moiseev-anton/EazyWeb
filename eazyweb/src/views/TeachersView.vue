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
    <h2>Преподаватели</h2>

    <div v-if="isLoading" class="center-state">Загрузка преподавателей...</div>
    <div v-else-if="error" class="center-state error">Ошибка: {{ error }}</div>
    <div v-else-if="groups.length === 0" class="center-state">На данный момент нет данных о преподавателях</div>

    <div v-else class="teachers-container">
      <div v-for="group in groups" :key="group.letter" class="letter-section">
        <div class="letter-header">{{ group.letter }}</div>
        <div class="groups-list">
          <button
            v-for="t in group.teachers"
            :key="t.id"
            class="group-btn"
            @click="selectTeacher({ id: t.id, name: t.shortName || t.fullName, endpoint: t.endpoint })"
          >
            <span class="group-title">{{ t.shortName || t.fullName }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import { fetchTeachers, groupTeachersByLetter } from '../api/teachersService'

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
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 12px;
}

.center-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #666;
}

.center-state.error {
  color: #c0392b;
}

.teachers-container {
  overflow-y: auto;
  padding: 4px 0 12px 0;
}

.letter-section {
  margin-bottom: 12px;
}

.letter-header {
  font-weight: 600;
  color: #666;
  padding: 6px 8px;
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 8px 0 8px;
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
  transition: background 0.12s, transform 0.08s, box-shadow 0.12s;
  color: #222;
  font-size: 14px;
  min-width: 120px;
  flex: 0 1 auto;
}

.group-btn:hover { background:#f7fbff; transform:translateY(-2px); box-shadow:0 6px 18px rgba(20,40,80,0.06); }

.group-title { font-weight:600 }

@media (max-width:480px){
  .letter-header{ padding:4px 6px; font-size:14px }
  .group-btn{ min-width:100px; font-size:13px }
}
</style>