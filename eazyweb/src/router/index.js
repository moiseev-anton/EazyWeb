import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'  // Создай store, если нет (пока mock в guard)

const routes = [
  { path: '/', redirect: '/schedule' },  // Главная → Расписание
  { path: '/schedule', name: 'schedule', component: () => import('../views/ScheduleView.vue'), meta: { requiresAuth: false } },
  { path: '/groups', name: 'groups', component: () => import('../views/GroupsView.vue'), meta: { requiresAuth: false } },
  { path: '/teachers', name: 'teachers', component: () => import('../views/TeachersView.vue'), meta: { requiresAuth: false } },
  { path: '/classrooms', name: 'classrooms', component: () => import('../views/ClassroomsView.vue'), meta: { requiresAuth: false } },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { requiresAuth: false } },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})


router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Защищённые роуты (например, /profile)
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/schedule')  // Pre-auth → лендинг с кнопкой входа
    return
  }

  next()
})

export default router
