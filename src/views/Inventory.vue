<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-bg-secondary border-b border-border-color">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <router-link :to="`/ambulance/${route.params.id}`" class="btn btn-secondary">← Powrót</router-link>
            <div>
              <h1 class="text-xl font-semibold">💊 Inwentarz leków</h1>
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
    <!-- Drug List for Adding Inventory (Admin Only) -->
    <div v-if="ambulanceStore.isAdmin" class="card">
      <h3 class="text-lg font-semibold mb-4">💊 Dodaj leki do inwentarza</h3>

      <!-- Search and Filter -->
      <div class="mb-4">
        <div class="flex gap-4 mb-3">
          <input
            v-model="drugSearchQuery"
            type="text"
            class="form-input flex-1"
            placeholder="🔍 Szukaj leku..."
          />
          <select v-model="categoryFilter" class="form-input">
            <option value="">Wszystkie kategorie</option>
            <option v-for="category in drugCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>

      <!-- Drugs Grid -->
      <div class="grid gap-3 max-h-96 overflow-y-auto">
        <div
          v-for="drug in filteredDrugList"
          :key="drug.id"
          class="flex items-center gap-4 p-3 bg-bg-tertiary rounded border hover:border-accent-primary transition-colors"
        >
          <!-- Drug Info -->
          <div class="flex-1">
            <div class="font-medium">{{ drug.nazwa_polska }}</div>
            <div class="text-sm text-text-secondary">{{ drug.nazwa_miedzynarodowa }}</div>
            <div class="text-xs text-text-muted">
              {{ drug.postac }} • {{ drug.kategoria }}
              <span v-if="drug.uwagi" class="text-accent-warning ml-1">⚠️</span>
            </div>
          </div>

          <!-- Quantity Input -->
          <div class="w-20">
            <input
              v-model.number="drugQuantities[drug.id]"
              type="number"
              min="1"
              class="form-input text-center text-sm"
              placeholder="Ilość"
            />
            <div class="text-xs text-center text-text-muted mt-1">{{ drug.jednostka }}</div>
          </div>

          <!-- Expiration Date -->
          <div class="w-36">
            <input
              v-model="drugExpirations[drug.id]"
              type="date"
              class="form-input text-sm"
            />
          </div>

          <!-- Add Button -->
          <button
            @click="addDrugToInventory(drug)"
            :disabled="!drugQuantities[drug.id] || !drugExpirations[drug.id] || inventoryStore.loading"
            class="btn btn-primary text-xs"
          >
            {{ inventoryStore.loading ? '...' : '➕' }}
          </button>
        </div>
      </div>

      <div v-if="inventoryStore.error" class="alert alert-error mt-4">
        {{ inventoryStore.error }}
      </div>
    </div>


    <!-- Filters and Search -->
    <div class="card">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="Szukaj przedmiotów..."
          />
        </div>
        <div class="flex gap-2">
          <select v-model="statusFilter" class="form-input">
            <option value="">Wszystkie</option>
            <option value="active">Aktywne</option>
            <option value="expired">Przeterminowane</option>
            <option value="used">Użyte</option>
          </select>
          <button
            @click="sortBy = sortBy === 'expiration' ? 'name' : 'expiration'"
            class="btn btn-secondary"
          >
            Sortuj: {{ sortBy === 'expiration' ? 'Data ważności' : 'Nazwa' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Inventory List -->
    <div class="space-y-4">
      <div v-if="filteredInventory.length === 0" class="card text-center py-8">
        <p class="text-text-muted">
          {{ ambulanceStore.inventory.length === 0 ? 'Brak przedmiotów w inwentarzu' : 'Brak pasujących przedmiotów' }}
        </p>
      </div>

      <div
        v-for="item in filteredInventory"
        :key="item.id"
        class="card border-l-4"
        :class="{
          'border-l-accent-danger': isExpired(item.expirationDate),
          'border-l-accent-warning': isExpiringSoon(item.expirationDate),
          'border-l-accent-success': !isExpired(item.expirationDate) && !isExpiringSoon(item.expirationDate),
          'border-l-gray-500': item.status === 'used' || item.status === 'expired'
        }"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h4 class="font-semibold text-lg">{{ item.name }}</h4>
              <span
                v-if="item.drugInfo?.kategoria"
                class="text-xs bg-medical-blue text-white px-2 py-1 rounded"
                :title="item.drugInfo.nazwa_miedzynarodowa"
              >
                {{ item.drugInfo.kategoria }}
              </span>
              <span
                v-if="item.status === 'expired'"
                class="text-xs bg-accent-danger text-white px-2 py-1 rounded"
              >
                Przeterminowane
              </span>
              <span
                v-else-if="item.status === 'used'"
                class="text-xs bg-gray-500 text-white px-2 py-1 rounded"
              >
                Użyte
              </span>
              <span
                v-else-if="isExpired(item.expirationDate)"
                class="text-xs bg-accent-danger text-white px-2 py-1 rounded"
              >
                Wygasłe
              </span>
              <span
                v-else-if="isExpiringSoon(item.expirationDate)"
                class="text-xs bg-accent-warning text-white px-2 py-1 rounded"
              >
                Wygasa wkrótce
              </span>
            </div>

            <!-- Drug information for predefined drugs -->
            <div v-if="item.drugInfo" class="mb-2">
              <div class="text-sm text-text-secondary">{{ item.drugInfo.nazwa_miedzynarodowa }}</div>
              <div class="text-xs text-text-muted">{{ item.drugInfo.postac }}</div>
              <div v-if="item.drugInfo.uwagi" class="text-xs text-accent-warning mt-1">
                ⚠️ {{ item.drugInfo.uwagi }}
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-text-muted">Ilość:</span>
                <span class="font-medium ml-1">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              <div>
                <span class="text-text-muted">Ważność:</span>
                <span class="font-medium ml-1">{{ formatDate(item.expirationDate) }}</span>
              </div>
              <div v-if="item.batchNumber">
                <span class="text-text-muted">Partia:</span>
                <span class="font-medium ml-1">{{ item.batchNumber }}</span>
              </div>
              <div>
                <span class="text-text-muted">Dodane przez:</span>
                <span class="font-medium ml-1">{{ item.addedByName }}</span>
              </div>
            </div>

            <div v-if="item.notes" class="mt-2 text-sm text-text-secondary">
              <span class="text-text-muted">Notatki:</span> {{ item.notes }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 ml-4">
            <button
              @click="openEditModal(item)"
              class="btn btn-secondary text-xs"
            >
              Edytuj
            </button>

            <button
              v-if="item.status !== 'used'"
              @click="markAsUsed(item)"
              class="btn btn-secondary text-xs"
            >
              Oznacz jako użyte
            </button>

            <button
              v-if="item.status !== 'expired' && !isExpired(item.expirationDate)"
              @click="markAsExpired(item)"
              class="btn btn-warning text-xs"
            >
              Oznacz jako przeterminowane
            </button>

            <button
              v-if="ambulanceStore.isAdmin"
              @click="deleteItem(item)"
              class="btn btn-danger text-xs"
            >
              Usuń
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-bg-secondary rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">Edytuj przedmiot</h3>

        <form @submit.prevent="handleUpdateItem" class="space-y-4">
          <div class="form-group">
            <label class="form-label">Nazwa</label>
            <input
              v-model="editingItem.name"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Ilość</label>
            <input
              v-model.number="editingItem.quantity"
              type="number"
              min="1"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Jednostka</label>
            <input
              v-model="editingItem.unit"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Data ważności</label>
            <input
              v-model="editingItem.expirationDate"
              type="date"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Numer partii</label>
            <input
              v-model="editingItem.batchNumber"
              type="text"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Notatki</label>
            <input
              v-model="editingItem.notes"
              type="text"
              class="form-input"
            />
          </div>

          <div class="flex gap-4 justify-end">
            <button type="button" @click="closeEditModal" class="btn btn-secondary">
              Anuluj
            </button>
            <button type="submit" :disabled="inventoryStore.loading" class="btn btn-primary">
              {{ inventoryStore.loading ? 'Zapisywanie...' : 'Zapisz' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAmbulanceStore } from '../stores/ambulance.js'
import { useInventoryStore } from '../stores/inventory.js'
import { polishDrugs, searchDrugs } from '../data/polishDrugs.js'
import NotificationBell from '../components/NotificationBell.vue'

const route = useRoute()
const authStore = useAuthStore()
const ambulanceStore = useAmbulanceStore()
const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('expiration')
const showEditModal = ref(false)
const editingItem = ref({})

// Drug list interface
const drugSearchQuery = ref('')
const categoryFilter = ref('')
const drugQuantities = ref({})
const drugExpirations = ref({})

onMounted(() => {
  // Component initialization
})

// Drug categories computed property
const drugCategories = computed(() => {
  const categories = [...new Set(polishDrugs.map(drug => drug.kategoria))].filter(Boolean)
  return categories.sort()
})

// Filtered drug list for the new interface
const filteredDrugList = computed(() => {
  let drugs = polishDrugs

  // Filter by search query
  if (drugSearchQuery.value) {
    const query = drugSearchQuery.value.toLowerCase()
    drugs = drugs.filter(drug =>
      drug.nazwa_polska.toLowerCase().includes(query) ||
      drug.nazwa_miedzynarodowa.toLowerCase().includes(query) ||
      drug.nazwa_handlowa?.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (categoryFilter.value) {
    drugs = drugs.filter(drug => drug.kategoria === categoryFilter.value)
  }

  return drugs.sort((a, b) => a.nazwa_polska.localeCompare(b.nazwa_polska))
})

// Add drug to inventory
const addDrugToInventory = async (drug) => {
  const quantity = drugQuantities.value[drug.id]
  const expirationDate = drugExpirations.value[drug.id]

  if (!quantity || !expirationDate) {
    alert('Proszę wprowadzić ilość i datę ważności')
    return
  }

  try {
    const drugInfo = {
      nazwa_miedzynarodowa: drug.nazwa_miedzynarodowa,
      postac: drug.postac,
      kategoria: drug.kategoria
    }

    // Only add fields that are not undefined/null
    if (drug.nazwa_handlowa) {
      drugInfo.nazwa_handlowa = drug.nazwa_handlowa
    }
    if (drug.uwagi) {
      drugInfo.uwagi = drug.uwagi
    }

    const itemData = {
      name: drug.nazwa_polska,
      quantity: quantity,
      unit: drug.jednostka,
      expirationDate: expirationDate,
      status: 'active',
      drugInfo: drugInfo
    }

    await inventoryStore.addItem(route.params.id, itemData)

    // Clear the inputs for this drug
    drugQuantities.value[drug.id] = null
    drugExpirations.value[drug.id] = ''

  } catch (error) {
    console.error('Error adding drug to inventory:', error)
  }
}


const filteredInventory = computed(() => {
  let items = ambulanceStore.inventory || []

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.batchNumber?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    items = items.filter(item => {
      if (statusFilter.value === 'active') {
        return !item.status || item.status === 'active'
      }
      return item.status === statusFilter.value
    })
  }

  // Sort items
  items.sort((a, b) => {
    if (sortBy.value === 'expiration') {
      const dateA = new Date(a.expirationDate)
      const dateB = new Date(b.expirationDate)
      return dateA - dateB
    } else {
      return a.name.localeCompare(b.name)
    }
  })

  return items
})


const openEditModal = (item) => {
  editingItem.value = {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    expirationDate: item.expirationDate,
    batchNumber: item.batchNumber || '',
    notes: item.notes || ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingItem.value = {}
}

const handleUpdateItem = async () => {
  try {
    await inventoryStore.updateItem(route.params.id, editingItem.value.id, {
      name: editingItem.value.name,
      quantity: editingItem.value.quantity,
      unit: editingItem.value.unit,
      expirationDate: editingItem.value.expirationDate,
      batchNumber: editingItem.value.batchNumber,
      notes: editingItem.value.notes
    })
    closeEditModal()
  } catch (error) {
    console.error('Error updating item:', error)
  }
}

const markAsUsed = async (item) => {
  try {
    await inventoryStore.markAsUsed(route.params.id, item.id, item.name, item.quantity)
    await inventoryStore.updateItem(route.params.id, item.id, { status: 'used' })
  } catch (error) {
    console.error('Error marking as used:', error)
  }
}

const markAsExpired = async (item) => {
  try {
    await inventoryStore.markAsExpired(route.params.id, item.id, item.name)
  } catch (error) {
    console.error('Error marking as expired:', error)
  }
}

const deleteItem = async (item) => {
  if (confirm(`Czy na pewno chcesz usunąć "${item.name}"?`)) {
    try {
      await inventoryStore.deleteItem(route.params.id, item.id, item.name)
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }
}

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
</script>

<style scoped>
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .md\\:flex-row {
    flex-direction: row;
  }

  .md\\:items-center {
    align-items: center;
  }

  .md\\:justify-between {
    justify-content: space-between;
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

.max-h-screen {
  max-height: 100vh;
}

.overflow-y-auto {
  overflow-y: auto;
}

.max-h-60 {
  max-height: 15rem;
}

.z-10 {
  z-index: 10;
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

.top-2 {
  top: 0.5rem;
}

.right-2 {
  right: 0.5rem;
}
</style>