<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-bg-secondary border-b border-border-color">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-semibold">🚑 Apteczka Karetki</h1>
          <div class="flex items-center gap-4">
            <router-link
              v-if="superAdminStore.isSuperAdmin"
              to="/super-admin"
              class="btn bg-gradient-to-r from-accent-danger to-medical-red text-white border-none hover:from-red-600 hover:to-red-700"
              title="Panel Super Admina"
            >
              ⚡ Super Admin
            </router-link>
            <NotificationBell />
            <span class="text-sm text-text-secondary">{{ authStore.user?.displayName }}</span>
            <button @click="authStore.logout" class="btn btn-secondary">
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-6">
      <!-- Create New Ambulance -->
      <div class="card mb-6">
        <h2 class="text-lg font-semibold mb-4">Utwórz nową karetkę</h2>
        <form @submit.prevent="handleCreateAmbulance" class="grid grid-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="ambulanceName">Nazwa karetki</label>
            <input
              id="ambulanceName"
              v-model="newAmbulance.name"
              type="text"
              class="form-input"
              placeholder="np. Karetka 01"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="ambulanceLocation">Lokalizacja</label>
            <input
              id="ambulanceLocation"
              v-model="newAmbulance.location"
              type="text"
              class="form-input"
              placeholder="np. Warszawa - Śródmieście"
              required
            />
          </div>
          <div class="col-span-full">
            <button
              type="submit"
              :disabled="ambulanceStore.loading"
              class="btn btn-primary"
            >
              {{ ambulanceStore.loading ? 'Tworzenie...' : 'Utwórz karetkę' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Join Ambulance -->
      <div class="card mb-6">
        <h2 class="text-lg font-semibold mb-4">📱 Dołącz do karetki na zmianę</h2>
        <p class="text-sm text-text-secondary mb-4">
          Zeskanuj kod QR karetki lub wprowadź ID, aby dołączyć jako członek zespołu
        </p>

        <div class="space-y-4">
          <!-- QR Scanner Button -->
          <div class="text-center">
            <button
              @click="startQRScanner"
              class="btn btn-primary"
              :disabled="!hasCamera"
            >
              📷 Zeskanuj kod QR karetki
            </button>
            <p v-if="!hasCamera" class="text-xs text-text-muted mt-2">
              Kamera niedostępna - użyj wprowadzania ID
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex-1 border-t border-border-color"></div>
            <span class="text-sm text-text-muted">lub</span>
            <div class="flex-1 border-t border-border-color"></div>
          </div>

          <!-- Manual ID Entry -->
          <form @submit.prevent="handleJoinAmbulance" class="flex gap-4">
            <div class="flex-1">
              <input
                v-model="joinAmbulanceId"
                type="text"
                class="form-input"
                placeholder="Wprowadź ID karetki (np. AMB-XXXXXXX)"
                required
              />
            </div>
            <button
              type="submit"
              :disabled="ambulanceStore.loading"
              class="btn btn-secondary"
            >
              {{ ambulanceStore.loading ? 'Dołączanie...' : 'Dołącz' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="ambulanceStore.error" class="alert alert-error mb-6">
        {{ ambulanceStore.error }}
      </div>

      <!-- User's Ambulances -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">🚑 Twoje karetki</h2>

        <div v-if="ambulanceStore.loading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="ambulanceStore.ambulances.length === 0" class="text-center py-8 text-text-muted">
          <div class="mb-4">
            <div class="text-4xl mb-2">🚑</div>
            <p class="text-lg mb-2">Brak karetek</p>
            <p class="text-sm">Utwórz nową karetkę lub dołącz do istniejącej zespołu</p>
          </div>
        </div>

        <div v-else>
          <p class="text-sm text-text-secondary mb-4">
            Pracujesz w {{ ambulanceStore.ambulances.length }}
            {{ ambulanceStore.ambulances.length === 1 ? 'karetce' : 'karetkach' }}
          </p>

          <div class="grid grid-2 gap-4">
            <div
              v-for="ambulance in ambulanceStore.ambulances"
              :key="ambulance.id"
              class="bg-bg-tertiary rounded-lg p-4 border border-border-color hover:border-accent-primary transition-colors cursor-pointer"
              @click="goToAmbulance(ambulance.id)"
            >
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold">{{ ambulance.name }}</h3>
                <div class="flex gap-1">
                  <span
                    v-if="ambulance.creator === authStore.user.uid"
                    class="text-xs bg-medical-blue text-white px-2 py-1 rounded"
                    title="Twórca"
                  >
                    Twórca
                  </span>
                  <span
                    v-else-if="ambulance.admins?.includes(authStore.user.uid)"
                    class="text-xs bg-accent-primary text-white px-2 py-1 rounded"
                    title="Administrator"
                  >
                    Admin
                  </span>
                  <span
                    v-else
                    class="text-xs bg-medical-green text-white px-2 py-1 rounded"
                    title="Członek zespołu"
                  >
                    Członek
                  </span>
                </div>
              </div>

              <p class="text-sm text-text-secondary mb-3">📍 {{ ambulance.location }}</p>

              <div class="flex justify-between items-center text-sm text-text-muted">
                <span>👥 {{ ambulance.members?.length || 0 }} członków</span>
                <span class="font-mono text-xs">{{ ambulance.id }}</span>
              </div>

              <!-- Quick indicators -->
              <div class="flex gap-2 mt-3">
                <div class="flex-1 text-center py-1 bg-bg-secondary rounded text-xs">
                  <span class="text-text-muted">Twoja rola:</span>
                  <span class="font-medium ml-1">
                    {{ ambulance.creator === authStore.user.uid ? 'Twórca' :
                       ambulance.admins?.includes(authStore.user.uid) ? 'Admin' : 'Członek' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAmbulanceStore } from '../stores/ambulance.js'
import { useSuperAdminStore } from '../stores/superAdmin.js'
import NotificationBell from '../components/NotificationBell.vue'

const router = useRouter()
const authStore = useAuthStore()
const ambulanceStore = useAmbulanceStore()
const superAdminStore = useSuperAdminStore()

const newAmbulance = ref({
  name: '',
  location: ''
})
const joinAmbulanceId = ref('')
const hasCamera = ref(false)

onMounted(async () => {
  ambulanceStore.loadUserAmbulances()

  // Check if camera is available
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    hasCamera.value = true
    stream.getTracks().forEach(track => track.stop()) // Stop the test stream
  } catch (error) {
    hasCamera.value = false
  }
})

const handleCreateAmbulance = async () => {
  try {
    const ambulanceId = await ambulanceStore.createAmbulance(
      newAmbulance.value.name,
      newAmbulance.value.location
    )
    newAmbulance.value = { name: '', location: '' }
    ambulanceStore.loadUserAmbulances()
    router.push(`/ambulance/${ambulanceId}`)
  } catch (error) {
    console.error('Error creating ambulance:', error)
  }
}

const handleJoinAmbulance = async () => {
  try {
    await ambulanceStore.joinAmbulance(joinAmbulanceId.value.toUpperCase())
    joinAmbulanceId.value = ''
    ambulanceStore.loadUserAmbulances()
  } catch (error) {
    console.error('Error joining ambulance:', error)
  }
}

const goToAmbulance = (ambulanceId) => {
  router.push(`/ambulance/${ambulanceId}`)
}

const startQRScanner = () => {
  // For now, redirect to a simple join page - in a full implementation,
  // you could integrate a QR scanner library like jsQR or quagga2
  const ambulanceId = prompt('Demo: Wprowadź ID karetki (w przyszłości będzie to skaner QR):')
  if (ambulanceId) {
    joinAmbulanceId.value = ambulanceId.toUpperCase()
    handleJoinAmbulance()
  }
}
</script>

<style scoped>
.col-span-full {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>