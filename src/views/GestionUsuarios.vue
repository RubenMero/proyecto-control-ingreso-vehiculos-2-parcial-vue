<template>
  <div class="main-wrapper">
    <Sidebar :isHidden="sidebarHidden" />
    <div :class="['content-area', { 'full-width': sidebarHidden }]">
      <Topbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />
      <main class="container">
        <h2>Gestión de Usuarios del Sistema</h2>

        <div v-if="canManage" class="section-card">
          <h3>{{ isEditing ? 'Editar' : 'Registrar' }} Usuario</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-grid">
              <div class="form-group">
                <label for="cedula">ID / Cédula</label>
                <input
                  v-model="form.cedula"
                  type="text"
                  id="cedula"
                  maxlength="10"
                  placeholder="1312345678"
                  required
                >
              </div>
              <div class="form-group">
                <label for="nombre">Nombre Completo</label>
                <input
                  v-model="form.nombre"
                  type="text"
                  id="nombre"
                  placeholder="Nombre Apellido"
                  required
                >
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  id="email"
                  placeholder="correo@uleam.edu.ec"
                  required
                >
              </div>
              <div class="form-group">
                <label for="rol">Rol</label>
                <select v-model="form.rol" id="rol" :disabled="isSupervisor" required>
                  <option value="">Seleccione Rol</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="GUARDIA">Guardia</option>
                </select>
              </div>
              <div class="form-group">
                <label for="password">Contraseña {{ isEditing ? '(Dejar vacío para no cambiar)' : '' }}</label>
                <input
                  v-model="form.password"
                  type="password"
                  id="password"
                  placeholder="Mínimo 8 caracteres"
                  :required="!isEditing"
                >
              </div>
              <div class="form-group">
                <label for="estado">Estado</label>
                <select v-model="form.estado" id="estado" required>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="cancelar">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Guardar Cambios' : 'Registrar Usuario' }}
              </button>
            </div>
          </form>
        </div>

        <div class="section-card">
          <h3>Listado de Usuarios</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Última Conexión</th>
                <th v-if="canManage">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="usuario in usuarios" :key="usuario.id">
                <td>{{ usuario.id }}</td>
                <td>{{ usuario.cedula }}</td>
                <td>{{ usuario.nombre }}</td>
                <td>{{ usuario.email }}</td>
                <td>{{ usuario.rol }}</td>
                <td>
                  <span :class="['badge', usuario.estado === 'Activo' ? 'badge-success' : 'badge-danger']">
                    {{ usuario.estado }}
                  </span>
                </td>
                <td>{{ usuario.lastLogin || 'Nunca' }}</td>
                <td v-if="canManage">
                  <button 
                    v-if="canEditUser(usuario)"
                    class="btn btn-sm btn-secondary" 
                    @click="editar(usuario)"
                  >
                    Editar
                  </button>
                  <button 
                    v-if="isAdmin && usuario.id !== authStore.currentUser.userId"
                    class="btn btn-sm btn-danger" 
                    @click="eliminar(usuario.id)"
                  >
                    Eliminar
                  </button>
                  <span v-if="usuario.id === authStore.currentUser.userId" class="badge badge-warning">
                    Tu cuenta
                  </span>
                  <span v-if="isSupervisor && usuario.rol !== 'GUARDIA' && usuario.id !== authStore.currentUser.userId">
                    Sin Permiso
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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const authStore = useAuthStore()
const sidebarHidden = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  cedula: '',
  nombre: '',
  email: '',
  rol: '',
  password: '',
  estado: 'Activo'
})

const isAdmin = computed(() => authStore.userRole === 'ADMINISTRADOR')
const isSupervisor = computed(() => authStore.userRole === 'SUPERVISOR')
const canManage = computed(() => isAdmin.value || isSupervisor.value)

const usuarios = ref([])

const canEditUser = (usuario) => {
  if (isAdmin.value) return true
  if (isSupervisor.value && usuario.rol === 'GUARDIA' && usuario.id !== authStore.currentUser.userId) {
    return true
  }
  return false
}

const cargarUsuarios = () => {
  usuarios.value = JSON.parse(localStorage.getItem('users') || '[]')
}

const handleSubmit = () => {
  if (isSupervisor.value && !isEditing.value) {
    authStore.showNotification('Los Supervisores no pueden crear nuevos usuarios', 'error')
    return
  }

  const allUsers = JSON.parse(localStorage.getItem('users') || '[]')

  if (isEditing.value) {
    const index = allUsers.findIndex(u => u.id === currentId.value)
    if (index !== -1) {
      const existingUser = allUsers[index]
      
      if (isSupervisor.value && existingUser.rol !== 'GUARDIA') {
        authStore.showNotification('Los Supervisores solo pueden editar Guardias', 'error')
        return
      }

      allUsers[index] = {
        ...existingUser,
        cedula: form.value.cedula,
        nombre: form.value.nombre,
        email: form.value.email,
        estado: form.value.estado,
        rol: isAdmin.value ? form.value.rol : existingUser.rol
      }

      if (form.value.password) {
        allUsers[index].password = form.value.password
      }

      localStorage.setItem('users', JSON.stringify(allUsers))
      authStore.showNotification(`Usuario ${form.value.nombre} actualizado`, 'success')
    }
  } else {
    if (!form.value.password || form.value.password.length < 8) {
      authStore.showNotification('La contraseña debe tener al menos 8 caracteres', 'error')
      return
    }

    const newUser = {
      id: allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) + 1 : 1,
      cedula: form.value.cedula,
      nombre: form.value.nombre,
      email: form.value.email,
      usuario: form.value.email.split('@')[0],
      password: form.value.password,
      rol: form.value.rol,
      estado: form.value.estado,
      lastLogin: null
    }

    allUsers.push(newUser)
    localStorage.setItem('users', JSON.stringify(allUsers))
    authStore.showNotification(`Usuario ${form.value.nombre} creado`, 'success')
  }

  cancelar()
  cargarUsuarios()
}

const editar = (usuario) => {
  if (!canEditUser(usuario)) return

  isEditing.value = true
  currentId.value = usuario.id
  form.value = {
    cedula: usuario.cedula,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    password: '',
    estado: usuario.estado
  }
}

const eliminar = (id) => {
  if (id === authStore.currentUser.userId) {
    authStore.showNotification('No puedes eliminar tu propia cuenta', 'error')
    return
  }

  if (confirm('¿Está seguro de eliminar este usuario? Esta acción es irreversible.')) {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const filtered = allUsers.filter(u => u.id !== id)
    localStorage.setItem('users', JSON.stringify(filtered))
    authStore.showNotification('Usuario eliminado permanentemente', 'success')
    cargarUsuarios()
  }
}

const cancelar = () => {
  isEditing.value = false
  currentId.value = null
  form.value = {
    cedula: '',
    nombre: '',
    email: '',
    rol: '',
    password: '',
    estado: 'Activo'
  }
}

onMounted(() => {
  cargarUsuarios()
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