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
  background: var(--color-bg-surface-subtle);
  backdrop-filter: var(--surface-backdrop);
  -webkit-backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-card);
  color: var(--color-text-muted);
  text-align: center;
  min-height: 140px;
  justify-content: center;
}

.load-error-title {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--color-text-primary);
  line-height: 1.35;
}

.load-error-title span {
  color: var(--color-text-primary);
  font-weight: 500;
}

.load-error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-ghost {
  background: var(--color-accent-bg);
  border: 1px solid var(--color-border-strong);
  color: var(--color-accent);
  padding: 10px 18px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
}

.btn-ghost:hover {
  background: var(--color-accent-bg-strong);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--color-shadow);
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
