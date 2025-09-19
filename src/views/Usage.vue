<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-bg-secondary border-b border-border-color">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <router-link :to="`/ambulance/${route.params.id}`" class="btn btn-secondary">← Powrót</router-link>
            <div>
              <h1 class="text-xl font-semibold">🏥 Zużycie leków</h1>
              <p class="text-sm text-text-secondary">{{ ambulanceStore.currentAmbulance?.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <NotificationBell />
            <span class="text-sm text-text-secondary">{{ authStore.user?.displayName }}</span>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-6 space-y-6">
    <!-- Usage Header -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">🏥 Zużycie leków</h2>
          <p class="text-text-secondary mt-1">
            Rejestruj zużyte leki i automatycznie aktualizuj inwentarz
          </p>
        </div>
        <div class="text-sm text-text-muted">
          Karetka: <span class="font-medium">{{ ambulanceStore.currentAmbulance?.name }}</span>
        </div>
      </div>
    </div>

    <!-- Drug Usage Section -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">Wybierz lek do zużycia</h3>

      <!-- Usage Search -->
      <div class="mb-4">
        <div class="relative">
          <input
            v-model="usageSearchQuery"
            @input="filterAvailableDrugs"
            @focus="showUsageDropdown = true"
            type="text"
            class="form-input w-full"
            placeholder="🔍 Szukaj leku do zużycia..."
          />

          <!-- Usage Dropdown -->
          <div
            v-if="showUsageDropdown && filteredUsageDrugs.length > 0"
            class="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-color rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
          >
            <div
              v-for="item in filteredUsageDrugs"
              :key="item.id"
              @click="selectDrugForUsage(item)"
              class="p-3 hover:bg-bg-tertiary cursor-pointer border-b border-border-color last:border-b-0"
            >
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-sm text-text-secondary">
                Dostępne: {{ item.quantity }} {{ item.unit }}
                <span class="ml-2 text-text-muted">{{ formatDate(item.expirationDate) }}</span>
              </div>
              <div v-if="item.drugInfo" class="text-xs text-text-muted">
                {{ item.drugInfo.nazwa_miedzynarodowa }} • {{ item.drugInfo.kategoria }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="usageSearchQuery && filteredUsageDrugs.length === 0 && !showUsageDropdown" class="text-text-muted text-sm mt-2">
          Nie znaleziono dostępnych leków pasujących do wyszukiwania
        </div>
      </div>

      <!-- Selected Drug for Usage -->
      <div v-if="selectedUsageDrug" class="bg-bg-tertiary rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4 class="font-semibold">{{ selectedUsageDrug.name }}</h4>
            <div class="text-sm text-text-secondary">
              Dostępne: {{ selectedUsageDrug.quantity }} {{ selectedUsageDrug.unit }}
            </div>
            <div class="text-xs text-text-muted">
              Ważność: {{ formatDate(selectedUsageDrug.expirationDate) }}
              <span v-if="selectedUsageDrug.batchNumber" class="ml-2">
                • Partia: {{ selectedUsageDrug.batchNumber }}
              </span>
            </div>
            <div v-if="selectedUsageDrug.drugInfo" class="text-xs text-text-muted mt-1">
              {{ selectedUsageDrug.drugInfo.nazwa_miedzynarodowa }} • {{ selectedUsageDrug.drugInfo.kategoria }}
              <span v-if="selectedUsageDrug.drugInfo.uwagi" class="text-accent-warning ml-1">
                ⚠️ {{ selectedUsageDrug.drugInfo.uwagi }}
              </span>
            </div>
          </div>
          <button
            @click="clearUsageSelection"
            class="text-text-muted hover:text-text-secondary"
          >
            ✕
          </button>
        </div>

        <!-- Usage Amount Input -->
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="form-label">Ilość zużyta</label>
            <input
              v-model.number="usageAmount"
              type="number"
              :max="selectedUsageDrug.quantity"
              min="1"
              step="1"
              class="form-input"
              :placeholder="`Max: ${selectedUsageDrug.quantity}`"
            />
          </div>
          <div class="w-20 text-center">
            <div class="text-xs text-text-muted mb-1">Jednostka</div>
            <div class="text-sm font-medium">{{ selectedUsageDrug.unit }}</div>
          </div>
          <button
            @click="confirmUsage"
            :disabled="!usageAmount || usageAmount > selectedUsageDrug.quantity || usageAmount < 1 || inventoryStore.loading"
            class="btn btn-primary"
          >
            {{ inventoryStore.loading ? 'Zapisywanie...' : 'Potwierdź zużycie' }}
          </button>
        </div>

        <div v-if="usageAmount && usageAmount > selectedUsageDrug.quantity" class="text-accent-danger text-sm mt-2">
          ⚠️ Nie można zużyć więcej niż dostępna ilość ({{ selectedUsageDrug.quantity }})
        </div>
      </div>

      <div v-if="inventoryStore.error" class="alert alert-error">
        {{ inventoryStore.error }}
      </div>
    </div>

    <!-- Recent Usage History -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">📋 Ostatnie zużycie</h3>

      <div v-if="recentUsageActivities.length === 0" class="text-center py-8 text-text-muted">
        Brak ostatnich zapisów zużycia
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="activity in recentUsageActivities"
          :key="activity.id"
          class="flex items-center justify-between p-3 bg-bg-tertiary rounded border-l-4 border-l-accent-success"
        >
          <div class="flex-1">
            <div class="font-medium">{{ activity.details }}</div>
            <div class="text-sm text-text-secondary">
              przez {{ activity.userName }} • {{ formatTime(activity.timestamp) }}
            </div>
          </div>
          <div class="text-2xl">✅</div>
        </div>
      </div>
    </div>

    <!-- Available Inventory Summary -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">📦 Dostępne leki</h3>

      <div v-if="availableInventoryCount === 0" class="text-center py-8 text-text-muted">
        Brak dostępnych leków w inwentarzu
      </div>

      <div v-else class="grid gap-3">
        <div class="text-sm text-text-secondary mb-2">
          Łącznie dostępnych pozycji: {{ availableInventoryCount }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="item in availableInventorySummary"
            :key="item.id"
            class="p-3 bg-bg-tertiary rounded border"
            :class="{
              'border-l-accent-warning border-l-4': isExpiringSoon(item.expirationDate),
              'border-l-accent-success border-l-4': !isExpiringSoon(item.expirationDate)
            }"
          >
            <div class="font-medium text-sm">{{ item.name }}</div>
            <div class="text-xs text-text-secondary">
              {{ item.quantity }} {{ item.unit }}
            </div>
            <div class="text-xs text-text-muted">
              {{ formatDate(item.expirationDate) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAmbulanceStore } from '../stores/ambulance.js'
import { useInventoryStore } from '../stores/inventory.js'
import NotificationBell from '../components/NotificationBell.vue'

const route = useRoute()
const authStore = useAuthStore()
const ambulanceStore = useAmbulanceStore()
const inventoryStore = useInventoryStore()

// Usage functionality
const usageSearchQuery = ref('')
const showUsageDropdown = ref(false)
const selectedUsageDrug = ref(null)
const usageAmount = ref(null)
const filteredUsageDrugs = ref([])

let clickOutsideHandler = null

onMounted(() => {
  // Close dropdowns when clicking outside
  clickOutsideHandler = (event) => {
    if (!event.target.closest('.relative')) {
      showUsageDropdown.value = false
    }
  }
  document.addEventListener('click', clickOutsideHandler)
})

onUnmounted(() => {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler)
  }
})

// Usage functions
const filterAvailableDrugs = () => {
  if (!usageSearchQuery.value) {
    filteredUsageDrugs.value = []
    return
  }

  const query = usageSearchQuery.value.toLowerCase()
  const availableItems = ambulanceStore.inventory?.filter(item =>
    item.status !== 'used' &&
    item.status !== 'expired' &&
    !isExpired(item.expirationDate) &&
    item.quantity > 0 &&
    (item.name.toLowerCase().includes(query) ||
     item.drugInfo?.nazwa_miedzynarodowa?.toLowerCase().includes(query) ||
     item.drugInfo?.nazwa_handlowa?.toLowerCase().includes(query))
  ) || []

  // Sort by expiration date (use earliest expiring first)
  filteredUsageDrugs.value = availableItems
    .sort((a, b) => {
      const dateA = new Date(a.expirationDate)
      const dateB = new Date(b.expirationDate)
      return dateA - dateB
    })
    .slice(0, 10) // Limit to 10 results
}

const selectDrugForUsage = (item) => {
  selectedUsageDrug.value = item
  usageSearchQuery.value = item.name
  usageAmount.value = null
  showUsageDropdown.value = false
}

const clearUsageSelection = () => {
  selectedUsageDrug.value = null
  usageSearchQuery.value = ''
  usageAmount.value = null
  filteredUsageDrugs.value = []
}

const confirmUsage = async () => {
  if (!selectedUsageDrug.value || !usageAmount.value) return

  if (usageAmount.value > selectedUsageDrug.value.quantity) {
    alert('Nie można zużyć więcej niż dostępna ilość')
    return
  }

  try {
    const item = selectedUsageDrug.value
    const usedQuantity = usageAmount.value
    const remainingQuantity = item.quantity - usedQuantity

    if (remainingQuantity === 0) {
      // Mark entire item as used
      await inventoryStore.markAsUsed(route.params.id, item.id, item.name, usedQuantity)
      await inventoryStore.updateItem(route.params.id, item.id, { status: 'used' })
    } else {
      // Update quantity and log usage
      await inventoryStore.updateItem(route.params.id, item.id, {
        quantity: remainingQuantity
      })
      await inventoryStore.markAsUsed(route.params.id, item.id, item.name, usedQuantity)
    }

    // Clear selection after successful usage
    clearUsageSelection()

  } catch (error) {
    console.error('Error recording drug usage:', error)
    alert('Błąd podczas zapisywania zużycia leku')
  }
}

// Computed properties for summaries
const recentUsageActivities = computed(() => {
  return ambulanceStore.activities
    ?.filter(activity => activity.type === 'item_used')
    ?.slice(0, 5) || []
})

const availableInventoryCount = computed(() => {
  return ambulanceStore.inventory?.filter(item =>
    item.status !== 'used' &&
    item.status !== 'expired' &&
    !isExpired(item.expirationDate) &&
    item.quantity > 0
  ).length || 0
})

const availableInventorySummary = computed(() => {
  const available = ambulanceStore.inventory?.filter(item =>
    item.status !== 'used' &&
    item.status !== 'expired' &&
    !isExpired(item.expirationDate) &&
    item.quantity > 0
  ) || []

  return available
    .sort((a, b) => {
      const dateA = new Date(a.expirationDate)
      const dateB = new Date(b.expirationDate)
      return dateA - dateB
    })
    .slice(0, 12) // Show max 12 items
})

// Utility functions
const isExpired = (expirationDate) => {
  if (!expirationDate) return false
  const expDate = expirationDate.toDate ? expirationDate.toDate() : new Date(expirationDate)
  return expDate < new Date()
}

const isExpiringSoon = (expirationDate) => {
  if (!expirationDate) return false
  const expDate = expirationDate.toDate ? expirationDate.toDate() : new Date(expirationDate)
  const warningDate = new Date()
  const notificationDays = ambulanceStore.currentAmbulance?.settings?.notificationDays || 30
  warningDate.setDate(warningDate.getDate() + notificationDays)
  return expDate <= warningDate && expDate >= new Date()
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('pl-PL')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) {
    return 'przed chwilą'
  } else if (diffMins < 60) {
    return `${diffMins} min temu`
  } else if (diffHours < 24) {
    return `${diffHours}h temu`
  } else if (diffDays < 7) {
    return `${diffDays} dni temu`
  } else {
    return date.toLocaleDateString('pl-PL')
  }
}
</script>

<style scoped>
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.top-full {
  top: 100%;
}

.left-0 {
  left: 0;
}

.right-0 {
  right: 0;
}

.z-10 {
  z-index: 10;
}

.max-h-60 {
  max-height: 15rem;
}

.overflow-y-auto {
  overflow-y: auto;
}

.border-l-4 {
  border-left-width: 4px;
}
</style>