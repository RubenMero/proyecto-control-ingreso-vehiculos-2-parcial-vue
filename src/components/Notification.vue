<template>
  <Transition name="fade">
    <div 
      v-if="authStore.notification.show" 
      :class="['custom-notification', authStore.notification.type]"
    >
      {{ authStore.notification.message }}
    </div>
  </Transition>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.custom-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 2000;
}

.custom-notification.success {
  background-color: #28a745;
}

.custom-notification.error {
  background-color: #dc3545;
}

.custom-notification.warning {
  background-color: #ffc107;
  color: #333;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>