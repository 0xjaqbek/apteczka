import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../services/firebase.js'
import { useAuthStore } from './auth.js'

export const useAmbulanceStore = defineStore('ambulance', () => {
  const authStore = useAuthStore()
  const ambulances = ref([])
  const currentAmbulance = ref(null)
  const inventory = ref([])
  const activities = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Generate unique ambulance ID
  const generateAmbulanceId = () => {
    return 'AMB-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  // Ensure user document exists
  const ensureUserDocument = async () => {
    if (!authStore.user) {
      throw new Error('Użytkownik nie jest zalogowany')
    }

    const userDocRef = doc(db, 'users', authStore.user.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      console.log('Creating missing user document for:', authStore.user.email)
      await setDoc(userDocRef, {
        email: authStore.user.email,
        displayName: authStore.user.displayName,
        createdAt: serverTimestamp(),
        ambulances: []
      })
    }
  }

  const createAmbulance = async (name, location) => {
    try {
      loading.value = true
      error.value = null

      // First ensure user document exists
      await ensureUserDocument()

      const ambulanceId = generateAmbulanceId()
      const ambulanceData = {
        id: ambulanceId,
        name,
        location,
        creator: authStore.user.uid,
        admins: [authStore.user.uid],
        members: [authStore.user.uid],
        createdAt: serverTimestamp(),
        settings: {
          notificationDays: 30
        }
      }

      // Create ambulance document with custom ID
      await setDoc(doc(db, 'ambulances', ambulanceId), ambulanceData)

      // Update user's ambulances list
      await updateDoc(doc(db, 'users', authStore.user.uid), {
        ambulances: arrayUnion(ambulanceId)
      })

      // Log activity
      await addDoc(collection(db, 'ambulances', ambulanceId, 'activities'), {
        type: 'ambulance_created',
        userId: authStore.user.uid,
        userName: authStore.user.displayName,
        details: `Utworzono karetkę: ${name}`,
        timestamp: serverTimestamp()
      })

      return ambulanceId

    } catch (err) {
      error.value = 'Błąd podczas tworzenia karetki: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const joinAmbulance = async (ambulanceId) => {
    try {
      loading.value = true
      error.value = null

      // First ensure user document exists
      await ensureUserDocument()

      // Check if ambulance exists
      const ambulanceDoc = await getDoc(doc(db, 'ambulances', ambulanceId))
      if (!ambulanceDoc.exists()) {
        throw new Error('Karetka o podanym ID nie istnieje')
      }

      const ambulanceData = ambulanceDoc.data()

      // Check if user is already a member
      if (ambulanceData.members.includes(authStore.user.uid)) {
        throw new Error('Jesteś już członkiem tej karetki')
      }

      // Add user to ambulance members
      await updateDoc(doc(db, 'ambulances', ambulanceId), {
        members: arrayUnion(authStore.user.uid)
      })

      // Add ambulance to user's list
      await updateDoc(doc(db, 'users', authStore.user.uid), {
        ambulances: arrayUnion(ambulanceId)
      })

      // Log activity
      await addDoc(collection(db, 'ambulances', ambulanceId, 'activities'), {
        type: 'user_joined',
        userId: authStore.user.uid,
        userName: authStore.user.displayName,
        details: `${authStore.user.displayName} dołączył do karetki`,
        timestamp: serverTimestamp()
      })

      return ambulanceData

    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadUserAmbulances = async () => {
    try {
      if (!authStore.user) return

      // Ensure user document exists
      await ensureUserDocument()

      const userDocRef = doc(db, 'users', authStore.user.uid)
      const userDoc = await getDoc(userDocRef)

      const userData = userDoc.data()
      if (!userData.ambulances || userData.ambulances.length === 0) {
        ambulances.value = []
        return
      }

      // Load ambulance details
      const ambulancePromises = userData.ambulances.map(async (ambulanceId) => {
        const ambulanceDoc = await getDoc(doc(db, 'ambulances', ambulanceId))
        return ambulanceDoc.exists() ? { id: ambulanceId, ...ambulanceDoc.data() } : null
      })

      const results = await Promise.all(ambulancePromises)
      ambulances.value = results.filter(ambulance => ambulance !== null)

    } catch (err) {
      error.value = 'Błąd podczas ładowania karetek: ' + err.message
    }
  }

  const setCurrentAmbulance = async (ambulanceId) => {
    try {
      loading.value = true
      const ambulanceDoc = await getDoc(doc(db, 'ambulances', ambulanceId))

      if (ambulanceDoc.exists()) {
        currentAmbulance.value = { id: ambulanceId, ...ambulanceDoc.data() }
        await loadInventory(ambulanceId)
        await loadActivities(ambulanceId)
      }
    } catch (err) {
      error.value = 'Błąd podczas ładowania karetki: ' + err.message
    } finally {
      loading.value = false
    }
  }

  const loadInventory = (ambulanceId) => {
    return new Promise((resolve) => {
      const unsubscribe = onSnapshot(
        collection(db, 'ambulances', ambulanceId, 'inventory'),
        (snapshot) => {
          inventory.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          resolve()
        }
      )
      // Store unsubscribe function for cleanup if needed
      return unsubscribe
    })
  }

  const loadActivities = (ambulanceId) => {
    return new Promise((resolve) => {
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'ambulances', ambulanceId, 'activities'),
          orderBy('timestamp', 'desc')
        ),
        (snapshot) => {
          activities.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          resolve()
        }
      )
      return unsubscribe
    })
  }

  const isAdmin = computed(() => {
    return currentAmbulance.value?.admins?.includes(authStore.user?.uid) || false
  })

  const isMember = computed(() => {
    return currentAmbulance.value?.members?.includes(authStore.user?.uid) || false
  })

  const expiringItems = computed(() => {
    if (!inventory.value) return []

    const notificationDays = currentAmbulance.value?.settings?.notificationDays || 30
    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() + notificationDays)

    return inventory.value.filter(item => {
      if (!item.expirationDate) return false
      const expDate = item.expirationDate.toDate ? item.expirationDate.toDate() : new Date(item.expirationDate)
      return expDate <= warningDate
    })
  })

  return {
    ambulances,
    currentAmbulance,
    inventory,
    activities,
    loading,
    error,
    isAdmin,
    isMember,
    expiringItems,
    createAmbulance,
    joinAmbulance,
    loadUserAmbulances,
    setCurrentAmbulance,
    loadInventory,
    loadActivities
  }
})