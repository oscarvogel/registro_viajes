<template>
  <div class="bg-white shadow-lg rounded-2xl p-5">
    <h2 class="text-lg font-semibold mb-4">Configuración</h2>
    <form @submit.prevent="guardarConfiguracion" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">DNI (único)</label>
        <input v-model="dni" required placeholder="Documento del chofer (DNI)" class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Patente</label>
        <input v-model="patente" required placeholder="Ej: AB-1234" class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div>
        <button type="submit" :disabled="isSaving" class="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg shadow flex items-center justify-center gap-2 disabled:opacity-50">
          <template v-if="isSaving">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path>
            </svg>
            <span>Guardando...</span>
          </template>
          <template v-else>
            <!-- save icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17 3a1 1 0 00-1-1h-3.586a1 1 0 00-.707.293l-1.414 1.414A1 1 0 0110.586 4H5a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3z" />
            </svg>
            <span>Guardar</span>
          </template>
        </button>
      </div>
    </form>

      <div v-if="configuracionGuardada" class="mt-5 bg-gray-50 p-3 rounded-lg">
      <h3 class="font-medium mb-2">Configuración actual</h3>
      <p class="text-sm"><strong>DNI:</strong> {{ configuracionGuardada.dni }}</p>
      <p class="text-sm"><strong>Patente:</strong> {{ configuracionGuardada.patente }}</p>
    </div>
  </div>
</template>

<script>
import localforage from 'localforage';

export default {
  data() {
    return {
      dni: '',
      patente: '',
      configuracionGuardada: null,
      isSaving: false
    };
  },
  async mounted() {
    // Cargar configuración guardada
    this.configuracionGuardada = await localforage.getItem('configuracion') || null;
    if (this.configuracionGuardada) {
      this.dni = this.configuracionGuardada.dni || '';
      this.patente = this.configuracionGuardada.patente;
    }
  },
  methods: {
    async guardarConfiguracion() {
      this.isSaving = true;
      try {
        const config = {
          dni: this.dni,
          patente: this.patente
        };
  await localforage.setItem('configuracion', config);
  this.configuracionGuardada = config;
  window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Configuración guardada' } }));
      } finally {
        this.isSaving = false;
      }
    }
  }
};
</script>