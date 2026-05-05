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
.load-error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px 20px;
  border-radius: 18px;
  background: rgba(30, 41, 59, 0.24);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
  color: #cbd5e1;
  text-align: center;
  min-height: 140px;
  justify-content: center;
}

.load-error-title {
  font-weight: 700;
  font-size: 1.15rem;
  color: #f1f5f9;
  line-height: 1.35;
}

.load-error-title span {
  color: #f1f5f9;
  font-weight: 500;
}

.load-error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-ghost {
  background: rgba(129, 140, 248, 0.18); /* #818cf8 прозрачный */
  border: 1px solid rgba(129, 140, 248, 0.35);
  color: #818cf8;
  padding: 10px 18px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
}

.btn-ghost:hover {
  background: rgba(129, 140, 248, 0.32);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(129, 140, 248, 0.2);
}

.btn-ghost:active {
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 640px) {
  .load-error-box {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .load-error-title {
    font-size: 1.05rem;
  }

  .btn-ghost {
    padding: 9px 16px;
    font-size: 0.92rem;
  }
}
</style>
