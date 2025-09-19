<template>
  <div class="relative">
    <button
      @click="toggleNotifications"
      class="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
      :class="{ 'text-accent-warning': hasUnreadNotifications }"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- Notification badge -->
      <span
        v-if="notificationCount > 0"
        class="absolute -top-1 -right-1 bg-accent-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
      >
        {{ notificationCount > 9 ? '9+' : notificationCount }}
      </span>
    </button>

    <!-- Notification dropdown -->
    <div
      v-if="showNotifications"
      class="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-color rounded-lg shadow-lg z-50"
    >
      <div class="p-4 border-b border-border-color">
        <div class="flex justify-between items-center">
          <h3 class="font-semibold">Powiadomienia</h3>
          <button
            v-if="notifications.length > 0"
            @click="clearAllNotifications"
            class="text-sm text-accent-primary hover:text-accent-secondary"
          >
            Wyczyść wszystkie
          </button>
        </div>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="notifications.length === 0" class="p-4 text-center text-text-muted">
          Brak powiadomień
        </div>

        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="p-4 border-b border-border-color hover:bg-bg-tertiary cursor-pointer"
          :class="{ 'bg-bg-tertiary': !notification.read }"
          @click="markAsRead(notification.id)"
        >
          <div class="flex items-start gap-3">
            <div class="text-lg">{{ getNotificationIcon(notification.type) }}</div>
            <div class="flex-1">
              <h4 class="font-medium text-sm">{{ notification.title }}</h4>
              <p class="text-xs text-text-secondary mt-1">{{ notification.message }}</p>
              <p class="text-xs text-text-muted mt-2">{{ formatTime(notification.timestamp) }}</p>
            </div>
            <div v-if="!notification.read" class="w-2 h-2 bg-accent-primary rounded-full"></div>
          </div>
        </div>
      </div>

      <div class="p-3 border-t border-border-color">
        <button
          @click="requestNotificationPermission"
          v-if="!hasNotificationPermission"
          class="text-sm text-accent-primary hover:text-accent-secondary"
        >
          Włącz powiadomienia przeglądarki
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAmbulanceStore } from '../stores/ambulance.js'
import { notificationService } from '../services/notifications.js'

const ambulanceStore = useAmbulanceStore()

const showNotifications = ref(false)
const notifications = ref([])
const lastChecked = ref(new Date())

const notificationCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const hasUnreadNotifications = computed(() => {
  return notificationCount.value > 0
})

const hasNotificationPermission = computed(() => {
  return notificationService.permission === 'granted'
})

let checkInterval = null

onMounted(() => {
  loadNotifications()
  startPeriodicCheck()

  // Close dropdown when clicking outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
  document.removeEventListener('click', handleClickOutside)
})

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showNotifications.value = false
  }
}

const loadNotifications = () => {
  // Load notifications from localStorage
  const stored = localStorage.getItem('ambulance-notifications')
  if (stored) {
    notifications.value = JSON.parse(stored)
    // Sort by timestamp descending (newest first)
    notifications.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }
}

const saveNotifications = () => {
  // Sort by timestamp descending (newest first) before saving
  notifications.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  localStorage.setItem('ambulance-notifications', JSON.stringify(notifications.value))
}

const addNotification = (type, title, message) => {
  const notification = {
    id: Date.now() + Math.random(),
    type,
    title,
    message,
    timestamp: new Date(),
    read: false
  }

  notifications.value.unshift(notification)

  // Keep only last 50 notifications
  if (notifications.value.length > 50) {
    notifications.value = notifications.value.slice(0, 50)
  }

  saveNotifications()
}

const markAsRead = (id) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
    saveNotifications()
  }
}

const clearAllNotifications = () => {
  notifications.value = []
  saveNotifications()
}

const startPeriodicCheck = () => {
  // Check for expiring items every 5 minutes
  checkInterval = setInterval(() => {
    checkForExpiringItems()
  }, 5 * 60 * 1000)

  // Initial check
  checkForExpiringItems()
}

const checkForExpiringItems = () => {
  if (!ambulanceStore.currentAmbulance || !ambulanceStore.inventory) return

  const notificationDays = ambulanceStore.currentAmbulance.settings?.notificationDays || 30
  const warningDate = new Date()
  warningDate.setDate(warningDate.getDate() + notificationDays)

  ambulanceStore.inventory.forEach(item => {
    if (item.status === 'used' || item.status === 'expired') return
    if (!item.expirationDate) return

    const expDate = item.expirationDate.toDate ? item.expirationDate.toDate() : new Date(item.expirationDate)
    const today = new Date()

    if (expDate <= warningDate && expDate >= today) {
      const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))

      // Check if we already notified about this item recently
      const recentNotification = notifications.value.find(n =>
        n.type === 'expiring' &&
        n.message.includes(item.name) &&
        new Date() - new Date(n.timestamp) < 24 * 60 * 60 * 1000 // 24 hours
      )

      if (!recentNotification) {
        addNotification(
          'expiring',
          'Przedmiot wygasa wkrótce!',
          `${item.name} wygasa za ${daysUntil} dni (${formatDate(expDate)})`
        )

        // Also show browser notification if permitted
        if (hasNotificationPermission.value) {
          notificationService.showExpirationWarning(item, daysUntil)
        }
      }
    }
  })
}

const requestNotificationPermission = async () => {
  await notificationService.requestPermission()
}

const getNotificationIcon = (type) => {
  const icons = {
    expiring: '⚠️',
    item_added: '➕',
    item_used: '✅',
    member_joined: '👤',
    general: '📢'
  }
  return icons[type] || '📢'
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
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

const formatDate = (date) => {
  return date.toLocaleDateString('pl-PL')
}

// Watch for new activities and create notifications
const unwatchActivities = ambulanceStore.$subscribe((mutation, state) => {
  try {
    if (mutation.events && Array.isArray(mutation.events) && mutation.events.some(e => e.key === 'activities')) {
      const newActivities = state.activities?.filter(activity =>
        new Date(activity.timestamp?.toDate ? activity.timestamp.toDate() : activity.timestamp) > lastChecked.value
      ) || []

      newActivities.forEach(activity => {
        if (activity.userId !== ambulanceStore.authStore?.user?.uid) {
          addNotification(
            activity.type,
            getActivityTitle(activity.type),
            activity.details
          )
        }
      })

      lastChecked.value = new Date()
    }
  } catch (error) {
    console.error('Error in activity subscription:', error)
  }
})

const getActivityTitle = (type) => {
  const titles = {
    item_added: 'Dodano przedmiot',
    item_used: 'Użyto przedmiot',
    item_updated: 'Zaktualizowano przedmiot',
    user_joined: 'Nowy członek',
    item_expired: 'Przedmiot przeterminowany'
  }
  return titles[type] || 'Nowa aktywność'
}
</script>

<style scoped>
.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.w-2 {
  width: 0.5rem;
}

.h-2 {
  height: 0.5rem;
}

.w-80 {
  width: 20rem;
}

.max-h-96 {
  max-height: 24rem;
}

.z-50 {
  z-index: 50;
}

.-top-1 {
  top: -0.25rem;
}

.-right-1 {
  right: -0.25rem;
}

.top-full {
  top: 100%;
}
</style>