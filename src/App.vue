<template>
  <div class="app">
    <template v-if="isBooting">
      <nav class="boot-nav-mobile" aria-hidden="true">
        <div v-for="n in 4" :key="`mob-${n}`" class="boot-nav-item">
          <div class="boot-sk boot-sk-icon" />
          <div class="boot-sk boot-sk-label" />
        </div>
      </nav>

      <aside class="boot-nav-desktop" aria-hidden="true">
        <div class="boot-logo">EazyClass</div>
        <div class="boot-sidebar">
          <div v-for="n in 3" :key="`side-${n}`" class="boot-sidebar-item">
            <div class="boot-sk boot-sk-side-icon" />
            <div class="boot-sk boot-sk-side-line" />
          </div>
        </div>
        <div class="boot-sidebar-profile">
          <div class="boot-sidebar-item">
            <div class="boot-sk boot-sk-side-icon" />
            <div class="boot-sk boot-sk-side-line" />
          </div>
        </div>
      </aside>

      <main class="main-content">
        <div class="content-inner">
          <section class="boot-content" aria-hidden="true">
            <div class="boot-sk boot-title-line" />
            <div class="boot-cards">
              <article v-for="n in 5" :key="`card-${n}`" class="boot-card">
                <div class="boot-sk boot-card-head" />
                <div class="boot-sk boot-card-line" />
                <div class="boot-sk boot-card-line short" />
              </article>
            </div>
          </section>
        </div>
      </main>
    </template>

    <template v-else>
      <Navigation />
      <main class="main-content">
        <div class="content-inner">
          <router-view />
        </div>
      </main>
    </template>

    <div v-if="errorOverlayVisible" class="boot-overlay">
  <div class="boot-modal-card animate-fade-in">
    <div class="brand-mark">EazyClass</div>

    <template v-if="bootStatus === 'network_error'">
      <div class="error-title">Нет соединения с сервером</div>
      <div class="error-sub">Проверьте интернет-соединение и попробуйте ещё раз.</div>
      <button class="retry-btn" @click="retry">Повторить попытку</button>
    </template>

    <template v-else-if="bootStatus === 'server_error'">
      <div class="error-title">Ошибка сервера</div>
      <div class="error-sub">Что-то пошло не так. Сервис временно недоступен — вернитесь позже.</div>
      <button class="retry-btn" @click="retry">Повторить</button>
    </template>

    <template v-else-if="bootStatus === 'twa_invalid'">
      <div class="error-title">Сессия истекла</div>
      <div class="error-sub">
        Закройте приложение полностью<br>и откройте заново через меню бота.
      </div>
    </template>
  </div>
</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Navigation from './components/Navigation.vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const bootStatus = computed(() => auth.bootStatus)
const isBooting = computed(() => bootStatus.value === 'booting')
const errorOverlayVisible = computed(() => ['network_error', 'server_error', 'twa_invalid'].includes(bootStatus.value))

function retry() {
  auth.init()
}
</script>

<style>
html,
body {
  min-height: 100%;
  background: var(--color-bg-canvas);
}

#app {
  min-height: 100%;
  background: var(--color-bg-app);
}

body {
  margin: 0;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color: var(--color-text-primary);
  background: var(--color-bg-app);
  min-height: 100svh;
  min-height: 100dvh;
  overscroll-behavior-y: none;
}

.app {
  min-height: 100svh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-content {
  flex: 1;
  margin-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); /* место под bottom-nav + safe area */
  display: flex;
  justify-content: flex-start;
}

.content-inner {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 12px;
}



@media (max-width: 480px) {
  .content-inner {
    padding: 6px;
  }
}

@media (min-width: 768px) {
  .app {
    margin-left: 260px;
    margin-bottom: 0;
  }

  .main-content {
    margin-bottom: 0;
  }
}

@media (min-width: 1018px) {
  .main-content {
    justify-content: center;
  }
}

/* Boot / Loading состояние */
.boot-nav-mobile {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  height: 68px;
  background: var(--color-overlay);
  backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  border-radius: 28px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  margin: 0 auto;
  max-width: 420px;
  padding: 0 8px;
}

.boot-nav-item {
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.boot-nav-desktop {
  display: none;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: var(--color-bg-app);
  border-right: 1px solid var(--color-border);
  z-index: 1000;
}

@media (max-width: 767px) {
  .boot-nav-desktop {
    display: none;
  }
}

@media (min-width: 768px) {
  .boot-nav-mobile {
    display: none;
  }

  .boot-nav-desktop {
    display: flex;
    flex-direction: column;
  }
}

.boot-logo {
  padding: 24px 20px;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.5px;
  border-bottom: 1px solid var(--color-border-soft);
}

.boot-sidebar {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.boot-sidebar-profile {
  padding: 16px 12px 24px;
  border-top: 1px solid var(--color-border-soft);
}

.boot-sidebar-item {
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 14px;
}

.boot-content {
  padding: 16px;
}

.boot-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.boot-card {
  background: var(--color-bg-surface);
  backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
}

.boot-sk {
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 25%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
  border-radius: 10px;
}

.boot-sk-icon,
.boot-sk-side-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.boot-sk-label,
.boot-sk-side-line {
  width: 80px;
  height: 12px;
  border-radius: 8px;
}

.boot-title-line {
  width: 240px;
  height: 20px;
  margin-bottom: 16px;
}

.boot-card-head {
  width: 180px;
  height: 16px;
  margin-bottom: 12px;
}

.boot-card-line {
  width: 100%;
  height: 12px;
  margin-bottom: 10px;
}

.boot-card-line.short {
  width: 70%;
}

/* Boot Overlay (ошибки) */
.boot-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-backdrop-modal);
  backdrop-filter: blur(8px);
  z-index: 9999;
  padding: 20px;
  animation: fadeInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.boot-modal-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-surface);
  backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border);
  padding: 28px 24px;
  border-radius: 20px;
  box-shadow: var(--shadow-surface);
  text-align: center;
  color: var(--color-text-primary);
}

.brand-mark {
  margin: 0 auto 20px;
  width: fit-content;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--color-accent-bg);
  color: var(--color-accent);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
}


.error-title {
  font-weight: 700;
  font-size: 1.35rem;
  margin-bottom: 12px;
}

.error-sub {
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.retry-btn {
  background: var(--color-accent);
  color: var(--color-bg-canvas);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 0.98rem;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: var(--shadow-accent);
  min-width: 160px;
  margin-top: 1.5rem;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent-hover);
}

/* Анимация шиммера */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
