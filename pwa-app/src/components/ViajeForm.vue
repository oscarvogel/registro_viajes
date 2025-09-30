<template>
  <div class="bg-white shadow-lg rounded-2xl p-5">
    <h2 class="text-lg font-semibold mb-3">Registrar Viaje</h2>

          <form @submit.prevent="guardarViaje" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Fecha del viaje</label>
              <input v-model="viajeFecha" type="date" class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Camión</label>
                <select v-model="camionSeleccionado" class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3">
                  <option :value="null">-- Seleccione camión --</option>
                  <option v-for="m in camiones" :key="m.id" :value="m">{{ m.modelo || 'Camión' }} — Patente: {{ m.patente }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Chofer</label>
                <select v-model="choferSeleccionado" class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3">
                  <option :value="null">-- Seleccione chofer --</option>
                  <option v-for="c in choferes" :key="c.id" :value="c">{{ c.nombre }} — DNI: {{ c.dni }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Origen (código o nombre)</label>
              <input
                v-model="query"
                @input="onQueryInput"
                @blur="onBlur"
                @focus="onFocus"
                inputmode="numeric"
                placeholder="Ingrese código o nombre del predio"
                class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

        <!-- suggestions -->
        <ul v-if="showSuggestions && suggestions.length" class="mt-2 max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white">
          <li v-for="p in suggestions" :key="p.id_Predio" @mousedown.prevent="selectPredio(p)" class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
            <span class="font-medium">{{ p.id_Predio }}</span>
            <span class="text-gray-600"> — {{ p['Nombre del Predio'] }}</span>
          </li>
        </ul>

        <!-- selected name -->
        <p class="mt-2 text-sm text-gray-600">Nombre del Predio: <span class="font-medium">{{ selectedPredioName || '-' }}</span></p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Destino (código o nombre)</label>
        <input
          v-model="destQuery"
          @input="onDestInput"
          @blur="onDestBlur"
          @focus="onDestFocus"
          placeholder="Ingrese código o nombre del destino"
          class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <ul v-if="showDestSuggestions && destSuggestions.length" class="mt-2 max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white">
          <li v-for="d in destSuggestions" :key="d.codigo" @mousedown.prevent="selectDestino(d)" class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
            <span class="font-medium">{{ d.codigo }}</span>
            <span class="text-gray-600"> — {{ d.nombre }}</span>
          </li>
        </ul>

        <p class="mt-2 text-sm text-gray-600">Nombre del Destino: <span class="font-medium">{{ selectedDestinoName || '-' }}</span></p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Producto a transportar</label>
        <select v-model="productoSeleccionado" class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3">
          <option :value="null">-- Seleccione --</option>
          <option v-for="p in productosList" :key="p.id" :value="p">{{ p.nombre }}</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">TN Pulpable</label>
          <input v-model.number="tn_pulpable" type="number" :disabled="isChipsSelected" class="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">TN Rollos (Aserrable)</label>
          <input v-model.number="tn_rollos" type="number" :disabled="isChipsSelected" class="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">TN Chips</label>
          <input v-model.number="tn_chips" type="number" :disabled="!isChipsSelected" class="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50" />
        </div>
      </div>
      <div class="flex items-start gap-3">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="sinActividad" class="h-4 w-4" />
          <span class="text-sm font-medium text-gray-700">Sin actividad</span>
        </label>
        <p class="text-sm text-gray-500">Marcar si no hubo actividad. Al activarlo puede indicar el motivo.</p>
      </div>

      <div v-if="sinActividad">
        <label class="block text-sm font-medium text-gray-700">Motivo</label>
        <div class="mt-1">
          <select v-model="motivoSeleccionado" class="block w-full rounded-lg border border-gray-200 px-4 py-3">
            <option :value="null">-- Seleccione motivo --</option>
            <option v-for="m in motivosOptions" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea v-model="observaciones" placeholder="Observaciones del chofer (opcional)" class="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 h-24"></textarea>
      </div>

      <div class="space-y-2">
        <button type="submit" :disabled="isSaving || !formIsValid()" class="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg shadow flex items-center justify-center gap-2 disabled:opacity-50">
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

        <!-- Sincronización ahora se realiza en la pantalla de Pendientes -->
      </div>
    </form>
  </div>
</template>

<script>
import localforage from 'localforage';
import log from '../utils/log';

export default {
  data() {
    return {
      viajeFecha: '',
      origen: '',
      destino: '',
      observaciones: '',
      productosList: [],
      productoSeleccionado: null,
      tn_pulpable: 0,
      tn_rollos: 0,
  tn_chips: 0,
  // choferes y camiones cargados desde public/data
  choferes: [],
  camiones: [],
  choferSeleccionado: null,
  camionSeleccionado: null,
    // sin actividad
    sinActividad: false,
  // motivos predefinidos y manejo de motivo
  motivosOptions: ['Reparaciones', 'Mantenimiento Preventivo', 'Lluvia'],
  motivoSeleccionado: null,
      // predios search
      predios: [],
      query: '',
      suggestions: [],
      selectedPredioName: '',
      showSuggestions: false
      ,
      // destinos search
      destinos: [],
      destQuery: '',
      destSuggestions: [],
      selectedDestinoName: '',
      showDestSuggestions: false,
      // loading states
      isSaving: false,
    };
  },
  // productos se cargan en el mounted principal junto con predios/destinos
  watch: {
    productoSeleccionado(newVal) {
      // si selecciona 'Chips' (case-insensitive) habilitar solo tn_chips
      if (!newVal) return;
      const name = (newVal.nombre || '').toLowerCase();
      if (name.includes('chips')) {
        // deshabilitar pulpable y aserrable
        this.tn_pulpable = 0;
        this.tn_rollos = 0;
        // keep tn_chips editable
      } else {
        // aserrable o pulpable -> habilitar pulpable y rollos, deshabilitar chips
        this.tn_chips = 0;
      }
    }
  },
  async mounted() {
    // cargar lista de productos desde public/data
    try {
      const base = import.meta.env.BASE_URL || '/';
      const resProd = await fetch(`${base}data/productos.json`);
      if (resProd.ok) this.productosList = await resProd.json();
    } catch (err) {
      log.error('No se pudo cargar productos:', err);
      this.productosList = [];
    }
    
    // Cargar choferes y camiones desde public/data
    try {
      const base = import.meta.env.BASE_URL || '/';
      const rc = await fetch(`${base}data/choferes.json`);
      if (rc.ok) this.choferes = await rc.json();
    } catch (err) {
      log.warn('No se pudo cargar choferes.json', err);
      this.choferes = [];
    }
    try {
      const base = import.meta.env.BASE_URL || '/';
      const rm = await fetch(`${base}data/camiones.json`);
      if (rm.ok) this.camiones = await rm.json();
    } catch (err) {
      log.warn('No se pudo cargar camiones.json', err);
      this.camiones = [];
    }
    // Cargar lista de predios desde public/data/predios.json
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}data/predios.json`);
      if (res.ok) {
        this.predios = await res.json();
      } else {
        log.warn('No se pudo cargar predios.json', res.status);
      }
    } catch (err) {
      log.error('Error cargando predios.json', err);
    }
    // Cargar destinos si existe
    try {
      const base = import.meta.env.BASE_URL || '/';
      const r2 = await fetch(`${base}data/destinos.json`);
      if (r2.ok) {
        this.destinos = await r2.json();
      }
    } catch (err) {
      // no blocking
    }

    // prefill viajeFecha with today's date (YYYY-MM-DD) if not set
    if (!this.viajeFecha) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      this.viajeFecha = `${yyyy}-${mm}-${dd}`;
    }
    // Cargar motivos desde public/data/motivos.json
    try {
      const base = import.meta.env.BASE_URL || '/';
      const r = await fetch(`${base}data/motivos.json`);
      if (r.ok) {
        const list = await r.json();
        this.motivosOptions = Array.isArray(list) ? list.slice() : this.motivosOptions;
      }
    } catch (err) {
      log.warn('No se pudo cargar motivos.json', err);
    }
  },
  computed: {
    isChipsSelected() {
      return !!(this.productoSeleccionado && (this.productoSeleccionado.nombre || '').toLowerCase().includes('chips'));
    }
  },
  methods: {
    onFocus() {
      this.showSuggestions = true;
      this.filterSuggestions();
    },
    onBlur() {
      // small timeout to allow click selection
      setTimeout(() => { this.showSuggestions = false; }, 150);
    },
    onQueryInput() {
      // update suggestions while user types
      this.filterSuggestions();
    },
    filterSuggestions() {
      const q = String(this.query || '').trim().toLowerCase();
      if (!q) {
        this.suggestions = this.predios.slice(0, 10);
        return;
      }
      // match by id (startsWith) or name (includes)
      this.suggestions = this.predios.filter(p => {
        const idStr = String(p.id_Predio || '').toLowerCase();
        const name = String(p['Nombre del Predio'] || '').toLowerCase();
        return idStr.startsWith(q) || name.includes(q);
      }).slice(0, 20);
    },
    selectPredio(p) {
      // set origen to predio code
      this.origen = String(p.id_Predio);
      this.selectedPredioName = p['Nombre del Predio'];
      this.query = String(p.id_Predio);
      this.showSuggestions = false;
    },
    // destinos handlers
    onDestFocus() {
      this.showDestSuggestions = true;
      this.filterDestSuggestions();
    },
    onDestBlur() {
      setTimeout(() => { this.showDestSuggestions = false; }, 150);
    },
    onDestInput() {
      this.filterDestSuggestions();
    },
    filterDestSuggestions() {
      const q = String(this.destQuery || '').trim().toLowerCase();
      if (!q) {
        this.destSuggestions = this.destinos.slice(0, 10);
        return;
      }
      this.destSuggestions = this.destinos.filter(d => {
        const code = String(d.codigo || '').toLowerCase();
        const name = String(d.nombre || '').toLowerCase();
        return code.startsWith(q) || name.includes(q);
      }).slice(0, 20);
    },
    selectDestino(d) {
      this.destino = String(d.codigo);
      this.selectedDestinoName = d.nombre;
      this.destQuery = String(d.codigo);
      this.showDestSuggestions = false;
    },
    async guardarViaje() {
    if (!this.formIsValid()) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Por favor, complete Fecha, Camión, Chofer, Origen y Destino. Si marcó "Sin actividad" ingrese el motivo.' } }));
        return;
      }
      this.isSaving = true;
      try {
        // Enforce maximum pending items: if there are 10 or more, do not allow new saves — trigger sync
        try {
          const keysNow = await localforage.keys();
          let pendingNow = 0;
          for (const k of keysNow) {
            const v = await localforage.getItem(k);
            if (v && !v.sincronizado) pendingNow++;
          }
          if (pendingNow >= 10) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Límite de pendientes alcanzado (10). Por favor sincronice.' } }));
            // open pending view and request a sync
            window.dispatchEvent(new CustomEvent('show-pending'));
            window.dispatchEvent(new CustomEvent('sync-all'));
            this.isSaving = false;
            return;
          }
        } catch (e) {
          // if we can't read keys, allow save but warn
          log.warn && log.warn('No se pudo verificar cantidad de pendientes', e);
        }
        // Normalize fecha: store locally as YYYY-MM-DD (date-only string)
        let fechaOnly = '';
        try {
          if (this.viajeFecha) {
            const d = new Date(this.viajeFecha + 'T00:00:00');
            if (!isNaN(d.getTime())) {
              fechaOnly = d.toISOString().slice(0, 10);
            } else {
              fechaOnly = new Date().toISOString().slice(0, 10);
            }
          } else {
            fechaOnly = new Date().toISOString().slice(0, 10);
          }
        } catch (e) {
          fechaOnly = new Date().toISOString().slice(0, 10);
        }

        // determine final motivo (only from motivos.json)
        const motivoFinal = this.sinActividad ? (this.motivoSeleccionado || '') : '';

          const viaje = {
            // save date-only string locally (YYYY-MM-DD)
            fecha: fechaOnly,
            dni: this.choferSeleccionado ? this.choferSeleccionado.dni : null,
            chofer: this.choferSeleccionado || null,
            patente: this.camionSeleccionado ? this.camionSeleccionado.patente : null,
            camion: this.camionSeleccionado || null,
            origen: this.origen,
            destino: this.destino,
            sinActividad: this.sinActividad || false,
            motivoSinActividad: this.sinActividad ? (motivoFinal || '') : '',
            observaciones: this.observaciones || '',
            productos: {
              tipo: this.productoSeleccionado && this.productoSeleccionado.nombre ? this.productoSeleccionado.nombre : '',
              pulpable: this.tn_pulpable,
              rollos: this.tn_rollos,
              chips: this.tn_chips
            },
            sincronizado: false
          };

  const id = Date.now().toString();
  // store a plain object to avoid DataCloneError (remove reactive proxies)
  await localforage.setItem(id, JSON.parse(JSON.stringify(viaje)));
  window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Viaje guardado localmente' } }));
  // notify pending count should be updated
  window.dispatchEvent(new CustomEvent('count-update'));
        // limpiar motivo seleccionado después de guardar
        this.motivoSeleccionado = null;
      } finally {
        this.isSaving = false;
      }
    },
    // sincronización gestionada desde la pantalla de Pendientes
    formIsValid() {
      // require fecha as well
      const fechaOk = !!this.viajeFecha;
      if (!fechaOk || !this.choferSeleccionado || !this.camionSeleccionado || !this.origen || !this.destino) return false;
      if (this.sinActividad && !this.motivoSeleccionado) return false;
      return true;
    }
  }
};
</script>