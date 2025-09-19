<template>
  <div class="space-y-6">
    <!-- General Settings -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">Ustawienia ogólne</h3>

      <form @submit.prevent="updateSettings" class="space-y-4">
        <div class="form-group">
          <label class="form-label" for="ambulanceName">Nazwa karetki</label>
          <input
            id="ambulanceName"
            v-model="settings.name"
            type="text"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="ambulanceLocation">Lokalizacja</label>
          <input
            id="ambulanceLocation"
            v-model="settings.location"
            type="text"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="notificationDays">
            Powiadomienia o wygaśnięciu (dni przed terminem)
          </label>
          <input
            id="notificationDays"
            v-model.number="settings.notificationDays"
            type="number"
            min="1"
            max="365"
            class="form-input"
            required
          />
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary">
          {{ loading ? 'Zapisywanie...' : 'Zapisz ustawienia' }}
        </button>
      </form>
    </div>

    <!-- Member Management -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">Zarządzanie członkami</h3>

      <!-- Add Member -->
      <div class="mb-6 p-4 bg-bg-tertiary rounded-lg">
        <h4 class="font-medium mb-3">Dodaj członka</h4>
        <form @submit.prevent="addMember" class="flex gap-2">
          <input
            v-model="newMemberEmail"
            type="email"
            class="form-input flex-1"
            placeholder="Email nowego członka"
            required
          />
          <button type="submit" :disabled="loading" class="btn btn-secondary">
            Dodaj
          </button>
        </form>
      </div>

      <!-- Current Members -->
      <div>
        <h4 class="font-medium mb-3">Obecni członkowie</h4>
        <div class="space-y-3">
          <div
            v-for="member in membersWithDetails"
            :key="member.uid"
            class="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
          >
            <div>
              <p class="font-medium">{{ member.displayName || member.email }}</p>
              <p class="text-sm text-text-secondary">{{ member.email }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="isAdmin(member.uid)"
                class="text-xs bg-accent-primary text-white px-2 py-1 rounded"
              >
                Admin
              </span>
              <div class="flex gap-1">
                <button
                  v-if="!isAdmin(member.uid) && canManageUser(member.uid)"
                  @click="toggleAdmin(member.uid)"
                  class="btn btn-secondary text-xs"
                >
                  Nadaj admin
                </button>
                <button
                  v-if="isAdmin(member.uid) && canManageUser(member.uid)"
                  @click="toggleAdmin(member.uid)"
                  class="btn btn-secondary text-xs"
                >
                  Usuń admin
                </button>
                <button
                  v-if="canRemoveUser(member.uid)"
                  @click="removeMember(member.uid)"
                  class="btn btn-danger text-xs"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="card border-accent-danger">
      <h3 class="text-lg font-semibold mb-4 text-accent-danger">Strefa niebezpieczna</h3>

      <div class="space-y-4">
        <div>
          <h4 class="font-medium mb-2">Usuń karetkę</h4>
          <p class="text-sm text-text-secondary mb-3">
            Ta akcja usunie karetkę wraz z całym inwentarzem i historią. Nie można tego cofnąć.
          </p>
          <button
            @click="showDeleteConfirm = true"
            class="btn btn-danger"
          >
            Usuń karetkę
          </button>
        </div>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
    <div v-if="success" class="alert alert-success">
      {{ success }}
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-bg-secondary rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Potwierdź usunięcie</h3>
        <p class="text-text-secondary mb-6">
          Czy na pewno chcesz usunąć karetkę "{{ ambulanceStore.currentAmbulance?.name }}"?
          Ta akcja jest nieodwracalna.
        </p>
        <div class="flex gap-4 justify-end">
          <button @click="showDeleteConfirm = false" class="btn btn-secondary">
            Anuluj
          </button>
          <button @click="deleteAmbulance" class="btn btn-danger">
            Usuń karetkę
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAmbulanceStore } from '../stores/ambulance.js'
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from '../services/firebase.js'

const router = useRouter()
const authStore = useAuthStore()
const ambulanceStore = useAmbulanceStore()

const loading = ref(false)
const error = ref('')
const success = ref('')
const showDeleteConfirm = ref(false)
const newMemberEmail = ref('')
const membersWithDetails = ref([])

const settings = ref({
  name: '',
  location: '',
  notificationDays: 30
})

onMounted(async () => {
  loadSettings()
  loadMembersDetails()
})

const loadSettings = () => {
  if (ambulanceStore.currentAmbulance) {
    settings.value = {
      name: ambulanceStore.currentAmbulance.name,
      location: ambulanceStore.currentAmbulance.location,
      notificationDays: ambulanceStore.currentAmbulance.settings?.notificationDays || 30
    }
  }
}

const loadMembersDetails = async () => {
  try {
    const memberIds = ambulanceStore.currentAmbulance?.members || []
    const memberPromises = memberIds.map(async (uid) => {
      const userDoc = await getDoc(doc(db, 'users', uid))
      return userDoc.exists() ? { uid, ...userDoc.data() } : { uid, email: 'Unknown' }
    })
    membersWithDetails.value = await Promise.all(memberPromises)
  } catch (err) {
    console.error('Error loading member details:', err)
  }
}

