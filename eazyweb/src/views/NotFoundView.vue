<template>
  <section class="not-found">
    <div class="not-found-card">
      <p class="code">404</p>
      <h1>Страница не найдена</h1>
      <p class="desc">Похоже, вы перешли по несуществующему адресу.</p>

      <div class="actions">
        <router-link to="/schedule" class="primary-link">На главную</router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  min-height: calc(100dvh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-card {
  width: min(100%, 560px);
  text-align: center;
  padding: 32px 24px;
  border-radius: 20px;
  background: rgba(30, 41, 59, 0.28);
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.38);
}

.code {
  margin: 0 0 10px;
  font-size: 3rem;
  line-height: 1;
  font-weight: 800;
  color: #818cf8;
}

h1 {
  margin: 0 0 10px;
  font-size: 1.55rem;
  color: #e2e8f0;
}

.desc {
  margin: 0 0 20px;
  color: #94a3b8;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.primary-link,
.ghost-link {
  text-decoration: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.primary-link {
  color: #0f1117;
  background: #818cf8;
}

.primary-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(129, 140, 248, 0.3);
}

.ghost-link {
  color: #cbd5e1;
  background: rgba(51, 65, 85, 0.28);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.ghost-link:hover {
  background: rgba(51, 65, 85, 0.42);
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .not-found-card {
    padding: 24px 18px;
  }

  .code {
    font-size: 2.5rem;
  }

  h1 {
    font-size: 1.35rem;
  }
}
</style>
