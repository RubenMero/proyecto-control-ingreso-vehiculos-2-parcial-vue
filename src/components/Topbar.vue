<template>
  <header class="topbar">
    <!-- IZQUIERDA: menú + logo -->
    <div class="topbar-left">
      <button class="menu-toggle" @click="$emit('toggle-sidebar')">
        ☰
      </button>

      <!-- LOGO ULEAM -->
      <img
        src="/logo-uleam.png"
        alt="ULEAM"
        class="logo-uleam"
      />
    </div>

    <!-- DERECHA: info usuario -->
    <div class="user-info-top">
      <span class="user-role-label">{{ authStore.userRole }}</span>
      <span class="user-name">👤 {{ userName }}</span>
      <button class="btn-logout" @click="handleLogout">
        Cerrar Sesión
      </button>
    </div>
  </header>
</template>


<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

defineEmits(['toggle-sidebar'])

const authStore = useAuthStore()
const router = useRouter()

const userName = computed(() => {
  return authStore.currentUser?.username?.split(' ')[0] || 'Usuario'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.topbar {
  height: 60px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.menu-toggle {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #D30F2A;
  padding: 5px;
}

.user-info-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-role-label {
  background-color: #00ff80;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.btn-logout {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: #c82333;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-uleam {
  height: 40px;
  object-fit: contain;
}


</style>