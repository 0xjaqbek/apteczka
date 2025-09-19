<template>
  <div class="space-y-4">
    <!-- Filter -->
    <div class="card">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 class="text-lg font-semibold">Historia aktywności</h3>
        <select v-model="typeFilter" class="form-input md:w-auto">
          <option value="">Wszystkie aktywności</option>
          <option value="ambulance_created">Utworzenie karetki</option>
          <option value="user_joined">Dołączenie użytkownika</option>
          <option value="item_added">Dodanie przedmiotu</option>
          <option value="item_updated">Aktualizacja przedmiotu</option>
          <option value="item_used">Użycie przedmiotu</option>
          <option value="item_expired">Oznaczenie jako przeterminowane</option>
          <option value="item_deleted">Usunięcie przedmiotu</option>
        </select>
      </div>
    </div>

    <!-- Activities List -->
    <div class="space-y-3">
      <div v-if="filteredActivities.length === 0" class="card text-center py-8">
        <p class="text-text-muted">Brak aktywności do wyświetlenia</p>
      </div>

      <div
        v-for="activity in filteredActivities"
        :key="activity.id"
        class="card border-l-4"
        :class="getActivityBorderClass(activity.type)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg">{{ getActivityIcon(activity.type) }}</span>
              <span class="font-medium">{{ activity.userName }}</span>
              <span
                class="text-xs px-2 py-1 rounded"
                :class="getActivityTypeClass(activity.type)"
              >
                {{ getActivityTypeLabel(activity.type) }}
              </span>
            </div>

            <p class="text-text-secondary mb-2">{{ activity.details }}</p>

            <div class="text-xs text-text-muted">
              {{ formatTimestamp(activity.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button (if needed) -->
    <div v-if="hasMore" class="text-center">
      <button @click="loadMore" :disabled="loading" class="btn btn-secondary">
        {{ loading ? 'Ładowanie...' : 'Załaduj więcej' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAmbulanceStore } from '../stores/ambulance.js'

const ambulanceStore = useAmbulanceStore()

const typeFilter = ref('')
const loading = ref(false)
const hasMore = ref(false) // For future pagination

const filteredActivities = computed(() => {
  let activities = ambulanceStore.activities || []

  if (typeFilter.value) {
    activities = activities.filter(activity => activity.type === typeFilter.value)
  }

  return activities
})

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

const getActivityTypeLabel = (type) => {
  const labels = {
    ambulance_created: 'Utworzenie',
    user_joined: 'Dołączenie',
    item_added: 'Dodanie',
    item_updated: 'Aktualizacja',
    item_used: 'Użycie',
    item_expired: 'Wygaśnięcie',
    item_deleted: 'Usunięcie'
  }
  return labels[type] || 'Aktywność'
}

const getActivityTypeClass = (type) => {
  const classes = {
    ambulance_created: 'bg-accent-primary text-white',
    user_joined: 'bg-accent-success text-white',
    item_added: 'bg-accent-success text-white',
    item_updated: 'bg-blue-500 text-white',
    item_used: 'bg-gray-500 text-white',
    item_expired: 'bg-accent-warning text-white',
    item_deleted: 'bg-accent-danger text-white'
  }
  return classes[type] || 'bg-gray-500 text-white'
}

const getActivityBorderClass = (type) => {
  const classes = {
    ambulance_created: 'border-l-accent-primary',
    user_joined: 'border-l-accent-success',
    item_added: 'border-l-accent-success',
    item_updated: 'border-l-blue-500',
    item_used: 'border-l-gray-500',
    item_expired: 'border-l-accent-warning',
    item_deleted: 'border-l-accent-danger'
  }
  return classes[type] || 'border-l-gray-500'
}

const formatTimestamp = (timestamp) => {
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
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const loadMore = () => {
  // Implement pagination if needed
  loading.value = true
  // Simulate loading
  setTimeout(() => {
    loading.value = false
  }, 1000)
}
</script>

<style scoped>
@media (min-width: 768px) {
  .md\\:flex-row {
    flex-direction: row;
  }

  .md\\:items-center {
    align-items: center;
  }

  .md\\:justify-between {
    justify-content: space-between;
  }

  .md\\:w-auto {
    width: auto;
  }
}
</style>