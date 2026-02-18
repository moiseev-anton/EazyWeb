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
      <div class="boot-modal-card">
        <div class="brand-mark">EazyClass</div>

        <template v-if="bootStatus === 'network_error'">
          <div class="status-dot status-dot--warn" />
          <div class="error-title">Нет соединения с сервером</div>
          <div class="error-sub">Проверьте интернет и попробуйте еще раз.</div>
          <button class="retry-btn" @click="retry">Повторить</button>
        </template>

        <template v-else-if="bootStatus === 'server_error'">
          <div class="status-dot status-dot--danger" />
          <div class="error-title">Ошибка на сервере</div>
          <div class="error-sub">Сервис временно недоступен. Попробуйте позже.</div>
          <button class="retry-btn" @click="retry">Повторить</button>
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
const errorOverlayVisible = computed(() => ['network_error', 'server_error'].includes(bootStatus.value))

function retry() {
  auth.init()
}
</script>

<style>
:root {
  --bg-app: #f6f8fb;
  --bg-surface: #ffffff;
  --bg-muted: #f2f5f9;
  --border: #dbe3ec;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --accent: #0284c7;
  --danger: #dc2626;
}

body {
  margin: 0;
  font-family: "Segoe UI", "Inter", "Roboto", sans-serif;
  color: var(--text-main);
  background: var(--bg-app);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-content {
  flex: 1;
  margin-bottom: 60px;
  display: flex;
  justify-content: flex-start;
  background: var(--bg-app);
}

@media (min-width: 768px) {
  .app {
    margin-left: 250px;
    margin-bottom: 0;
  }

  .main-content {
    margin-bottom: 0;
  }

  .content-inner {
    width: 100%;
    max-width: 768px;
  }
}

@media (min-width: 1018px) {
  .main-content {
    justify-content: center;
  }
}

.content-inner {
  width: 100%;
}

.boot-nav-mobile {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 62px;
  background: #ffffff;
  border-top: 1px solid #e5eaf1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
}

.boot-nav-item {
  width: 78px;
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
  width: 250px;
  background: #f9fafb;
  border-right: 1px solid #e8edf3;
  z-index: 1000;
}

.boot-logo {
  padding: 20px;
  font-size: 1.6rem;
  font-weight: 700;
  color: #27a7e7;
  letter-spacing: -0.5px;
  border-bottom: 1px solid #e8edf3;
}

.boot-sidebar {
  flex: 1;
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.boot-sidebar-profile {
  padding: 0 14px 20px;
  border-top: 1px solid #e8edf3;
}

.boot-sidebar-item {
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
}

.boot-content {
  padding: 16px;
}

.boot-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.boot-card {
  background: #ffffff;
  border: 1px solid #e0e8f1;
  border-radius: 12px;
  padding: 12px;
}

.boot-sk {
  background: linear-gradient(90deg, #e5edf6 25%, #f3f7fc 50%, #e5edf6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
  border-radius: 8px;
}

.boot-sk-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
}

.boot-sk-label {
  width: 48px;
  height: 8px;
  border-radius: 6px;
}

.boot-sk-side-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
}

.boot-sk-side-line {
  width: 110px;
  height: 12px;
}

.boot-title-line {
  width: 210px;
  height: 18px;
  margin-bottom: 14px;
}

.boot-card-head {
  width: 160px;
  height: 14px;
  margin-bottom: 10px;
}

.boot-card-line {
  width: 100%;
  height: 10px;
  margin-bottom: 8px;
}

.boot-card-line.short {
  width: 72%;
  margin-bottom: 0;
}

@media (min-width: 768px) {
  .boot-nav-mobile {
    display: none;
  }

  .boot-nav-desktop {
    display: flex;
    flex-direction: column;
  }

  .boot-content {
    padding: 20px;
  }
}

.boot-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(1000px 600px at 10% 0%, rgba(2, 132, 199, 0.2), transparent),
    radial-gradient(800px 500px at 90% 100%, rgba(14, 165, 233, 0.16), transparent),
    rgba(9, 17, 32, 0.72);
  backdrop-filter: blur(6px);
  z-index: 9999;
  padding: 20px;
}

.boot-modal-card {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fcff 100%);
  border: 1px solid #d9e7f5;
  padding: 26px 22px;
  border-radius: 18px;
  box-shadow: 0 22px 70px rgba(2, 23, 44, 0.35);
  text-align: center;
}

.brand-mark {
  margin: 0 auto 18px;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e9f6ff;
  color: #0c4a6e;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin: 0 auto 14px;
}

.status-dot--warn {
  background: #f59e0b;
  box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.18);
}

.status-dot--danger {
  background: #ef4444;
  box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.16);
}

.error-title {
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 8px;
  color: #0b2942;
}

.error-sub {
  color: var(--text-muted);
  margin-bottom: 16px;
  font-size: 14px;
}

.retry-btn {
  border: none;
  border-radius: 10px;
  background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(3, 105, 161, 0.28);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.retry-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(3, 105, 161, 0.36);
}

.retry-btn:active {
  transform: translateY(0);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
