<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="card text-center">
        <div class="mb-6">
          <h1 class="text-2xl font-semibold mb-2">🚑 Apteczka Karetki</h1>
          <p class="text-muted">Utwórz nowe konto</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="form-group">
            <label class="form-label" for="displayName">Imię i nazwisko</label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              class="form-input"
              placeholder="Jan Kowalski"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Adres email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="twoj@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Hasło</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="Minimum 6 znaków"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Potwierdź hasło</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="Powtórz hasło"
              required
            />
          </div>

          <div v-if="error" class="alert alert-error">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="btn btn-primary w-full"
          >
            {{ authStore.loading ? 'Rejestracja...' : 'Zarejestruj się' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-border-color">
          <p class="text-sm text-muted">
            Masz już konto?
            <router-link to="/login" class="text-accent-primary hover:text-accent-secondary">
              Zaloguj się
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const error = computed(() => {
  if (authStore.error) return authStore.error
  if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
    return 'Hasła nie są identyczne'
  }
  return null
})

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    return
  }

  try {
    await authStore.register(email.value, password.value, displayName.value)
    router.push('/')
  } catch (error) {
    console.error('Registration error:', error)
  }
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>