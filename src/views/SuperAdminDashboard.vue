<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-gradient-to-r from-accent-danger to-medical-red border-b border-border-color">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-white">⚡ Super Admin Dashboard</h1>
            <p class="text-red-200 text-sm">Apteczka Karetki - Panel Zarządzania</p>
          </div>
          <div class="flex items-center gap-4">
            <router-link to="/" class="btn btn-secondary">
              🏠 Powrót do App
            </router-link>
            <span class="text-white text-sm">{{ authStore.user?.displayName }}</span>
            <button @click="authStore.logout" class="btn btn-secondary">
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-6">
      <!-- Navigation -->
      <div class="flex gap-2 mb-6 overflow-x-auto">
        <button
          @click="activeTab = 'overview'"
          :class="['btn', activeTab === 'overview' ? 'btn-primary' : 'btn-secondary']"
        >
          📊 Przegląd
        </button>
        <button
          @click="activeTab = 'ambulances'"
          :class="['btn', activeTab === 'ambulances' ? 'btn-primary' : 'btn-secondary']"
        >
          🚑 Karetki
        </button>
        <button
          @click="activeTab = 'users'"
          :class="['btn', activeTab === 'users' ? 'btn-primary' : 'btn-secondary']"
        >
          👥 Użytkownicy
        </button>
        <button
          @click="activeTab = 'activities'"
          :class="['btn', activeTab === 'activities' ? 'btn-primary' : 'btn-secondary']"
        >
          📈 Aktywność
        </button>
      </div>

      <div v-if="superAdminStore.loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-if="superAdminStore.error" class="alert alert-error mb-6">
        {{ superAdminStore.error }}
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card bg-gradient-to-br from-medical-blue to-blue-600 text-white">
            <div class="text-center">
              <div class="text-3xl font-bold">{{ superAdminStore.stats.totalUsers }}</div>
              <div class="text-sm opacity-90">Użytkowników</div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-medical-green to-green-600 text-white">
            <div class="text-center">
              <div class="text-3xl font-bold">{{ superAdminStore.stats.totalAmbulances }}</div>
              <div class="text-sm opacity-90">Karetek</div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-accent-warning to-yellow-600 text-white">
            <div class="text-center">
              <div class="text-3xl font-bold">{{ superAdminStore.stats.totalInventoryItems }}</div>
              <div class="text-sm opacity-90">Przedmiotów</div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div class="text-center">
              <div class="text-3xl font-bold">{{ superAdminStore.stats.activeUsers }}</div>
              <div class="text-sm opacity-90">Aktywnych (7 dni)</div>
            </div>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">📊 Statystyki aplikacji</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span>Aktywności (7 dni):</span>
                <span class="font-semibold">{{ superAdminStore.stats.totalActivities }}</span>
              </div>
              <div class="flex justify-between">
                <span>Wygasające przedmioty:</span>
                <span class="font-semibold text-accent-warning">{{ superAdminStore.stats.expiringItems }}</span>
              </div>
              <div class="flex justify-between">
                <span>Średnio przedmiotów/karetka:</span>
                <span class="font-semibold">
                  {{ superAdminStore.stats.totalAmbulances > 0
                      ? Math.round(superAdminStore.stats.totalInventoryItems / superAdminStore.stats.totalAmbulances)
                      : 0 }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Wskaźnik aktywności:</span>
                <span class="font-semibold">
                  {{ superAdminStore.stats.totalUsers > 0
                      ? Math.round((superAdminStore.stats.activeUsers / superAdminStore.stats.totalUsers) * 100)
                      : 0 }}%
                </span>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="text-lg font-semibold mb-4">🎯 Szybkie akcje</h3>
            <div class="space-y-2">
              <button @click="refreshAllData" class="btn btn-primary w-full">
                🔄 Odśwież wszystkie dane
              </button>
              <button @click="activeTab = 'ambulances'" class="btn btn-secondary w-full">
                🚑 Zarządzaj karetkami
              </button>
              <button @click="activeTab = 'users'" class="btn btn-secondary w-full">
                👥 Zarządzaj użytkownikami
              </button>
              <button @click="exportData" class="btn btn-secondary w-full">
                📊 Eksportuj dane
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ambulances Tab -->
      <div v-if="activeTab === 'ambulances'" class="space-y-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">🚑 Wszystkie karetki ({{ superAdminStore.allAmbulances.length }})</h3>
            <button @click="loadAmbulances" class="btn btn-secondary">
              🔄 Odśwież
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-bg-tertiary">
                <tr>
                  <th class="text-left p-3">ID</th>
                  <th class="text-left p-3">Nazwa</th>
                  <th class="text-left p-3">Lokalizacja</th>
                  <th class="text-left p-3">Członkowie</th>
                  <th class="text-left p-3">Inwentarz</th>
                  <th class="text-left p-3">Utworzono</th>
                  <th class="text-left p-3">Akcje</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ambulance in superAdminStore.allAmbulances" :key="ambulance.id"
                    class="border-b border-border-color hover:bg-bg-tertiary">
                  <td class="p-3 font-mono text-xs">{{ ambulance.id }}</td>
                  <td class="p-3 font-semibold">{{ ambulance.name }}</td>
                  <td class="p-3">{{ ambulance.location }}</td>
                  <td class="p-3">{{ ambulance.members?.length || 0 }}</td>
                  <td class="p-3">{{ ambulance.inventoryCount || 0 }}</td>
                  <td class="p-3 text-xs">{{ formatDate(ambulance.createdAt) }}</td>
                  <td class="p-3">
                    <div class="flex gap-1">
                      <router-link
                        :to="`/ambulance/${ambulance.id}`"
                        class="btn btn-secondary text-xs"
                      >
                        👁️ Zobacz
                      </router-link>
                      <button
                        @click="deleteAmbulanceConfirm(ambulance)"
                        class="btn btn-danger text-xs"
                      >
                        🗑️ Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="space-y-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">👥 Wszyscy użytkownicy ({{ superAdminStore.allUsers.length }})</h3>
            <button @click="loadUsers" class="btn btn-secondary">
              🔄 Odśwież
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-bg-tertiary">
                <tr>
                  <th class="text-left p-3">ID</th>
                  <th class="text-left p-3">Nazwa</th>
                  <th class="text-left p-3">Email</th>
                  <th class="text-left p-3">Karetki</th>
                  <th class="text-left p-3">Status</th>
                  <th class="text-left p-3">Utworzono</th>
                  <th class="text-left p-3">Akcje</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in superAdminStore.allUsers" :key="user.id"
                    class="border-b border-border-color hover:bg-bg-tertiary">
                  <td class="p-3 font-mono text-xs">{{ user.id.substring(0, 8) }}...</td>
                  <td class="p-3 font-semibold">{{ user.displayName }}</td>
                  <td class="p-3">{{ user.email }}</td>
                  <td class="p-3">{{ user.ambulances?.length || 0 }}</td>
                  <td class="p-3">
                    <span v-if="user.banned" class="text-xs bg-accent-danger text-white px-2 py-1 rounded">
                      Zablokowany
                    </span>
                    <span v-else class="text-xs bg-medical-green text-white px-2 py-1 rounded">
                      Aktywny
                    </span>
                  </td>
                  <td class="p-3 text-xs">{{ formatDate(user.createdAt) }}</td>
                  <td class="p-3">
                    <div class="flex gap-1">
                      <button
                        v-if="!user.banned"
                        @click="banUserConfirm(user)"
                        class="btn btn-danger text-xs"
                      >
                        🚫 Zablokuj
                      </button>
                      <button
                        v-else
                        @click="unbanUserConfirm(user)"
                        class="btn btn-success text-xs"
                      >
                        ✅ Odblokuj
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Activities Tab -->
      <div v-if="activeTab === 'activities'" class="space-y-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">📈 Ostatnie aktywności</h3>
            <button @click="loadActivities" class="btn btn-secondary">
              🔄 Odśwież
            </button>
          </div>

          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="activity in superAdminStore.recentActivities"
              :key="`${activity.ambulanceId}-${activity.id}`"
              class="flex items-center gap-3 p-3 bg-bg-tertiary rounded"
            >
              <div class="text-lg">{{ getActivityIcon(activity.type) }}</div>
              <div class="flex-1">
                <div class="font-medium text-sm">{{ activity.userName }}</div>
                <div class="text-xs text-text-secondary">{{ activity.details }}</div>
                <div class="text-xs text-text-muted">
                  {{ activity.ambulanceName }} • {{ formatTimestamp(activity.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-bg-secondary rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-accent-danger">⚠️ Potwierdź usunięcie</h3>
        <p class="text-text-secondary mb-6">
          Czy na pewno chcesz usunąć karetkę <strong>"{{ ambulanceToDelete?.name }}"</strong>?<br>
          <span class="text-accent-warning">Ta akcja jest nieodwracalna!</span>
        </p>
        <div class="flex gap-4 justify-end">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            Anuluj
          </button>
          <button @click="confirmDeleteAmbulance" class="btn btn-danger">
            🗑️ Usuń karetkę
          </button>
        </div>
      </div>
    </div>

    <!-- Ban User Modal -->
    <div v-if="showBanModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-bg-secondary rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-accent-danger">🚫 Potwierdź blokadę</h3>
        <p class="text-text-secondary mb-6">
          Czy na pewno chcesz zablokować użytkownika <strong>"{{ userToBan?.displayName }}"</strong>?<br>
          <span class="text-accent-warning">Użytkownik nie będzie mógł korzystać z aplikacji.</span>
        </p>
        <div class="flex gap-4 justify-end">
          <button @click="showBanModal = false" class="btn btn-secondary">
            Anuluj
          </button>
          <button @click="confirmBanUser" class="btn btn-danger">
            🚫 Zablokuj użytkownika
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useSuperAdminStore } from '../stores/superAdmin.js'

const router = useRouter()
const authStore = useAuthStore()
const superAdminStore = useSuperAdminStore()

const activeTab = ref('overview')
const showDeleteModal = ref(false)
const showBanModal = ref(false)
const ambulanceToDelete = ref(null)
const userToBan = ref(null)

onMounted(async () => {
  // Check if user is super admin
  if (!superAdminStore.isSuperAdmin) {
    router.push('/')
    return
  }

  // Load initial data
  await refreshAllData()
})

const refreshAllData = async () => {
  await Promise.all([
    superAdminStore.loadAppStats(),
    superAdminStore.loadAllUsers(),
    superAdminStore.loadAllAmbulances(),
    superAdminStore.loadRecentActivities()
  ])
}

const loadAmbulances = () => {
  superAdminStore.loadAllAmbulances()
}

const loadUsers = () => {
  superAdminStore.loadAllUsers()
}

const loadActivities = () => {
  superAdminStore.loadRecentActivities()
}

const deleteAmbulanceConfirm = (ambulance) => {
  ambulanceToDelete.value = ambulance
  showDeleteModal.value = true
}

const confirmDeleteAmbulance = async () => {
  try {
    await superAdminStore.deleteAmbulance(ambulanceToDelete.value.id)
    showDeleteModal.value = false
    ambulanceToDelete.value = null
  } catch (error) {
    console.error('Error deleting ambulance:', error)
  }
}

const banUserConfirm = (user) => {
  userToBan.value = user
  showBanModal.value = true
}

const confirmBanUser = async () => {
  try {
    await superAdminStore.banUser(userToBan.value.id)
    showBanModal.value = false
    userToBan.value = null
  } catch (error) {
    console.error('Error banning user:', error)
  }
}

const unbanUserConfirm = async (user) => {
  if (confirm(`Czy na pewno chcesz odblokować użytkownika "${user.displayName}"?`)) {
    try {
      await superAdminStore.unbanUser(user.id)
    } catch (error) {
      console.error('Error unbanning user:', error)
    }
  }
}

const exportData = () => {
  const data = {
    stats: superAdminStore.stats,
    users: superAdminStore.allUsers.length,
    ambulances: superAdminStore.allAmbulances.length,
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `apteczka-karetki-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('pl-PL')
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('pl-PL')
}

const getActivityIcon = (type) => {
  const icons = {
    ambulance_created: '🚑',
    user_joined: '👤',
    item_added: '➕',
    item_updated: '✏️',
    item_used: '✅',
    item_expired: '⚠️',
    item_deleted: '🗑️'
  }
  return icons[type] || '📝'
}
</script>

<style scoped>
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.z-50 {
  z-index: 50;
}

.max-h-96 {
  max-height: 24rem;
}

.overflow-y-auto {
  overflow-y: auto;
}

.overflow-x-auto {
  overflow-x: auto;
}

table {
  min-width: 800px;
}
</style>