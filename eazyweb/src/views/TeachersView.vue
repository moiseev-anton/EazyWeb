<template>

  <ScheduleDashboard v-if="selectedEntity" :entityId="selectedEntity.id" :entityType="'group'"
    :entityName="selectedEntity.name" :showBackButton="true" @back="selectedEntity = null" />

  <div v-else class="teachers-view">
    <h2>Преподаватели</h2>
    <p>Алфавит: Буквы → Преподаватели (шаг 4).</p>
    <div class="accordion">
      <button class="accordion-header">А (клик → раскрыть)</button>
      <div class="accordion-content">
        <button @click="selectTeacher({ id: '101', name: 'Абрамов А.А.' })">Абрамов А.А.</button>
        <button @click="selectTeacher({ id: '102', name: 'Ахметов Б.Б.' })">Ахметов Б.Б.</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'

const selectedEntity = ref(null)

function selectTeacher(entity) {
  selectedEntity.value = entity
}
</script>

<style scoped>
/* Аналогично Groups */
.teachers-view {
  padding: 20px;
}

.teacher-btn {
  display: block;
  padding: 12px;
  text-decoration: none;
  border-bottom: 1px solid #eee;
}
</style>