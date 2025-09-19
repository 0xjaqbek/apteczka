<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="card text-center">
        <div class="mb-6">
          <h1 class="text-2xl font-semibold mb-2">🚑 Dołącz do karetki</h1>
          <p class="text-muted">ID: {{ $route.params.id }}</p>
        </div>

        <div v-if="ambulanceStore.loading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="ambulanceInfo">
          <div class="bg-bg-tertiary rounded-lg p-4 mb-6">
            <h3 class="font-semibold">{{ ambulanceInfo.name }}</h3>
            <p class="text-sm text-text-secondary">{{ ambulanceInfo.location }}</p>
            <p class="text-xs text-text-muted mt-2">{{ ambulanceInfo.members?.length || 0 }} członków</p>
          </div>

          <div v-if="alreadyMember" class="alert alert-success mb-4">
            Jesteś już członkiem tej karetki!
          </div>

          <div class="flex flex-col gap-4">
            <button
              v-if="!alreadyMember"
              @click="handleJoin"
              :disabled="ambulanceStore.loading"
              class="btn btn-primary"
            >
              {{ ambulanceStore.loading ? 'Dołączanie...' : 'Dołącz do karetki' }}
            </button>

            <router-link
              :to="alreadyMember ? `/ambulance/${$route.params.id}` : '/'"
              class="btn btn-secondary"
            >
              {{ alreadyMember ? 'Przejdź do karetki' : 'Powrót do strony głównej' }}
            </router-link>
          </div>
        </div>

        <div v-else-if="ambulanceStore.error" class="alert alert-error">
          {{ ambulanceStore.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAmbulanceStore } from '../stores/ambulance.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const ambulanceStore = useAmbulanceStore()

const ambulanceInfo = ref(null)

const alreadyMember = computed(() => {
  return ambulanceInfo.value?.members?.includes(authStore.user?.uid) || false
})

onMounted(async () => {
  try {
    // Try to load ambulance info to check if it exists
    const ambulanceData = await ambulanceStore.joinAmbulance(route.params.id)
    ambulanceInfo.value = ambulanceData

    // If we're already a member, we'll get an error, but we can still show the info
  } catch (error) {
    if (error.message.includes('już członkiem')) {
      // Load ambulance info anyway for display
      try {
        await ambulanceStore.setCurrentAmbulance(route.params.id)
        ambulanceInfo.value = ambulanceStore.currentAmbulance
      } catch (err) {
        console.error('Error loading ambulance info:', err)
      }
    }
  }
})

const handleJoin = async () => {
  try {
    await ambulanceStore.joinAmbulance(route.params.id)
    await ambulanceStore.loadUserAmbulances()
    router.push(`/ambulance/${route.params.id}`)
  } catch (error) {
    console.error('Error joining ambulance:', error)
  }
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>