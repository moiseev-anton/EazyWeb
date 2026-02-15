<template>
  <div class="center-state load-error-box">
    <div class="load-error-title">Не удалось загрузить<span v-if="detail"> {{ detail }}</span></div>
    <div class="load-error-actions">
      <slot name="actions">
        <button class="btn-ghost" @click="$emit('retry')">Попробовать снова</button>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  detail: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['retry'])
</script>

<style scoped>
.load-error-box { display:flex; flex-direction:column; align-items:center; gap:10px; padding:16px }
.load-error-title { font-weight:600; color:#333; text-align:center }
.load-error-actions { display:flex; gap:8px }
.btn-ghost { background: transparent; border: 1px solid #27A7E7; color: #27A7E7; padding: 8px 12px; border-radius:8px; cursor:pointer }
.btn-ghost:hover { background: rgba(39,167,231,0.06) }
</style>
