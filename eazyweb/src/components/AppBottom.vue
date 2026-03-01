<template>
  <div class="app-bottom">
    <div class="disclaimer">
      <p>Это учебный проект, поэтому возможны временные неточности или задержки в обновлении данных.</p>
      <p>Актуальность и точность информации зависят от официальных источников колледжа — всегда сверяйтесь с расписанием учебного заведения.</p>
    </div>

    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">
          <p class="copyright">© 2026 Антон Моисеев • pet-проект</p>
          <p class="contact">
            По вопросам и предложениям: <a href="mailto:eazyclass@yandex.ru">eazyclass@yandex.ru</a>
          </p>
        </div>

        <div class="footer-links">
          <a href="https://eazyclass.ru/terms" target="_blank" rel="noopener noreferrer">Правила использования</a>
          <a href="https://eazyclass.ru/privacy" target="_blank" rel="noopener noreferrer">Политика конфиденциальности</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-bottom {
  margin-top: auto;
  padding: 24px 4px 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.disclaimer {
  width: min(100%, 780px);
  margin: 0 auto 6px;
  box-sizing: border-box;
  color: #94a3b8;
  font-size: 0.86rem;
  line-height: 1.5;
  text-align: left;
}

.disclaimer p {
  margin: 0;
}

.disclaimer p:last-child {
  margin-bottom: 0;
}

.app-footer {
  width: min(100%, 780px);
  margin: 0 auto;
  box-sizing: border-box;
  color: #64748b;
  font-size: 0.92rem;
  container-type: inline-size;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.copyright {
  margin: 0;
  font-weight: 500;
  color: #cbd5e1;
}

.contact {
  margin: 0;
}

.contact a {
  color: #818cf8;
  text-decoration: none;
  transition: color 0.18s ease;
}

.contact a:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

.footer-links {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px 14px;
  justify-content: flex-start;
  align-items: center;
  font-size: 0.8rem;
}

.footer-links a {
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.18s ease;
}

.footer-links a:hover {
  color: #cbd5e1;
  text-decoration: underline;
}

/* Когда контейнер уже достаточно широкий: ссылки вправо и строго в столбик */
@container (min-width: 700px) {
  .footer-content {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: flex-start;
    gap: 24px;
  }

  .footer-links {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-end;
    gap: 6px;
  }
}
</style>
