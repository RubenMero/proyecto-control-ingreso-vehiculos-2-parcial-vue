<template>
  <div id="app">
    <Notification />
    <router-view />
  </div>
</template>

<script setup>
import Notification from '@/components/Notification.vue'
</script>

<style>
@import '@/assets/styles.css';

#app {
  min-height: 100vh;
  background-color: #f4f7f9;
}
</style>