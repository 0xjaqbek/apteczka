import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  const init = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          ...(userDoc.exists() ? userDoc.data() : {})
        }
      } else {
        user.value = null
      }
      loading.value = false
    })
  }

  const login = async (email, password) => {
    try {
      error.value = null
      loading.value = true
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (email, password, displayName) => {
    try {
      error.value = null
      loading.value = true

      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)

      await updateProfile(firebaseUser, { displayName })

      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        displayName,
        createdAt: serverTimestamp(),
        ambulances: []
      })

    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    }
  }

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'Nie znaleziono użytkownika z tym adresem email'
      case 'auth/wrong-password':
        return 'Nieprawidłowe hasło'
      case 'auth/email-already-in-use':
        return 'Ten adres email jest już używany'
      case 'auth/weak-password':
        return 'Hasło jest za słabe'
      case 'auth/invalid-email':
        return 'Nieprawidłowy adres email'
      case 'auth/too-many-requests':
        return 'Za dużo prób. Spróbuj ponownie później'
      default:
        return 'Wystąpił błąd: ' + error.message
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    init,
    login,
    register,
    logout
  }
})