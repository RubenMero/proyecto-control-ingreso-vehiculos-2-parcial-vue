<template>
  <div class="main-wrapper">
    <Sidebar :isHidden="sidebarHidden" />
    <div :class="['content-area', { 'full-width': sidebarHidden }]">
      <Topbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />
      <main class="container">
        <h2>Consulta - Historial de Ingresos</h2>

        <div class="section-card">
          <h3>Filtros de Búsqueda</h3>
          <div class="filter-controls">
            <div class="form-group">
              <label for="searchPlaca">Placa</label>
              <input
                v-model="filtros.placa"
                type="text"
                id="searchPlaca"
                placeholder="ABC-1234"
                style="text-transform: uppercase"
              >
            </div>
            <div class="form-group">
              <label for="searchFecha">Fecha</label>
              <input v-model="filtros.fecha" type="date" id="searchFecha">
            </div>
            <div class="filter-actions">
              <button class="btn btn-primary" @click="buscar">Buscar</button>
              <button class="btn btn-secondary" @click="limpiar">Limpiar</button>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="data-header">
            <h3>Resultados de la Consulta</h3>
            <div v-if="!isGuardia" class="export-buttons">
              <button class="btn btn-success" @click="exportar('excel')">Exportar Excel</button>
              <button class="btn btn-secondary" @click="exportar('pdf')">Exportar PDF</button>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID Reg.</th>
                <th>Placa</th>
                <th>Tipo Vehículo</th>
                <th>ID Conductor</th>
                <th>Tipo Usuario</th>
                <th>Hora Ingreso</th>
                <th>Estado</th>
                <th v-if="!isGuardia">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ingresosFiltrados.length === 0">
                <td :colspan="isGuardia ? 7 : 8">No se encontraron registros</td>
              </tr>
              <tr v-for="ingreso in ingresosFiltrados" :key="ingreso.id">
                <td>{{ ingreso.id }}</td>
                <td>{{ ingreso.placa }}</td>
                <td>{{ ingreso.tipoVehiculo }}</td>
                <td>{{ ingreso.idConductor }}</td>
                <td><strong>{{ ingreso.tipoUsuario }}</strong></td>
                <td>{{ formatDate(ingreso.ingresoTimestamp) }}</td>
                <td>
                  <span :class="['badge', ingreso.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger']">
                    {{ ingreso.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td v-if="!isGuardia">
                  <button class="btn btn-sm btn-secondary" @click="editar(ingreso.id)">
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const authStore = useAuthStore()
const sidebarHidden = ref(false)

const filtros = ref({
  placa: '',
  fecha: ''
})

const isGuardia = computed(() => authStore.userRole === 'GUARDIA')

const ingresosFiltrados = ref([])

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const buscar = () => {
  let ingresos = JSON.parse(localStorage.getItem('ingresos') || '[]')

  // RBAC: Guardia solo ve últimos 7 días
  if (isGuardia.value) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    ingresos = ingresos.filter(i => new Date(i.ingresoTimestamp) >= sevenDaysAgo)
  }

  // Filtrar por fecha
  if (filtros.value.fecha) {
    ingresos = ingresos.filter(i => i.fechaIngreso === filtros.value.fecha)
  }

  // Filtrar por placa
  if (filtros.value.placa) {
    const placaBuscar = filtros.value.placa.trim().toUpperCase()
    ingresos = ingresos.filter(i => i.placa.includes(placaBuscar))
  }

  ingresosFiltrados.value = ingresos
  authStore.showNotification(`Se encontraron ${ingresos.length} registros`, 'success')
}

const limpiar = () => {
  filtros.value = { placa: '', fecha: '' }
  buscar()
}

const editar = (id) => {
  authStore.showNotification(`Simulando edición del registro ID: ${id}`, 'warning')
}

const exportar = (tipo) => {
  authStore.showNotification(`Generando y descargando ${tipo.toUpperCase()}...`, 'success')
}

onMounted(() => {
  buscar()
})
</script>

<style scoped>
.main-wrapper {
  display: flex;
  min-height: 100vh;
}

.content-area {
  margin-left: 250px;
  flex-grow: 1;
  transition: margin-left 0.3s ease;
}

.content-area.full-width {
  margin-left: 0;
}

.container {
  padding: 20px;
}

h2 {
  color: #D30F2A;
  margin-bottom: 20px;
  border-bottom: 2px solid #131212;
  padding-bottom: 10px;
}

.section-card {
  background-color: white;
  padding: 25px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

h3 {
  color: #D30F2A;
  margin-bottom: 15px;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  align-items: end;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.export-buttons {
  display: flex;
  gap: 10px;
}
</style>