import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../services/firebase.js'
import { useAuthStore } from './auth.js'

export const useSuperAdminStore = defineStore('superAdmin', () => {
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref(null)

  // App statistics
  const stats = ref({
    totalUsers: 0,
    totalAmbulances: 0,
    totalInventoryItems: 0,
    totalActivities: 0,
    activeUsers: 0,
    expiringItems: 0
  })

  // Data collections
  const allUsers = ref([])
  const allAmbulances = ref([])
  const recentActivities = ref([])

  // Super admin emails - you can add your email here
  const SUPER_ADMIN_EMAILS = [
    'jaqbek.eth@gmail.com'  // Add more super admin emails as needed
  ]

  const isSuperAdmin = computed(() => {
    return SUPER_ADMIN_EMAILS.includes(authStore.user?.email)
  })

  // Load app statistics
  const loadAppStats = async () => {
    try {
      loading.value = true
      error.value = null

      // Count users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      stats.value.totalUsers = usersSnapshot.size

      // Count ambulances
      const ambulancesSnapshot = await getDocs(collection(db, 'ambulances'))
      stats.value.totalAmbulances = ambulancesSnapshot.size

      // Count inventory items across all ambulances
      let inventoryCount = 0
      let expiringCount = 0
      const warningDate = new Date()
      warningDate.setDate(warningDate.getDate() + 30)

      for (const ambulanceDoc of ambulancesSnapshot.docs) {
        const inventorySnapshot = await getDocs(
          collection(db, 'ambulances', ambulanceDoc.id, 'inventory')
        )
        inventoryCount += inventorySnapshot.size

        // Check for expiring items
        inventorySnapshot.docs.forEach(itemDoc => {
          const item = itemDoc.data()
          if (item.expirationDate) {
            const expDate = item.expirationDate.toDate ? item.expirationDate.toDate() : new Date(item.expirationDate)
            if (expDate <= warningDate && expDate >= new Date()) {
              expiringCount++
            }
          }
        })
      }

      stats.value.totalInventoryItems = inventoryCount
      stats.value.expiringItems = expiringCount

      // Count recent activities (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      let activitiesCount = 0
      for (const ambulanceDoc of ambulancesSnapshot.docs) {
        const activitiesSnapshot = await getDocs(
          query(
            collection(db, 'ambulances', ambulanceDoc.id, 'activities'),
            where('timestamp', '>=', sevenDaysAgo)
          )
        )
        activitiesCount += activitiesSnapshot.size
      }
      stats.value.totalActivities = activitiesCount

      // Count active users (users with activities in last 7 days)
      const activeUserIds = new Set()
      for (const ambulanceDoc of ambulancesSnapshot.docs) {
        const activitiesSnapshot = await getDocs(
          query(
            collection(db, 'ambulances', ambulanceDoc.id, 'activities'),
            where('timestamp', '>=', sevenDaysAgo)
          )
        )
        activitiesSnapshot.docs.forEach(doc => {
          activeUserIds.add(doc.data().userId)
        })
      }
      stats.value.activeUsers = activeUserIds.size

    } catch (err) {
      error.value = 'Błąd podczas ładowania statystyk: ' + err.message
    } finally {
      loading.value = false
    }
  }

  // Load all users
  const loadAllUsers = async () => {
    try {
      loading.value = true
      const usersSnapshot = await getDocs(collection(db, 'users'))

      allUsers.value = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

    } catch (err) {
      error.value = 'Błąd podczas ładowania użytkowników: ' + err.message
    } finally {
      loading.value = false
    }
  }

  // Load all ambulances with details
  const loadAllAmbulances = async () => {
    try {
      loading.value = true
      const ambulancesSnapshot = await getDocs(collection(db, 'ambulances'))

      const ambulancePromises = ambulancesSnapshot.docs.map(async (doc) => {
        const ambulanceData = { id: doc.id, ...doc.data() }

        // Get inventory count
        const inventorySnapshot = await getDocs(
          collection(db, 'ambulances', doc.id, 'inventory')
        )
        ambulanceData.inventoryCount = inventorySnapshot.size

        // Get recent activity count
        const activitiesSnapshot = await getDocs(
          query(
            collection(db, 'ambulances', doc.id, 'activities'),
            orderBy('timestamp', 'desc'),
            limit(10)
          )
        )
        ambulanceData.recentActivityCount = activitiesSnapshot.size

        return ambulanceData
      })

      allAmbulances.value = await Promise.all(ambulancePromises)

    } catch (err) {
      error.value = 'Błąd podczas ładowania karetek: ' + err.message
    } finally {
      loading.value = false
    }
  }

  // Load recent activities across all ambulances
  const loadRecentActivities = async () => {
    try {
      loading.value = true
      const ambulancesSnapshot = await getDocs(collection(db, 'ambulances'))

      const allActivities = []

      for (const ambulanceDoc of ambulancesSnapshot.docs) {
        const activitiesSnapshot = await getDocs(
          query(
            collection(db, 'ambulances', ambulanceDoc.id, 'activities'),
            orderBy('timestamp', 'desc'),
            limit(20)
          )
        )

        activitiesSnapshot.docs.forEach(activityDoc => {
          allActivities.push({
            id: activityDoc.id,
            ambulanceId: ambulanceDoc.id,
            ambulanceName: ambulanceDoc.data().name,
            ...activityDoc.data()
          })
        })
      }

      // Sort all activities by timestamp and take latest 50
      allActivities.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)
        return timeB - timeA
      })

      recentActivities.value = allActivities.slice(0, 50)

    } catch (err) {
      error.value = 'Błąd podczas ładowania aktywności: ' + err.message
    } finally {
      loading.value = false
    }
  }

  // Delete ambulance (super admin only)
  const deleteAmbulance = async (ambulanceId) => {
    try {
      loading.value = true
      error.value = null

      const batch = writeBatch(db)

      // Delete ambulance document
      batch.delete(doc(db, 'ambulances', ambulanceId))

      // Get all members and remove ambulance from their lists
      const ambulanceDoc = await getDoc(doc(db, 'ambulances', ambulanceId))
      if (ambulanceDoc.exists()) {
        const memberIds = ambulanceDoc.data().members || []

        for (const userId of memberIds) {
          const userDoc = await getDoc(doc(db, 'users', userId))
          if (userDoc.exists()) {
            const userAmbulances = userDoc.data().ambulances || []
            const updatedAmbulances = userAmbulances.filter(id => id !== ambulanceId)
            batch.update(doc(db, 'users', userId), {
              ambulances: updatedAmbulances
            })
          }
        }
      }

      await batch.commit()

      // Reload data
      await loadAllAmbulances()
      await loadAppStats()

    } catch (err) {
      error.value = 'Błąd podczas usuwania karetki: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Ban user (disable access)
  const banUser = async (userId) => {
    try {
      loading.value = true
      await updateDoc(doc(db, 'users', userId), {
        banned: true,
        bannedAt: serverTimestamp(),
        bannedBy: authStore.user.uid
      })

      await loadAllUsers()

    } catch (err) {
      error.value = 'Błąd podczas blokowania użytkownika: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Unban user
  const unbanUser = async (userId) => {
    try {
      loading.value = true
      await updateDoc(doc(db, 'users', userId), {
        banned: false,
        unbannedAt: serverTimestamp(),
        unbannedBy: authStore.user.uid
      })

      await loadAllUsers()

    } catch (err) {
      error.value = 'Błąd podczas odblokowania użytkownika: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    stats,
    allUsers,
    allAmbulances,
    recentActivities,
    isSuperAdmin,
    loadAppStats,
    loadAllUsers,
    loadAllAmbulances,
    loadRecentActivities,
    deleteAmbulance,
    banUser,
    unbanUser
  }
})