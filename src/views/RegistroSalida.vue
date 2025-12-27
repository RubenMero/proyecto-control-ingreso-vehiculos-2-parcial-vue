<template>
  <div class="main-wrapper">
    <Sidebar :isHidden="sidebarHidden" />
    <div :class="['content-area', { 'full-width': sidebarHidden }]">
      <Topbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />
      <main class="container">
        <h2>Registro de Salida de Vehículo</h2>

        <div class="section-card">
          <h3>Buscar Vehículo por Placa</h3>
          <div class="search-form">
            <input
              v-model="buscarPlaca"
              type="text"
              maxlength="8"
              placeholder="Ingrese la Placa (ABC-1234)"
              style="text-transform: uppercase"
            >
            <button class="btn btn-primary" @click="buscarVehiculo">Buscar</button>
          </div>
        </div>

        <div v-if="vehiculoEncontrado" class="section-card">
          <h3>Detalles del Ingreso Activo</h3>
          <div class="details-grid">
            <div class="detail-item"><strong>Placa:</strong> {{ activeEntry.placa }}</div>
            <div class="detail-item"><strong>Tipo:</strong> {{ activeEntry.tipoVehiculo }}</div>
            <div class="detail-item"><strong>ID Conductor:</strong> {{ activeEntry.idConductor }}</div>
            <div class="detail-item"><strong>Hora Ingreso:</strong> {{ activeEntry.horaIngreso }}</div>
            <div class="detail-item"><strong>Fecha Ingreso:</strong> {{ activeEntry.fechaIngreso }}</div>
            <div class="detail-item"><strong>Permanencia:</strong> {{ tiempoPermanencia }}</div>
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <form @submit.prevent="confirmarSalida">
            <div class="form-group">
              <label for="idSalida">Confirmar ID/Cédula del Conductor</label>
              <input
                v-model="idSalida"
                type="text"
                id="idSalida"
                maxlength="10"
                placeholder="Ingrese ID para validar la salida"
                required
              >
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="cancelar">Cancelar</button>
              <button type="submit" class="btn btn-success">Confirmar Salida</button>
            </div>
          </form>
        </div>

        <div v-if="!vehiculoEncontrado && busquedaRealizada" class="section-card">
          <h3>No se encontró el vehículo</h3>
          <p class="error-message">Verifique la placa o asegúrese que tenga un registro de ingreso activo.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const authStore = useAuthStore()
const sidebarHidden = ref(false)
const buscarPlaca = ref('')
const idSalida = ref('')
const activeEntry = ref(null)
const vehiculoEncontrado = ref(false)
const busquedaRealizada = ref(false)
const tiempoPermanencia = ref('0d 0h 0m 0s')

let intervalPermanencia = null

const isValidPlaca = (placa) => /^[A-Z]{3}-\d{3,4}$/.test(placa)

const calcularPermanencia = () => {
  if (!activeEntry.value) return
  
  const diffMs = Date.now() - activeEntry.value.ingresoTimestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  
  const days = Math.floor(diffSeconds / (3600 * 24))
  const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60

  tiempoPermanencia.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
}

const buscarVehiculo = () => {
  const placa = buscarPlaca.value.trim().toUpperCase()
  
  if (!isValidPlaca(placa)) {
    authStore.showNotification('Formato de Placa inválido', 'error')
    return
  }

  const ingresos = JSON.parse(localStorage.getItem('ingresos') || '[]')
  const activos = ingresos.filter(i => i.estado === 'ACTIVO')
  const encontrado = activos.find(i => i.placa === placa)

  busquedaRealizada.value = true

  if (encontrado) {
    activeEntry.value = encontrado
    vehiculoEncontrado.value = true
    
    if (intervalPermanencia) clearInterval(intervalPermanencia)
    intervalPermanencia = setInterval(calcularPermanencia, 1000)
    calcularPermanencia()
  } else {
    vehiculoEncontrado.value = false
    activeEntry.value = null
    authStore.showNotification(`Vehículo ${placa} no encontrado en campus`, 'warning')
  }
}

const confirmarSalida = () => {
  if (idSalida.value !== activeEntry.value.idConductor) {
    authStore.showNotification('Error: El ID no coincide con el conductor', 'error')
    return
  }

  const ingresos = JSON.parse(localStorage.getItem('ingresos') || '[]')
  const index = ingresos.findIndex(i => i.id === activeEntry.value.id)

  if (index !== -1) {
    const now = new Date()
    ingresos[index].fechaSalida = new Date().toISOString().split('T')[0]
    ingresos[index].horaSalida = now.toLocaleTimeString()
    ingresos[index].salidaTimestamp = now.getTime()
    ingresos[index].estado = 'INACTIVO'
    ingresos[index].permanencia = tiempoPermanencia.value

    localStorage.setItem('ingresos', JSON.stringify(ingresos))
    authStore.showNotification(
      `Salida de ${activeEntry.value.placa} registrada. Permanencia: ${tiempoPermanencia.value}`,
      'success'
    )
    
    cancelar()
  }
}

const cancelar = () => {
  buscarPlaca.value = ''
  idSalida.value = ''
  activeEntry.value = null
  vehiculoEncontrado.value = false
  busquedaRealizada.value = false
  if (intervalPermanencia) clearInterval(intervalPermanencia)
}

onUnmounted(() => {
  if (intervalPermanencia) clearInterval(intervalPermanencia)
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

.search-form {
  display: flex;
  gap: 10px;
}

.search-form input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.detail-item {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.error-message {
  color: #dc3545;
  font-size: 1.1em;
  text-align: center;
  padding: 20px;
}
</style>