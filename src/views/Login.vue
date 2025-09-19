<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="card text-center">
        <div class="mb-6">
          <h1 class="text-2xl font-semibold mb-2">🚑 Apteczka Karetki</h1>
          <p class="text-muted">Logowanie do systemu</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
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
              placeholder="Wprowadź hasło"
              required
            />
          </div>

          <div v-if="authStore.error" class="alert alert-error">
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="btn btn-primary w-full"
          >
            {{ authStore.loading ? 'Logowanie...' : 'Zaloguj się' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-border-color">
          <p class="text-sm text-muted">
            Nie masz konta?
            <router-link to="/register" class="text-accent-primary hover:text-accent-secondary">
              Zarejestruj się
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (error) {
    console.error('Login error:', error)
  }
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>