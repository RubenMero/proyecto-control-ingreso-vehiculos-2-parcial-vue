<template>
  <div class="main-wrapper">
    <Sidebar :isHidden="sidebarHidden" />
    <div :class="['content-area', { 'full-width': sidebarHidden }]">
      <Topbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />
      <main class="container">
        <h2>Administración de Vehículos Autorizados</h2>

        <div v-if="canEdit" class="section-card">
          <h3>{{ isEditing ? 'Editar' : 'Registrar' }} Vehículo Autorizado</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-grid">
              <div class="form-group">
                <label for="placa">Placa</label>
                <input
                  v-model="form.placa"
                  type="text"
                  id="placa"
                  maxlength="8"
                  placeholder="ABC-1234"
                  :disabled="isEditing"
                  style="text-transform: uppercase"
                  required
                >
              </div>
              <div class="form-group">
                <label for="propietario">Propietario</label>
                <input
                  v-model="form.propietario"
                  type="text"
                  id="propietario"
                  placeholder="Nombre Completo"
                  required
                >
              </div>
              <div class="form-group">
                <label for="idConductor">ID Conductor</label>
                <input
                  v-model="form.idConductor"
                  type="text"
                  id="idConductor"
                  maxlength="10"
                  placeholder="1312345678"
                  required
                >
              </div>
              <div class="form-group">
                <label for="tipoVehiculo">Tipo Vehículo</label>
                <select v-model="form.tipoVehiculo" id="tipoVehiculo" required>
                  <option value="Auto">Auto</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="Motocicleta">Motocicleta</option>
                  <option value="Bus">Bus / Institucional</option>
                </select>
              </div>
              <div class="form-group">
                <label for="tipoUsuario">Tipo Usuario</label>
                <select v-model="form.tipoUsuario" id="tipoUsuario" required>
                  <option value="Estudiante">Estudiante</option>
                  <option value="Docente">Docente</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Visitante">Visitante</option>
                </select>
              </div>
              <div class="form-group">
                <label for="estado">Estado</label>
                <select v-model="form.estado" id="estado" required>
                  <option value="Autorizado">Autorizado</option>
                  <option value="Suspendido">Suspendido</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="cancelar">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Guardar Cambios' : 'Registrar' }}
              </button>
            </div>
          </form>
        </div>

        <div class="section-card">
          <h3>Catálogo de Vehículos Autorizados</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Propietario</th>
                <th>ID Conductor</th>
                <th>Tipo Vehículo</th>
                <th>Tipo Usuario</th>
                <th>Estado</th>
                <th v-if="canEdit">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="vehiculos.length === 0">
                <td :colspan="canEdit ? 7 : 6">No hay vehículos registrados</td>
              </tr>
              <tr v-for="vehiculo in vehiculos" :key="vehiculo.id">
                <td>{{ vehiculo.placa }}</td>
                <td>{{ vehiculo.propietario }}</td>
                <td>{{ vehiculo.idConductor }}</td>
                <td>{{ vehiculo.tipoVehiculo }}</td>
                <td>{{ vehiculo.tipoUsuario }}</td>
                <td>
                  <span :class="['badge', vehiculo.estado === 'Autorizado' ? 'badge-success' : 'badge-danger']">
                    {{ vehiculo.estado }}
                  </span>
                </td>
                <td v-if="canEdit">
                  <button class="btn btn-sm btn-secondary" @click="editar(vehiculo)">Editar</button>
                  <button v-if="isAdmin" class="btn btn-sm btn-danger" @click="eliminar(vehiculo.id)">
                    Eliminar
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
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  placa: '',
  propietario: '',
  idConductor: '',
  tipoVehiculo: 'Auto',
  tipoUsuario: 'Estudiante',
  estado: 'Autorizado'
})

const isAdmin = computed(() => authStore.hasPermission('vehiculos-full'))
const canEdit = computed(() => 
  authStore.hasPermission('vehiculos-full') || authStore.hasPermission('vehiculos-rw')
)

const vehiculos = ref([])

const isValidPlaca = (placa) => /^[A-Z]{3}-\d{3,4}$/.test(placa)

const cargarVehiculos = () => {
  vehiculos.value = JSON.parse(localStorage.getItem('vehiculos') || '[]')
}

const handleSubmit = () => {
  const placa = form.value.placa.trim().toUpperCase()

  if (!isValidPlaca(placa)) {
    authStore.showNotification('Placa inválida. Formato: XXX-123 o XXX-1234', 'error')
    return
  }

  const allVehiculos = JSON.parse(localStorage.getItem('vehiculos') || '[]')

  if (isEditing.value) {
    const index = allVehiculos.findIndex(v => v.id === currentId.value)
    if (index !== -1) {
      allVehiculos[index] = { 
        ...allVehiculos[index], 
        ...form.value,
        placa: placa
      }
      localStorage.setItem('vehiculos', JSON.stringify(allVehiculos))
      authStore.showNotification(`Vehículo ${placa} actualizado`, 'success')
    }
  } else {
    if (allVehiculos.some(v => v.placa === placa)) {
      authStore.showNotification('Error: Placa ya registrada', 'error')
      return
    }

    const newVehiculo = {
      id: allVehiculos.length > 0 ? Math.max(...allVehiculos.map(v => v.id)) + 1 : 1,
      ...form.value,
      placa: placa
    }

    allVehiculos.push(newVehiculo)
    localStorage.setItem('vehiculos', JSON.stringify(allVehiculos))
    authStore.showNotification(`Vehículo ${placa} registrado`, 'success')
  }

  cancelar()
  cargarVehiculos()
}

const editar = (vehiculo) => {
  isEditing.value = true
  currentId.value = vehiculo.id
  form.value = { ...vehiculo }
}

const eliminar = (id) => {
  if (confirm('¿Eliminar este vehículo permanentemente?')) {
    const allVehiculos = JSON.parse(localStorage.getItem('vehiculos') || '[]')
    const filtered = allVehiculos.filter(v => v.id !== id)
    localStorage.setItem('vehiculos', JSON.stringify(filtered))
    authStore.showNotification('Vehículo eliminado', 'success')
    cargarVehiculos()
  }
}

const cancelar = () => {
  isEditing.value = false
  currentId.value = null
  form.value = {
    placa: '',
    propietario: '',
    idConductor: '',
    tipoVehiculo: 'Auto',
    tipoUsuario: 'Estudiante',
    estado: 'Autorizado'
  }
}

onMounted(() => {
  cargarVehiculos()
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

.btn-sm {
  margin-right: 5px;
}
</style>