import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/project-info'
    },
    {
      path: '/project-info',
      name: 'project-info',
      component: () => import('@/views/ProjectInfoView.vue'),
      meta: { titleKey: 'app.nav.projectInfo' }
    },
    {
      path: '/project-plan',
      name: 'project-plan',
      component: () => import('@/views/ProjectPlanView.vue'),
      meta: { titleKey: 'app.nav.projectPlan' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  // Note: i18n translations are handled by App.vue's watch effect
  // Default fallback title
  document.title = 'PLAN-Tools - Project Management Tool'
  next()
})

export default router
