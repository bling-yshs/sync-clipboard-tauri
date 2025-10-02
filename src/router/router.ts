import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/home/home-index.vue'),
    },
    {
      path: '/upload-clipboard',
      name: 'upload-clipboard',
      component: () => import('@/views/upload-clipboard/upload-clipboard.vue'),
    },
    {
      path: '/download-clipboard',
      name: 'download-clipboard',
      component: () => import('@/views/download-clipboard/download-clipboard.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/settings.vue'),
    },
    {
      path: '/debug',
      name: 'debug',
      component: () => import('@/views/debug/debug.vue'),
    },
  ],
})

export default router
