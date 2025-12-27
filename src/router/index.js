import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true, permission: 'dashboard' }
  },
  {
    path: '/registro-ingreso',
    name: 'RegistroIngreso',
    component: () => import('@/views/RegistroIngreso.vue'),
    meta: { requiresAuth: true, permission: 'registro-ingreso' }
  },
  {
    path: '/registro-salida',
    name: 'RegistroSalida',
    component: () => import('@/views/RegistroSalida.vue'),
    meta: { requiresAuth: true, permission: 'registro-salida' }
  },
  {
    path: '/consulta-ingresos',
    name: 'ConsultaIngresos',
    component: () => import('@/views/ConsultaIngresos.vue'),
    meta: { requiresAuth: true, permission: 'consulta-ingresos' }
  },
  {
    path: '/vehiculos-registrados',
    name: 'VehiculosRegistrados',
    component: () => import('@/views/VehiculosRegistrados.vue'),
    meta: { requiresAuth: true, permission: 'vehiculos-registrados' }
  },
  {
    path: '/gestion-usuarios',
    name: 'GestionUsuarios',
    component: () => import('@/views/GestionUsuarios.vue'),
    meta: { requiresAuth: true, permission: 'gestion-usuarios' }
  },
  {
    path: '/reportes',
    name: 'Reportes',
    component: () => import('@/views/Reportes.vue'),
    meta: { requiresAuth: true, permission: 'reportes' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    authStore.checkSession()
  }

  const requiresAuth = to.meta.requiresAuth
  const permission = to.meta.permission

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  if (permission && authStore.isAuthenticated) {
    if (!authStore.hasPermission(permission)) {
      authStore.showNotification(`Acceso denegado. No tiene permiso para: ${permission}`, 'error')
      next('/dashboard')
      return
    }
  }

  next()
})

export default router