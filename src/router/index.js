import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useSuperAdminStore } from '../stores/superAdmin.js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/ambulance/:id',
    name: 'AmbulanceDetail',
    component: () => import('../views/AmbulanceDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ambulance/:id/inventory',
    name: 'Inventory',
    component: () => import('../views/Inventory.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ambulance/:id/usage',
    name: 'Usage',
    component: () => import('../views/Usage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ambulance/:id/settings',
    name: 'AmbulanceSettings',
    component: () => import('../views/AmbulanceSettings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/join/:id',
    name: 'JoinAmbulance',
    component: () => import('../views/JoinAmbulance.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/super-admin',
    name: 'SuperAdminDashboard',
    component: () => import('../views/SuperAdminDashboard.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  }
]

const router = createRouter({
  history: process.env.NODE_ENV === 'production' ? createWebHashHistory() : createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
  } else if (to.meta.requiresSuperAdmin) {
    // Check super admin access
    const superAdminStore = useSuperAdminStore()
    if (!superAdminStore.isSuperAdmin) {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router