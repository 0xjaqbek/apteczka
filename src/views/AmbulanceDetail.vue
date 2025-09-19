<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-bg-secondary border-b border-border-color">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <router-link to="/" class="btn btn-secondary">← Powrót</router-link>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-semibold">{{ ambulanceStore.currentAmbulance?.name }}</h1>
                <span
                  v-if="ambulanceStore.currentAmbulance?.creator === authStore.user?.uid"
                  class="text-xs bg-medical-blue text-white px-2 py-1 rounded"
                  title="Jesteś twórcą tej karetki"
                >
                  Twórca
                </span>
                <span
                  v-else-if="ambulanceStore.isAdmin"
                  class="text-xs bg-accent-primary text-white px-2 py-1 rounded"
                  title="Masz uprawnienia administratora"
                >
                  Admin
                </span>
                <span
                  v-else
                  class="text-xs bg-medical-green text-white px-2 py-1 rounded"
                  title="Jesteś członkiem zespołu"
                >
                  Członek
                </span>
              </div>
              <p class="text-sm text-text-secondary">📍 {{ ambulanceStore.currentAmbulance?.location }}</p>
              <p class="text-xs text-text-muted">ID: {{ ambulanceStore.currentAmbulance?.id }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <!-- Ambulance Switcher -->
            <div v-if="ambulanceStore.ambulances.length > 1" class="relative">
              <select
                @change="switchAmbulance($event.target.value)"
                :value="route.params.id"
                class="form-input text-sm py-1 px-2"
              >
                <option
                  v-for="ambulance in ambulanceStore.ambulances"
                  :key="ambulance.id"
                  :value="ambulance.id"
                >
                  🚑 {{ ambulance.name }}
                </option>
              </select>
            </div>

            <router-link
              v-if="superAdminStore.isSuperAdmin"
              to="/super-admin"
              class="btn bg-gradient-to-r from-accent-danger to-medical-red text-white border-none hover:from-red-600 hover:to-red-700 text-xs"
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

    <div v-if="ambulanceStore.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="ambulanceStore.currentAmbulance" class="container mx-auto px-4 py-6">
      <!-- Navigation -->
      <div class="flex gap-2 mb-6 overflow-x-auto">
        <button
          @click="activeTab = 'overview'"
          :class="['btn', activeTab === 'overview' ? 'btn-primary' : 'btn-secondary']"
        >
          Przegląd
        </button>
        <router-link
          :to="`/ambulance/${route.params.id}/inventory`"
          class="btn btn-secondary"
        >
          Inwentarz
        </router-link>
        <router-link
          :to="`/ambulance/${route.params.id}/usage`"
          class="btn btn-secondary"
        >
          Zużycie
        </router-link>
        <button
          @click="activeTab = 'activities'"
          :class="['btn', activeTab === 'activities' ? 'btn-primary' : 'btn-secondary']"
        >
          Historia
        </button>
        <router-link
          v-if="ambulanceStore.isAdmin"
          :to="`/ambulance/${route.params.id}/settings`"
          class="btn btn-secondary"
        >
          Ustawienia
        </router-link>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Expiring Items Alert -->
        <div v-if="ambulanceStore.expiringItems.length > 0" class="alert alert-warning">
          <h4 class="font-semibold mb-2">⚠️ Uwaga! Przedmioty wygasające wkrótce:</h4>
          <ul class="list-disc list-inside">
            <li v-for="item in ambulanceStore.expiringItems" :key="item.id" class="text-sm">
              {{ item.name }} - wygasa {{ formatDate(item.expirationDate) }}
            </li>
          </ul>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-2 gap-4">
          <div class="card">
            <h3 class="font-semibold mb-2">Członkowie</h3>
            <p class="text-2xl font-bold text-accent-primary">{{ ambulanceStore.currentAmbulance.members?.length || 0 }}</p>
          </div>
          <div class="card">
            <h3 class="font-semibold mb-2">Przedmioty w inwentarzu</h3>
            <p class="text-2xl font-bold text-accent-primary">{{ ambulanceStore.inventory.length }}</p>
          </div>
          <div class="card">
            <h3 class="font-semibold mb-2">Wygasające wkrótce</h3>
            <p class="text-2xl font-bold text-accent-warning">{{ ambulanceStore.expiringItems.length }}</p>
          </div>
          <div class="card">
            <h3 class="font-semibold mb-2">ID Karetki</h3>
            <p class="text-lg font-mono">{{ ambulanceStore.currentAmbulance.id }}</p>
          </div>
        </div>

        <!-- QR Code Section -->
        <div class="card">
          <h3 class="font-semibold mb-4">Kod QR do dołączenia</h3>
          <div class="flex flex-col items-center gap-4">
            <div class="bg-white p-4 rounded-lg">
              <div v-if="qrCodeUrl" class="w-64 h-64">
                <img :src="qrCodeUrl" alt="QR Code" class="w-full h-full" />
              </div>
              <div v-else class="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                <div class="spinner"></div>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="downloadQR" class="btn btn-secondary">
                Pobierz QR
              </button>
              <button @click="copyJoinLink" class="btn btn-secondary">
                Kopiuj link
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Activities Tab -->
      <div v-if="activeTab === 'activities'">
        <Activities />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAmbulanceStore } from '../stores/ambulance.js'
import { useSuperAdminStore } from '../stores/superAdmin.js'
import { generateQRCode, downloadQRCode } from '../services/qrcode.js'
import Activities from '../components/Activities.vue'
import NotificationBell from '../components/NotificationBell.vue'

const route = useRoute()
const authStore = useAuthStore()
const ambulanceStore = useAmbulanceStore()
const superAdminStore = useSuperAdminStore()

const activeTab = ref('overview')
const qrCodeUrl = ref('')

onMounted(async () => {
  await ambulanceStore.loadUserAmbulances() // Load all user ambulances for switcher
  await ambulanceStore.setCurrentAmbulance(route.params.id)
  await generateQR()
})

const generateQR = async () => {
  try {
    qrCodeUrl.value = await generateQRCode(route.params.id)
  } catch (error) {
    console.error('Error generating QR code:', error)
  }
}

const downloadQR = async () => {
  try {
    await downloadQRCode(route.params.id, ambulanceStore.currentAmbulance.name)
  } catch (error) {
    console.error('Error downloading QR code:', error)
  }
}

const copyJoinLink = async () => {
  try {
    const url = `${window.location.origin}/join/${route.params.id}`
    await navigator.clipboard.writeText(url)
    // You could add a toast notification here
  } catch (error) {
    console.error('Error copying link:', error)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('pl-PL')
}

const switchAmbulance = (ambulanceId) => {
  if (ambulanceId !== route.params.id) {
    router.push(`/ambulance/${ambulanceId}`)
  }
}
</script>

<style scoped>
@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>