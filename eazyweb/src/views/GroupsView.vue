<template>

  <ScheduleDashboard v-if="selectedEntity" :entityId="selectedEntity.id" :entityType="'group'"
    :entityName="selectedEntity.name" :showBackButton="true" @back="selectedEntity = null" />

  <div v-else class="groups-view">
    <h2>Группы</h2>
    <!-- Твой аккордеон факультетов -->
    <div class="accordion">
      <button @click="toggleFaculty('it')">Факультет IT</button>
      <div v-if="openFaculty === 'it'">
        <button @click="selectGroup({ id: '101', name: 'Группа ИТ-101' })">Группа ИТ-101</button>
        <!-- Другие группы -->
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'

const selectedEntity = ref(null)
const openFaculty = ref(null)

function toggleFaculty(fac) {
  openFaculty.value = openFaculty.value === fac ? null : fac
}

function selectGroup(entity) {
  selectedEntity.value = entity
}
</script>

<style scoped>
.groups-view {
  padding: 20px;
}

.accordion-header {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  background: #f0f0f0;
}

.accordion-content {
  display: none;
}

/* Позже: v-show */
.course-divider {
  padding: 8px;
  font-weight: bold;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.group-btn {
  display: block;
  padding: 12px;
  text-decoration: none;
  border-bottom: 1px solid #eee;
}
</style>
