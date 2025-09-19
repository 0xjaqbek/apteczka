import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../services/firebase.js'
import { useAuthStore } from './auth.js'

export const useInventoryStore = defineStore('inventory', () => {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref(null)

  const addItem = async (ambulanceId, itemData) => {
    try {
      loading.value = true
      error.value = null

      const item = {
        ...itemData,
        addedBy: authStore.user.uid,
        addedByName: authStore.user.displayName,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'ambulances', ambulanceId, 'inventory'), item)

      // Log activity
      await addDoc(collection(db, 'ambulances', ambulanceId, 'activities'), {
        type: 'item_added',
        userId: authStore.user.uid,
        userName: authStore.user.displayName,
        details: `Dodano: ${itemData.name} (ilość: ${itemData.quantity})`,
        itemId: docRef.id,
        timestamp: serverTimestamp()
      })

      return docRef.id

    } catch (err) {
      error.value = 'Błąd podczas dodawania przedmiotu: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateItem = async (ambulanceId, itemId, updates) => {
    try {
      loading.value = true
      error.value = null

      const updatedData = {
        ...updates,
        updatedBy: authStore.user.uid,
        updatedByName: authStore.user.displayName,
        updatedAt: serverTimestamp()
      }

      await updateDoc(doc(db, 'ambulances', ambulanceId, 'inventory', itemId), updatedData)

      // Create activity log based on what was updated
      let activityDetails = ''
      if (updates.quantity !== undefined) {
        activityDetails = `Zaktualizowano ilość: ${updates.name || 'przedmiot'} (${updates.quantity})`
      } else if (updates.status) {
        activityDetails = `Zmieniono status: ${updates.name || 'przedmiot'} → ${updates.status}`
      } else {
        activityDetails = `Zaktualizowano: ${updates.name || 'przedmiot'}`
      }

      await addDoc(collection(db, 'ambulances', ambulanceId, 'activities'), {
        type: 'item_updated',
        userId: authStore.user.uid,
        userName: authStore.user.displayName,
        details: activityDetails,
        itemId,
        timestamp: serverTimestamp()
      })

    } catch (err) {
      error.value = 'Błąd podczas aktualizacji przedmiotu: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteItem = async (ambulanceId, itemId, itemName) => {
    try {
      loading.value = true
      error.value = null

      await deleteDoc(doc(db, 'ambulances', ambulanceId, 'inventory', itemId))

      // Log activity
      await addDoc(collection(db, 'ambulances', ambulanceId, 'activities'), {
        type: 'item_deleted',
        userId: authStore.user.uid,
        userName: authStore.user.displayName,
        details: `Usunięto: ${itemName}`,
        itemId,
        timestamp: serverTimestamp()
      })

    } catch (err) {
      error.value = 'Błąd podczas usuwania przedmiotu: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const markAsUsed = async (ambulanceId, itemId, itemName, quantityUsed) => {
    try {
      loading.value = true
      error.value = null

      // Log activity for usage
      await addDoc(collection(db, 'ambulances', ambulanceId, 'activities'), {
        type: 'item_used',
        userId: authStore.user.uid,
        userName: authStore.user.displayName,
        details: `Użyto: ${itemName} (ilość: ${quantityUsed})`,
        itemId,
        quantityUsed,
        timestamp: serverTimestamp()
      })

    } catch (err) {
      error.value = 'Błąd podczas oznaczania jako użyte: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const markAsExpired = async (ambulanceId, itemId, itemName) => {
    try {
      loading.value = true
      error.value = null

      await updateDoc(doc(db, 'ambulances', ambulanceId, 'inventory', itemId), {
        status: 'expired',
        updatedBy: authStore.user.uid,
        updatedByName: authStore.user.displayName,
        updatedAt: serverTimestamp()
      })

      // Log activity
      await addDoc(collection(db, 'ambulances', ambulanceId, 'activities'), {
        type: 'item_expired',
        userId: authStore.user.uid,
        userName: authStore.user.displayName,
        details: `Oznaczono jako przeterminowane: ${itemName}`,
        itemId,
        timestamp: serverTimestamp()
      })

    } catch (err) {
      error.value = 'Błąd podczas oznaczania jako przeterminowane: ' + err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    markAsUsed,
    markAsExpired
  }
})