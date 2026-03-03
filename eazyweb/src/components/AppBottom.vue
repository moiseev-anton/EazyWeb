<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const deferredPrompt = ref(null)
const isStandalone = ref(false)

const showInstallGuide = computed(() => !isStandalone.value)
const canInstall = computed(() => !isStandalone.value && !!deferredPrompt.value)

const checkStandaloneMode = () => {
  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}

const handleBeforeInstallPrompt = (event) => {
  event.preventDefault()
  deferredPrompt.value = event
}

const handleAppInstalled = () => {
  deferredPrompt.value = null
  isStandalone.value = true
}

const installApp = async () => {
  if (!deferredPrompt.value) return

  deferredPrompt.value.prompt()
  await deferredPrompt.value.userChoice
  deferredPrompt.value = null
  checkStandaloneMode()
}

onMounted(() => {
  checkStandaloneMode()
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<template>
  <div class="app-bottom">
    <section v-if="showInstallGuide" class="pwa-guide" aria-label="Установка мобильного приложения">
      <h3 class="pwa-guide-title">Установка мобильного приложения</h3>

      <div class="pwa-guide-columns">
        <div class="pwa-guide-column">
          <p class="pwa-guide-platform">
            <svg class="platform-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M16.36 1.6c.1 1.15-.32 2.27-.97 3.04-.72.86-1.9 1.5-3 1.41-.12-1.1.36-2.27 1.03-3.01.73-.82 1.96-1.43 2.94-1.44zM19.82 17.56c-.48 1.09-.7 1.58-1.31 2.58-.86 1.39-2.07 3.12-3.58 3.13-1.34.01-1.69-.87-3.5-.86-1.8.01-2.19.88-3.52.87-1.5-.02-2.65-1.58-3.52-2.97-2.43-3.89-2.69-8.44-1.19-10.73 1.07-1.63 2.77-2.58 4.37-2.58 1.63 0 2.66.89 4.01.89 1.31 0 2.1-.89 4-.89 1.43 0 2.95.78 4.02 2.12-3.54 1.94-2.97 7.01.22 8.44z"
                fill="currentColor"
              />
            </svg>
            iOS
          </p>
          <ul class="pwa-guide-list">
            <li>Откройте eazyclass.ru в браузере</li>
            <li>
              Поделиться
              <svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3v12m0-12l4 4m-4-4l-4 4M5 10.5v8a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5v-8"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
                <rect
                  x="4"
                  y="9"
                  width="16"
                  height="12"
                  rx="2.8"
                  ry="2.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
              </svg>
            </li>
            <li>
              Добавить на экран "Домой"
              <svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="3"
                  ry="3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M12 8v8m-4-4h8"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.8"
                />
              </svg>
              
            </li>
          </ul>
        </div>

        <div class="pwa-guide-column">
          <p class="pwa-guide-platform">
            <svg class="platform-icon android-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 8.4a5 5 0 0110 0v1.1H7z" fill="currentColor" />
              <rect x="6.2" y="9.4" width="11.6" height="8.4" rx="2.1" fill="currentColor" />
              <rect x="4.7" y="10" width="1.6" height="6.4" rx="0.8" fill="currentColor" />
              <rect x="17.7" y="10" width="1.6" height="6.4" rx="0.8" fill="currentColor" />
              <rect x="8.2" y="17.5" width="1.6" height="3.2" rx="0.8" fill="currentColor" />
              <rect x="14.2" y="17.5" width="1.6" height="3.2" rx="0.8" fill="currentColor" />
              <circle cx="9.8" cy="7.7" r="0.58" fill="#141922" />
              <circle cx="14.2" cy="7.7" r="0.58" fill="#141922" />
              <path d="M9 5.2L7.9 3.4m7.1 1.8L16.1 3.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.4" />
            </svg>
            Android
          </p>
          <ul class="pwa-guide-list">
            <li>Откройте eazyclass.ru в браузере</li>
            <li>Браузер предложит установку</li>
            <li v-if="canInstall">Или нажмите кнопку</li>
          </ul>
          <button v-if="canInstall" class="install-button" type="button" @click="installApp">
            Установить
          </button>
          <p class="install-note">В некоторых браузерах может не работать<br>Рекомендуется Chrome</p>
        </div>
      </div>
    </section>

    <div class="disclaimer">
      <p>Это учебный проект, поэтому возможны временные неточности или задержки в обновлении данных — всегда сверяйтесь с расписанием учебного заведения.</p>
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

.pwa-guide {
  width: min(100%, 780px);
  margin: 0 auto 4px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  box-sizing: border-box;
  container-type: inline-size;
  color: #cbd5e1;
  text-align: left;
}

.pwa-guide-title {
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #87cbc1;
  text-align: center;
}

.pwa-guide-columns {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  margin: 0 auto;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
}

@container (max-width: 488px) {
  .pwa-guide-columns {
    justify-content: flex-start;
  }

  .pwa-guide-title {
    text-align: left;
  }
}

.pwa-guide-column {
  min-width: 200px;
  max-width: 240px;
  flex: 0 1 320px;
}

.pwa-guide-platform {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  color: #cbd5e1;
}

.platform-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: #94a3b8;
}

.android-icon {
  transform: scale(1.1);
  transform-origin: center;
}

.pwa-guide-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  color: #94a3b8;
  font-size: 0.86rem;
  line-height: 1.5;
}

.pwa-guide-list li + li {
  margin-top: 4px;
}

.inline-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  margin-left: 3px;
  color: #cbd5e1;
}

.install-button {
  margin-top: 10px;
  border: 0;
  border-radius: 8px;
  padding: 8px 14px;
  background: #818cf8;
  color: #f8fafc;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.18s ease, opacity 0.18s ease, transform 0.18s ease;
}

.install-button:hover {
  background: #a5b4fc;
  transform: translateY(-1px);
}

.install-note {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.74rem;
  line-height: 1.4;
}

.disclaimer {
  width: min(100%, 780px);
  margin: 0 auto 6px;
  box-sizing: border-box;
  color: #a5b4fc;
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
