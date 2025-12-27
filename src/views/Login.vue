<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="logo-container">
        <img src="/logo-uleam.png" alt="Logo ULEAM" />
      </div>

      <h2>Sistema de Control Acceso Vehicular</h2>

      <form @submit.prevent="handleLogin">
        <!-- USUARIO -->
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="Usuario o correo institucional"
            :class="{ 'is-invalid': errors.username }"
            @input="validateUsername"
            required
          />
          <span v-if="errors.username" class="error-message">
            {{ errors.username }}
          </span>
        </div>

        <!-- CONTRASEÑA CON OJO -->
        <div class="form-group password-field">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Contraseña"
            :class="{ 'is-invalid': errors.password }"
            @input="validatePassword"
            required
          />
          <span class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </span>
          <span v-if="errors.password" class="error-message">
            {{ errors.password }}
          </span>
        </div>

        <!-- OPCIONES -->
        <div class="login-options">
          <label class="remember">
            <input v-model="rememberMe" type="checkbox" />
            Recordar sesión
          </label>

          <a href="#" class="forgot-password" @click.prevent="openRecovery">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '⏳ Verificando...' : 'Iniciar Sesión' }}
        </button>
      </form>
    </div>

    <footer class="footer">
      © Universidad Laica Eloy Alfaro de Manabí
    </footer>

    <!-- MODAL RESTABLECER CONTRASEÑA -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h3>Restablecer contraseña</h3>

        <input
          v-model="recoveryEmail"
          type="email"
          placeholder="Correo institucional @uleam.edu.ec"
        />

        <input
          v-model="newPassword"
          :type="showNewPassword ? 'text' : 'password'"
          placeholder="Nueva contraseña"
        />

        <input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="Confirmar contraseña"
        />

        <p v-if="recoveryError" class="error-message">
          {{ recoveryError }}
        </p>

        <div class="modal-actions">
          <button class="btn btn-primary" @click="resetPassword">
            Restablecer
          </button>
          <button class="btn btn-secondary" @click="closeRecovery">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

// Login
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const errors = ref({})
const showPassword = ref(false)

// Modal recuperación
const showModal = ref(false)
const recoveryEmail = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const recoveryError = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Validaciones
const validateUsername = () => {
  errors.value.username = ''
  if (
    username.value.includes('@') &&
    !username.value.includes('@uleam.edu.ec')
  ) {
    errors.value.username =
      'Debe usar un correo institucional @uleam.edu.ec'
  }
}

const validatePassword = () => {
  errors.value.password = ''
  if (password.value.length > 0 && password.value.length < 8) {
    errors.value.password =
      'La contraseña debe tener al menos 8 caracteres'
  }
}

// Login
const handleLogin = () => {
  if (errors.value.username || errors.value.password) return

  loading.value = true

  setTimeout(() => {
    const success = authStore.login(username.value, password.value)

    if (success) {
      authStore.showNotification('Acceso concedido', 'success')
      router.push('/dashboard')
    } else {
      authStore.showNotification('Credenciales incorrectas', 'error')
    }

    loading.value = false
  }, 800)
}

// Recuperación
const openRecovery = () => {
  showModal.value = true
}

const closeRecovery = () => {
  showModal.value = false
  recoveryEmail.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  recoveryError.value = ''
}

const resetPassword = () => {
  recoveryError.value = ''

  if (!recoveryEmail.value.includes('@uleam.edu.ec')) {
    recoveryError.value = 'Ingrese un correo institucional válido'
    return
  }

  if (newPassword.value.length < 8) {
    recoveryError.value = 'La nueva contraseña debe tener al menos 8 caracteres'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    recoveryError.value = 'Las contraseñas no coinciden'
    return
  }

  alert('Contraseña restablecida correctamente')
  closeRecovery()
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f7f9;
}

.login-container {
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo-container img {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 25px;
  font-size: 1.3em;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

input.is-invalid {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
}

.remember {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
}

.remember input {
  width: 14px;
  height: 14px;
}

.forgot-password {
  font-size: 0.85em;
  color: #d30f2a;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.btn {
  width: 100%;
  padding: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #d30f2a;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  font-size: 0.8em;
}

/* OJO CONTRASEÑA */
.password-field {
  position: relative;
}

.password-field input {
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 1.1em;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 25px;
  border-radius: 8px;
  max-width: 350px;
  width: 90%;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
</style>
