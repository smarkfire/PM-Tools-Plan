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
      meta: { title: '项目信息管理' }
    },
    {
      path: '/project-plan',
      name: 'project-plan',
      component: () => import('@/views/ProjectPlanView.vue'),
      meta: { title: '项目计划管理' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - PLAN-Tools` : 'PLAN-Tools'
  next()
})

export default router
