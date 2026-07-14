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
  background: var(--color-bg-surface-subtle);
  backdrop-filter: var(--surface-backdrop);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-modal);
}

.code {
  margin: 0 0 10px;
  font-size: 3rem;
  line-height: 1;
  font-weight: 800;
  color: var(--color-accent);
}

h1 {
  margin: 0 0 10px;
  font-size: 1.55rem;
  color: var(--color-text-primary);
}

.desc {
  margin: 0 0 20px;
  color: var(--color-text-secondary);
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
  color: var(--color-bg-canvas);
  background: var(--color-accent);
}

.primary-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--color-shadow);
}

.ghost-link {
  color: var(--color-text-muted);
  background: var(--color-bg-surface-strong);
  border: 1px solid var(--color-border-soft);
}

.ghost-link:hover {
  background: var(--color-bg-hover);
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
