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
import ScheduleDashboard from '../components/ScheduleDashboard.vue'
import FacultyAccordion from '../components/FacultyAccordion.vue'
import { useEntitySelection } from '../composables/entitySelection'

const { selectedEntity } = useEntitySelection('groups')

function selectGroup(group) {
  selectedEntity.value = { ...group, type: 'group' }
}

function handleOpenEntity(entity) {
  selectedEntity.value = { ...entity }
}
</script>

<style scoped>
.groups-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
  box-sizing: border-box;
}

.groups-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}
</style>
