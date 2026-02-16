<template>
  <div class="app">
    <Navigation />
    <main class="main-content">
      <div class="content-inner">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import Navigation from './components/Navigation.vue'
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
  font-family: sans-serif;
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
</style>
