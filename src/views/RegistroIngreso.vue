<template>
  <div class="main-wrapper">
    <Sidebar :isHidden="sidebarHidden" />
    <div :class="['content-area', { 'full-width': sidebarHidden }]">
      <Topbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />

      <main class="container">
        <div class="form-header">
          <h2>Registro de Nuevo Ingreso</h2>
          <div class="time-display">
            Hora Actual: <span>{{ horaActual }}</span>
          </div>
        </div>

        <!-- FORMULARIO -->
        <div class="section-card">
          <form @submit.prevent="handleSubmit">
            <div class="form-grid">
              <div class="form-group">
                <label>Placa del Vehículo</label>
                <input
                  v-model="form.placa"
                  type="text"
                  placeholder="ABC-1234"
                  @blur="autocompletarVehiculo"
                  style="text-transform: uppercase"
                  required
                />
              </div>

              <div class="form-group">
                <label>ID / Cédula</label>
                <input v-model="form.idConductor" type="text" required />
              </div>

              <div class="form-group">
                <label>Tipo Vehículo</label>
                <select v-model="form.tipoVehiculo" required>
                  <option value="">Seleccione</option>
                  <option>Auto</option>
                  <option>Moto</option>
                  <option>Camioneta</option>
                  <option>Otro</option>
                </select>
              </div>

              <div class="form-group">
                <label>Tipo Usuario</label>
                <select v-model="form.tipoUsuario" required>
                  <option value="">Seleccione</option>
                  <option>Estudiante</option>
                  <option>Docente</option>
                  <option>Administrativo</option>
                  <option>Visitante</option>
                </select>
              </div>

              <div class="form-group" style="grid-column: 1 / -1">
                <label>Observaciones</label>
                <input v-model="form.observaciones" type="text" />
              </div>
            </div>

            <div class="form-actions">
              <button type="reset" class="btn btn-secondary" @click="resetForm">
                Limpiar
              </button>
              <button type="submit" class="btn btn-primary">
                Registrar Ingreso
              </button>
            </div>
          </form>
        </div>

        <!-- TABLA -->
        <div class="section-card">
          <h3>Últimos 5 Ingresos Registrados</h3>

          <table class="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Placa</th>
                <th>Vehículo</th>
                <th>Usuario</th>
                <th>Conductor</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="ultimosIngresos.length === 0">
                <td colspan="6">Aún no hay registros</td>
              </tr>

              <tr v-for="ingreso in ultimosIngresos" :key="ingreso.id">
                <td>{{ ingreso.horaIngreso }}</td>
                <td>{{ ingreso.placa }}</td>
                <td>{{ ingreso.tipoVehiculo }}</td>
                <td><strong>{{ ingreso.tipoUsuario }}</strong></td>
                <td>{{ ingreso.idConductor }}</td>
                <td>
                  <span
                    :class="[
                      'badge',
                      ingreso.isRegistered ? 'badge-success' : 'badge-warning'
                    ]"
                  >
                    {{ ingreso.isRegistered ? 'ULEAM' : 'Visitante' }}
                  </span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const authStore = useAuthStore()
const sidebarHidden = ref(false)
const horaActual = ref(new Date().toLocaleTimeString())

/* FORM */
const form = ref({
  placa: '',
  idConductor: '',
  tipoVehiculo: '',
  tipoUsuario: '',
  observaciones: ''
})

/* INGRESOS REACTIVOS */
const ingresos = ref([])

const getTodayString = () => new Date().toISOString().split('T')[0]
const isValidPlaca = (p) => /^[A-Z]{3}-\d{3,4}$/.test(p)

/* TABLA REACTIVA */
const ultimosIngresos = computed(() =>
  [...ingresos.value]
    .sort((a, b) => b.ingresoTimestamp - a.ingresoTimestamp)
    .slice(0, 5)
)

/* AUTOCOMPLETAR */
const autocompletarVehiculo = () => {
  const placa = form.value.placa.trim().toUpperCase()
  const vehiculos = JSON.parse(localStorage.getItem('vehiculos') || '[]')
  const v = vehiculos.find(x => x.placa === placa)

  if (v) {
    form.value.idConductor = v.idConductor || ''
    form.value.tipoVehiculo = v.tipoVehiculo || ''
    form.value.tipoUsuario = v.tipoUsuario || ''
    form.value.observaciones = `Propietario: ${v.propietario}`
  }
}

/* REGISTRO */
const handleSubmit = () => {
  const placa = form.value.placa.trim().toUpperCase()
  if (!isValidPlaca(placa)) {
    authStore.showNotification('Placa inválida', 'error')
    return
  }

  if (ingresos.value.some(i => i.placa === placa && i.estado === 'ACTIVO')) {
    authStore.showNotification('Vehículo ya registrado', 'error')
    return
  }

  const vehiculos = JSON.parse(localStorage.getItem('vehiculos') || '[]')
  const v = vehiculos.find(x => x.placa === placa)

  const now = new Date()
  const nuevo = {
    id: ingresos.value.length ? Math.max(...ingresos.value.map(i => i.id)) + 1 : 1,
    placa,
    idConductor: form.value.idConductor,
    tipoVehiculo: form.value.tipoVehiculo,
    tipoUsuario: form.value.tipoUsuario,
    isRegistered: v && v.estado === 'Autorizado',
    fechaIngreso: getTodayString(),
    horaIngreso: now.toLocaleTimeString(),
    ingresoTimestamp: now.getTime(),
    estado: 'ACTIVO',
    observaciones: form.value.observaciones
  }

  ingresos.value.push(nuevo)
  localStorage.setItem('ingresos', JSON.stringify(ingresos.value))

  authStore.showNotification('Ingreso registrado', 'success')
  resetForm()
}

const resetForm = () => {
  form.value = {
    placa: '',
    idConductor: '',
    tipoVehiculo: '',
    tipoUsuario: '',
    observaciones: ''
  }
}

let clock = null
onMounted(() => {
  ingresos.value = JSON.parse(localStorage.getItem('ingresos') || '[]')
  clock = setInterval(() => {
    horaActual.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => clearInterval(clock))
</script>

<style scoped>
.main-wrapper { display: flex; min-height: 100vh; }
.content-area { margin-left: 250px; flex: 1; }
.content-area.full-width { margin-left: 0; }
.container { padding: 20px; }
.section-card { background: #fff; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
.form-header { display: flex; justify-content: space-between; }
h2, h3 { color: #D30F2A; }
</style>
