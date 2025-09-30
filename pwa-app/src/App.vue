<template>
  <div id="app" class="min-h-screen bg-gradient-to-b from-white to-gray-100 text-gray-900 flex flex-col">
    <ToastContainer />
    <header class="bg-transparent">
      <div class="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/img/logo_almada_neri.jpg" alt="Logo Almada Neri" class="h-10 w-10 rounded-full object-cover">
          <h1 class="text-xl font-bold">Registro de Viajes</h1>
        </div>
        <div class="flex items-center gap-3">
          <button @click="mostrar = 'pending'" class="relative p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <span v-if="pendingCount" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5">{{ pendingCount }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-xl mx-auto px-4 pb-24">
      <section class="mt-4">
        <div class="bg-white rounded-2xl shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold">{{ mostrar === 'viaje' ? 'Registrar Viaje' : 'Pendientes de sincronización' }}</h2>
            <div class="hidden sm:flex space-x-2">
              <button @click="mostrar = 'viaje'" :class="mostrar === 'viaje' ? 'px-3 py-1 rounded bg-blue-600 text-white' : 'px-3 py-1 rounded border bg-white'">Viaje</button>
              <button @click="mostrar = 'pending'" :class="mostrar === 'pending' ? 'px-3 py-1 rounded bg-blue-600 text-white' : 'px-3 py-1 rounded border bg-white'">Pendientes</button>
            </div>
          </div>

          <div>
            <ViajeForm v-if="mostrar === 'viaje'" />
            <PendingList v-if="mostrar === 'pending'" />
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom navigation (mobile-first) -->
    <nav class="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
      <div class="w-full max-w-xl px-4">
        <div class="bg-white/90 backdrop-blur rounded-3xl shadow-lg flex justify-between items-center px-3 py-2 pointer-events-auto">
          <button @click="mostrar = 'viaje'" class="flex-1 flex flex-col items-center justify-center py-2 rounded-md" :class="mostrar === 'viaje' ? 'bg-blue-600 text-white' : 'text-gray-700'" aria-label="Registrar">
            <!-- truck/clipboard icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7h13l4 4v7a1 1 0 01-1 1h-1a2 2 0 11-4 0H9a2 2 0 11-4 0H4a1 1 0 01-1-1V7z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 3v4M8 3v4" />
            </svg>
            <span class="text-xs mt-1">Registrar</span>
          </button>

          <!-- Config button removed -->

          <button @click="mostrar = 'pending'" class="flex-1 flex flex-col items-center justify-center py-2 rounded-md ml-2" :class="mostrar === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-700'" aria-label="Pendientes">
            <!-- list icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span class="text-xs mt-1">Pendientes</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
import ViajeForm from './components/ViajeForm.vue';
import ToastContainer from './components/ToastContainer.vue';
import PendingList from './components/PendingList.vue';
import localforage from 'localforage';

export default {
  name: 'App',
  components: {
    ViajeForm,
  // Configuracion removed per request
    ToastContainer,
    PendingList
  },
  data() {
    return {
      mostrar: 'viaje', // 'viaje' | 'config' | 'pending'
      pendingCount: 0
    };
  },
  async mounted() {
    await this.updatePendingCount();
    window.addEventListener('count-update', this.updatePendingCount);
  },
  beforeUnmount() {
    window.removeEventListener('count-update', this.updatePendingCount);
  },
  methods: {
    async updatePendingCount() {
      try {
        const keys = await localforage.keys();
        let c = 0;
        for (const key of keys) {
          const v = await localforage.getItem(key);
          if (v && !v.sincronizado) c++;
        }
        this.pendingCount = c;
      } catch (err) {
        console.error('Error counting pending items', err);
      }
    }
  }
};
</script>