<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
    <div class="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Registro de Viajes</h1>
        <p class="text-gray-600 mt-2">Ingrese sus credenciales</p>
      </div>

      <!-- Sincronización de usuarios -->
      <div v-if="!usuariosCargados" class="mb-6 text-center">
        <button 
          @click="sincronizarUsuarios" 
          :disabled="isSyncing"
          class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg v-if="isSyncing" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isSyncing ? 'Sincronizando...' : '🔄 Sincronizar Usuarios' }}</span>
        </button>
        <p class="text-sm text-gray-500 mt-2">Necesita conexión a internet para la primera sincronización</p>
      </div>

      <!-- Formulario de login -->
      <form v-if="usuariosCargados" @submit.prevent="login" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
          <select 
            v-model="usuarioSeleccionado" 
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Seleccione un usuario</option>
            <option v-for="u in usuarios" :key="u.id" :value="u.usuario">
              {{ u.usuario }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input 
            v-model="password" 
            type="password"
            required
            placeholder="Ingrese su contraseña"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div v-if="errorMsg" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoggingIn"
          class="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {{ isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>

        <button 
          type="button"
          @click="volverASincronizar"
          class="w-full px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          ↻ Volver a sincronizar usuarios
        </button>
      </form>

      <!-- Info de última sincronización -->
      <div v-if="lastSync" class="mt-4 text-center text-xs text-gray-500">
        Última sincronización: {{ formatDate(lastSync) }}
      </div>
    </div>
  </div>
</template>

<script>
import localforage from 'localforage';
import { syncUsuariosFromAirtable, getUsuarios, validateLogin } from '../utils/authService';

export default {
  name: 'LoginForm',
  data() {
    return {
      usuarios: [],
      usuarioSeleccionado: '',
      password: '',
      isSyncing: false,
      isLoggingIn: false,
      errorMsg: '',
      lastSync: null
    };
  },
  computed: {
    usuariosCargados() {
      return this.usuarios.length > 0;
    }
  },
  async mounted() {
    await this.cargarUsuariosDesdeCache();
  },
  methods: {
    async cargarUsuariosDesdeCache() {
      const usuarios = await getUsuarios();
      if (usuarios.length > 0) {
        this.usuarios = usuarios;
        const cached = await localforage.getItem('usuarios_data');
        this.lastSync = cached?.lastSync || null;
      }
    },
    async sincronizarUsuarios() {
      this.isSyncing = true;
      this.errorMsg = '';
      
      try {
        const result = await syncUsuariosFromAirtable();
        
        if (result.success) {
          await this.cargarUsuariosDesdeCache();
          window.dispatchEvent(new CustomEvent('toast', { 
            detail: { message: `✅ ${result.count} usuarios sincronizados` } 
          }));
        } else {
          this.errorMsg = `Error al sincronizar: ${result.error}`;
        }
      } catch (err) {
        this.errorMsg = 'Error de conexión. Verifique su internet.';
        console.error(err);
      } finally {
        this.isSyncing = false;
      }
    },
    async volverASincronizar() {
      this.usuarios = [];
      this.usuarioSeleccionado = '';
      this.password = '';
      this.errorMsg = '';
    },
    async login() {
      this.isLoggingIn = true;
      this.errorMsg = '';
      
      try {
        const result = await validateLogin(this.usuarioSeleccionado, this.password);
        
        if (result.success) {
          this.$emit('login-success', result.user);
          window.dispatchEvent(new CustomEvent('toast', { 
            detail: { message: `✅ Bienvenido ${result.user.usuario}` } 
          }));
        } else {
          this.errorMsg = result.error;
          this.password = ''; // Limpiar contraseña incorrecta
        }
      } catch (err) {
        this.errorMsg = 'Error al iniciar sesión';
        console.error(err);
      } finally {
        this.isLoggingIn = false;
      }
    },
    formatDate(isoString) {
      if (!isoString) return '-';
      const date = new Date(isoString);
      return date.toLocaleString('es-AR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>
