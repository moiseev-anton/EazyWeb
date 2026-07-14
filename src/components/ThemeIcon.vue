<template>
  <svg v-if="theme === 'system'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="var(--color-theme-icon-light)" />
    <path d="M12 3a9 9 0 0 1 0 18V3Z" fill="var(--color-theme-icon-dark)" />
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
  </svg>
  <MoonIcon v-else-if="theme === 'dark'" aria-hidden="true" />
  <SunIcon v-else aria-hidden="true" />
</template>

<script setup>
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'

defineProps({
  theme: {
    type: String,
    required: true,
  },
})
</script>