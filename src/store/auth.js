import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  SUPERVISOR: 'SUPERVISOR',
  GUARDIA: 'GUARDIA'
}

const PERMISSIONS = {
  [ROLES.ADMINISTRADOR]: [
    'dashboard', 'registro-ingreso', 'registro-salida', 'consulta-ingresos',
    'gestion-usuarios', 'reportes', 'vehiculos-registrados-r',
    'vehiculos-registrados-rw', 'vehiculos-full'
  ],
  [ROLES.SUPERVISOR]: [
    'dashboard', 'registro-ingreso', 'registro-salida', 'consulta-ingresos-full',
    'gestion-usuarios-full', 'reportes-full', 'vehiculos-registrados-r', 'vehiculos-rw'
  ],
  [ROLES.GUARDIA]: [
    'dashboard', 'registro-ingreso', 'registro-salida', 'consulta-ingresos-limitado',
    'reportes-limitado', 'vehiculos-registrados-r'
  ]
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const notification = ref({ show: false, message: '', type: 'success' })

  const isAuthenticated = computed(() => !!currentUser.value)
  const userRole = computed(() => currentUser.value?.role || '')
  const userPermissions = computed(() => currentUser.value?.permissions || [])

  // Inicializar datos
  const initializeData = () => {
    const users = [
      { id: 1, cedula: '1310000000', nombre: 'Admin ULEAM', email: 'admin@uleam.edu.ec', 
        usuario: 'admin', password: 'admin12345', rol: ROLES.ADMINISTRADOR, estado: 'Activo', lastLogin: null },
      { id: 2, cedula: '1310000001', nombre: 'Guardia Principal', email: 'guardia@uleam.edu.ec',
        usuario: 'guardia', password: 'guardia12345', rol: ROLES.GUARDIA, estado: 'Activo', lastLogin: null },
      { id: 3, cedula: '1310000002', nombre: 'Supervisor Turno', email: 'supervisor@uleam.edu.ec',
        usuario: 'supervisor', password: 'supervisor12345', rol: ROLES.SUPERVISOR, estado: 'Activo', lastLogin: null }
    ]

    const vehiculos = [
      { id: 1, placa: 'MAB-0001', propietario: 'Admin ULEAM', idConductor: '1310000000',
        tipoUsuario: 'Docente', tipoVehiculo: 'Auto', estado: 'Autorizado' },
      { id: 2, placa: 'PTE-1234', propietario: 'Supervisor ULEAM', idConductor: '1310000002',
        tipoUsuario: 'Administrativo', tipoVehiculo: 'Camioneta', estado: 'Autorizado' }
    ]

    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify(users))
    }
    if (!localStorage.getItem('vehiculos')) {
      localStorage.setItem('vehiculos', JSON.stringify(vehiculos))
    }
    if (!localStorage.getItem('ingresos')) {
      localStorage.setItem('ingresos', JSON.stringify([]))
    }
    if (!localStorage.getItem('MAX_CAPACITY')) {
      localStorage.setItem('MAX_CAPACITY', '500')
    }
  }

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => 
      (u.usuario === username || u.email === username) && 
      u.password === password && 
      u.estado === 'Activo'
    )

    if (user) {
      user.lastLogin = new Date().toLocaleString()
      const updatedUsers = users.map(u => u.id === user.id ? user : u)
      localStorage.setItem('users', JSON.stringify(updatedUsers))

      const sessionData = {
        userId: user.id,
        username: user.nombre,
        role: user.rol,
        permissions: PERMISSIONS[user.rol] || [],
        lastLogin: user.lastLogin,
        timestamp: Date.now()
      }

      localStorage.setItem('currentSession', JSON.stringify(sessionData))
      currentUser.value = sessionData
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('currentSession')
    currentUser.value = null
  }

  const checkSession = () => {
    const session = localStorage.getItem('currentSession')
    if (session) {
      currentUser.value = JSON.parse(session)
      return true
    }
    return false
  }

  const hasPermission = (permission) => {
    if (!currentUser.value) return false
    return userPermissions.value.some(p => 
      p === permission || 
      p.startsWith(permission.split('-')[0]) ||
      permission.startsWith(p.split('-')[0])
    )
  }

  const showNotification = (message, type = 'success', duration = 3000) => {
    notification.value = { show: true, message, type }
    setTimeout(() => {
      notification.value.show = false
    }, duration)
  }

  // Inicializar al crear el store
  initializeData()

  return {
    currentUser,
    notification,
    isAuthenticated,
    userRole,
    userPermissions,
    login,
    logout,
    checkSession,
    hasPermission,
    showNotification
  }
})