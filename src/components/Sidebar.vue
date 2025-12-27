<template>
  <aside :class="['sidebar', { hidden: isHidden }]">
    <div class="logo-container">
      <img src="/logo-uleam.png" alt="Logo ULEAM">
      <span class="system-name">Parking ULEAM</span>
    </div>
    <nav>
      <ul class="sidebar-nav">
        <li v-if="hasPermission('dashboard')" :class="{ active: isActive('/dashboard') }">
          <router-link to="/dashboard">
            <span class="icon"></span>
            Dashboard
          </router-link>
        </li>
        <li v-if="hasPermission('registro-ingreso')" :class="{ active: isActive('/registro-ingreso') }">
          <router-link to="/registro-ingreso">
            <span class="icon"></span>
            Registrar Ingreso
          </router-link>
        </li>
        <li v-if="hasPermission('registro-salida')" :class="{ active: isActive('/registro-salida') }">
          <router-link to="/registro-salida">
            <span class="icon"></span>
            Registrar Salida
          </router-link>
        </li>
        <li v-if="hasPermission('consulta-ingresos')" :class="{ active: isActive('/consulta-ingresos') }">
          <router-link to="/consulta-ingresos">
            <span class="icon"></span>
            Consultar Ingresos
          </router-link>
        </li>
        <li v-if="hasPermission('vehiculos-registrados')" :class="{ active: isActive('/vehiculos-registrados') }">
          <router-link to="/vehiculos-registrados">
            <span class="icon"></span>
            Vehículos Registrados
          </router-link>
        </li>
        <li v-if="hasPermission('gestion-usuarios')" :class="{ active: isActive('/gestion-usuarios') }">
          <router-link to="/gestion-usuarios">
            <span class="icon"></span>
            Gestión de Usuarios
          </router-link>
        </li>
        <li v-if="hasPermission('reportes')" :class="{ active: isActive('/reportes') }">
          <router-link to="/reportes">
            <span class="icon"></span>
            Reportes
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

defineProps({
  isHidden: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const authStore = useAuthStore()

const hasPermission = (permission) => {
  return authStore.userPermissions.some(p => 
    p === permission || 
    p.startsWith(permission.split('-')[0]) ||
    permission.startsWith(p.split('-')[0])
  )
}

const isActive = (path) => {
  return route.path === path
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #408FDD 0%, #2E6FB8 100%);
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  padding: 25px 0;
  transition: transform 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sidebar.hidden {
  transform: translateX(-100%);
}

.logo-container {
  text-align: center;
  margin-bottom: 30px;
  padding: 0 20px;
}

.logo-container img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  background: white;
  padding: 5px;
}

.system-name {
  display: block;
  font-size: 1.1em;
  font-weight: 600;
  color: white;
}

.sidebar-nav {
  list-style: none;
  padding: 0 15px;
}

.sidebar-nav li {
  margin-bottom: 5px;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #f0f0f0;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 0.95em;
}

.sidebar-nav a:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.sidebar-nav li.active a {
  background-color: #D30F2A;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(211, 15, 42, 0.3);
}

.icon {
  margin-right: 10px;
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .sidebar {
    width: 250px;
  }
}
</style>