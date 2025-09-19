<template>
  <div id="app">
    <div v-if="authStore.loading" class="loading">
      <div class="spinner"></div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()

onMounted(() => {
  authStore.init()
})
</script>