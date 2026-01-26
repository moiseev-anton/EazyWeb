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

  <div v-else class="groups-view">
    <div class="groups-container">
      <FacultyAccordion @group-selected="selectGroup" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import FacultyAccordion from '../components/FacultyAccordion.vue'


const selectedEntity = ref(null)

function selectGroup(group) {
  selectedEntity.value = { ...group, type: 'group' }
}

function handleOpenEntity(entity) {
  // open other entity (teacher or group) in the same view
  selectedEntity.value = { ...entity }
}
</script>

<style scoped>
.groups-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #fff;
}

.groups-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}
</style>