const updateSettings = async () => {
  try {
    loading.value = true
    error.value = ''

    await updateDoc(doc(db, 'ambulances', ambulanceStore.currentAmbulance.id), {
      name: settings.value.name,
      location: settings.value.location,
      'settings.notificationDays': settings.value.notificationDays
    })

    success.value = 'Ustawienia zostały zapisane'
    setTimeout(() => success.value = '', 3000)

    // Refresh current ambulance data
    await ambulanceStore.setCurrentAmbulance(ambulanceStore.currentAmbulance.id)

  } catch (err) {
    error.value = 'Błąd podczas zapisywania ustawień: ' + err.message
  } finally {
    loading.value = false
  }
}

const addMember = async () => {
  try {
    loading.value = true
    error.value = ''

    // Find user by email
    const usersQuery = query(collection(db, 'users'), where('email', '==', newMemberEmail.value))
    const usersSnapshot = await getDocs(usersQuery)

    if (usersSnapshot.empty) {
      throw new Error('Nie znaleziono użytkownika z tym adresem email')
    }

    const userData = usersSnapshot.docs[0]
    const userId = userData.id

    // Check if already a member
    if (ambulanceStore.currentAmbulance.members.includes(userId)) {
      throw new Error('Ten użytkownik jest już członkiem karetki')
    }

    // Add to ambulance members
    await updateDoc(doc(db, 'ambulances', ambulanceStore.currentAmbulance.id), {
      members: arrayUnion(userId)
    })

    // Add ambulance to user's list
    await updateDoc(doc(db, 'users', userId), {
      ambulances: arrayUnion(ambulanceStore.currentAmbulance.id)
    })

    newMemberEmail.value = ''
    success.value = 'Członek został dodany'
    setTimeout(() => success.value = '', 3000)

    // Refresh data
    await ambulanceStore.setCurrentAmbulance(ambulanceStore.currentAmbulance.id)
    await loadMembersDetails()

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const toggleAdmin = async (userId) => {
  try {
    loading.value = true
    error.value = ''

    const isCurrentlyAdmin = ambulanceStore.currentAmbulance.admins.includes(userId)

    if (isCurrentlyAdmin) {
      await updateDoc(doc(db, 'ambulances', ambulanceStore.currentAmbulance.id), {
        admins: arrayRemove(userId)
      })
    } else {
      await updateDoc(doc(db, 'ambulances', ambulanceStore.currentAmbulance.id), {
        admins: arrayUnion(userId)
      })
    }

    success.value = isCurrentlyAdmin ? 'Uprawnienia administratora zostały usunięte' : 'Uprawnienia administratora zostały nadane'
    setTimeout(() => success.value = '', 3000)

    // Refresh data
    await ambulanceStore.setCurrentAmbulance(ambulanceStore.currentAmbulance.id)

  } catch (err) {
    error.value = 'Błąd podczas zmiany uprawnień: ' + err.message
  } finally {
    loading.value = false
  }
}

const removeMember = async (userId) => {
  try {
    loading.value = true
    error.value = ''

    // Remove from ambulance
    await updateDoc(doc(db, 'ambulances', ambulanceStore.currentAmbulance.id), {
      members: arrayRemove(userId),
      admins: arrayRemove(userId)
    })

    // Remove ambulance from user's list
    await updateDoc(doc(db, 'users', userId), {
      ambulances: arrayRemove(ambulanceStore.currentAmbulance.id)
    })

    success.value = 'Członek został usunięty'
    setTimeout(() => success.value = '', 3000)

    // Refresh data
    await ambulanceStore.setCurrentAmbulance(ambulanceStore.currentAmbulance.id)
    await loadMembersDetails()

  } catch (err) {
    error.value = 'Błąd podczas usuwania członka: ' + err.message
  } finally {
    loading.value = false
  }
}

const deleteAmbulance = async () => {
  try {
    loading.value = true
    error.value = ''

    const batch = writeBatch(db)

    // Delete ambulance document
    batch.delete(doc(db, 'ambulances', ambulanceStore.currentAmbulance.id))

    // Remove ambulance from all users' lists
    const memberIds = ambulanceStore.currentAmbulance.members || []
    memberIds.forEach(userId => {
      batch.update(doc(db, 'users', userId), {
        ambulances: arrayRemove(ambulanceStore.currentAmbulance.id)
      })
    })

    await batch.commit()

    // Redirect to home
    router.push('/')

  } catch (err) {
    error.value = 'Błąd podczas usuwania karetki: ' + err.message
    showDeleteConfirm.value = false
  } finally {
    loading.value = false
  }
}

// Helper functions
const isAdmin = (userId) => {
  return ambulanceStore.currentAmbulance?.admins?.includes(userId) || false
}

const canManageUser = (userId) => {
  // Creator can manage everyone, other admins can't manage the creator
  return authStore.user.uid === ambulanceStore.currentAmbulance?.creator ||
         (ambulanceStore.isAdmin && userId !== ambulanceStore.currentAmbulance?.creator)
}

const canRemoveUser = (userId) => {
  // Can't remove creator, can't remove yourself
  return userId !== ambulanceStore.currentAmbulance?.creator &&
         userId !== authStore.user.uid &&
         canManageUser(userId)
}
</script>

<style scoped>
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
</style>