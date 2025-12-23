<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#374128] to-[#59753A] p-4">
    <div class="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Registro de Viajes</h1>
        <p class="text-gray-600 mt-2">Ingrese sus credenciales</p>
      </div>

      <!-- Formulario de login -->
      <form @submit.prevent="login" class="space-y-4">
        <!-- Botón de sincronización integrado -->
        <div class="mb-4">
          <button 
            type="button"
            @click="sincronizarUsuarios" 
            :disabled="isSyncing"
            class="w-full px-4 py-3 bg-[#64764C] text-white rounded-lg shadow hover:bg-[#59753A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke-width="1.5" 
              stroke="currentColor" 
              class="w-5 h-5"
              :class="{ 'animate-spin': isSyncing }"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{{ isSyncing ? 'Sincronizando...' : 'Sincronizar Usuarios' }}</span>
          </button>
          <p class="text-xs text-gray-500 mt-2 text-center">
            {{ usuariosCargados ? `${usuarios.length} usuario(s) disponible(s)` : 'Sincronice para cargar usuarios' }}
          </p>
          <p v-if="lastSync" class="text-xs text-gray-400 mt-1 text-center">
            Última sincronización: {{ formatDate(lastSync) }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
          <select 
            v-model="usuarioSeleccionado" 
            required
            :disabled="!usuariosCargados"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#59753A] disabled:opacity-50 disabled:bg-gray-100"
          >
            <option value="">{{ usuariosCargados ? 'Seleccione un usuario' : 'Sincronice usuarios primero' }}</option>
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
            :disabled="!usuariosCargados"
            placeholder="Ingrese su contraseña"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#59753A] disabled:opacity-50 disabled:bg-gray-100"
          />
        </div>

        <div v-if="errorMsg" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoggingIn || !usuariosCargados"
          class="w-full px-4 py-3 bg-[#374128] text-white rounded-lg shadow hover:bg-[#64764C] disabled:opacity-50 font-medium"
        >
          {{ isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>
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

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
