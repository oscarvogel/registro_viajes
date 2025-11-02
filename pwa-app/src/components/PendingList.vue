<template>
  <div class="max-w-xl mx-auto p-4">
    <h2 class="text-lg font-semibold mb-4">Pendientes de sincronización</h2>
    <div v-if="loading">Cargando...</div>
    <div v-else>
      <div class="mb-4 flex items-center justify-between gap-3">
        <div class="text-sm text-gray-700">Pendientes: <span class="font-medium">{{ items.length }}</span></div>
        <div class="flex items-center gap-2">
          <button @click="exportToExcel" :disabled="items.length===0" class="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2 disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14H8v-2h2v2zm0-4H8V7h2v6zm4 4h-2v-4h2v4zm0-6h-2V7h2v2z"/></svg>
            <span>Exportar</span>
          </button>
          <button @click="syncAll" :disabled="items.length===0 || isSyncingAll" class="px-3 py-2 bg-indigo-600 text-white rounded flex items-center gap-2 disabled:opacity-50">
            <template v-if="isSyncingAll">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path>
              </svg>
              <span>Sincronizando ({{ syncedCount }} / {{ totalToSync }})</span>
            </template>
            <template v-else>
              <!-- sync all icon (valid path) -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M20 4l-4 4M4 20l4-4" />
              </svg>
              <span>Sincronizar todo</span>
            </template>
          </button>
        </div>
      </div>
      <div v-if="items.length === 0" class="text-gray-600">No hay viajes pendientes.</div>
      <ul class="space-y-3">
        <li v-for="it in items" :key="it.key" class="p-3 bg-white rounded shadow flex justify-between items-start">
          <div>
            <div class="text-sm text-gray-700"><strong>Fecha:</strong> {{ it.viaje.fecha }}</div>
            <div class="text-sm text-gray-700"><strong>Origen:</strong> {{ it.viaje.origen }} — <span class="font-medium">{{ it.viaje.destino }}</span></div>
            <div class="text-sm text-gray-500">DNI: {{ it.viaje.dni }} | Patente: {{ it.viaje.patente }}</div>
            <div v-if="it.viaje.sinActividad" class="mt-2 text-sm text-yellow-700"><strong>Sin actividad</strong> — <span class="font-normal">{{ it.viaje.motivoSinActividad || '-' }}</span></div>
            <p v-if="it.viaje.observaciones" class="mt-2 text-sm text-gray-600 italic">Observaciones: <span class="font-normal not-italic">{{ it.viaje.observaciones }}</span></p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <button @click="syncOne(it.key)" class="px-3 py-1 bg-indigo-600 text-white rounded">Sincronizar</button>
            <button @click="removeOne(it.key)" class="px-3 py-1 border rounded">Eliminar</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import localforage from 'localforage';
import axios from 'axios';
import log from '../utils/log';
import * as XLSX from 'xlsx';

export default {
  name: 'PendingList',
  data() {
    return { items: [], loading: true, isSyncingAll: false, totalToSync: 0, syncedCount: 0 };
  },
  async mounted() {
    await this.loadItems();
    window.addEventListener('sync-all', this.syncAll);
  },
  beforeUnmount() {
    window.removeEventListener('sync-all', this.syncAll);
  },
  methods: {
    formatFields(viaje) {
      // Map local viaje object to Airtable fields. Adjust names if your Airtable columns differ.
      // ensure Fecha is an ISO string (Airtable expects a date string like YYYY-MM-DD or ISO 8601)
      // Ensure Fecha is sent as YYYY-MM-DD (Airtable-friendly date-only format)
      let safeFecha = '';
      try {
        const d = new Date(viaje.fecha);
        if (isNaN(d.getTime())) {
          // fallback to today
          safeFecha = new Date().toISOString().slice(0, 10);
        } else {
          // take only YYYY-MM-DD portion
          safeFecha = d.toISOString().slice(0, 10);
        }
      } catch (e) {
        safeFecha = new Date().toISOString().slice(0, 10);
      }

      return {
        Fecha: safeFecha,
        Chofer: viaje.dni || viaje.chofer || '',
        Patente: viaje.patente,
        Origen: viaje.origen,
        Destino: viaje.destino,
        Observaciones: viaje.observaciones || '',
        Sin_Actividad: !!viaje.sinActividad,
        Motivo_Sin_Actividad: viaje.motivoSinActividad || '',
        Producto: viaje.productos?.tipo || '',
        TNPulpable: viaje.productos?.pulpable ?? 0,
        TNAserrable: viaje.productos?.rollos ?? 0,
        TNChips: viaje.productos?.chips ?? 0
      };
    },

    async postWithRetries(fields, maxRetries = 3) {
      // Build Airtable URL robustly
      const base = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
      const table = import.meta.env.VITE_AIRTABLE_TABLE_NAME || '';
      let url = '';
      if (base.includes('/')) {
        url = `https://api.airtable.com/v0/${base}`;
        if (table && !base.endsWith(`/${table}`)) url = `${url}/${table}`;
      } else {
        url = `https://api.airtable.com/v0/${base}/${table}`;
      }

      const token = import.meta.env.VITE_AIRTABLE_TOKEN || import.meta.env.VITE_AIRTABLE_API_KEY || '';
      const headers = { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' };

      let attempt = 0;
      let lastErr = null;
      while (attempt <= maxRetries) {
        try {
          // Log payload and URL for debugging Airtable field validation issues
          log.debug('[PendingList] Airtable POST attempt', { url, fields });
          log.debug('[PendingList] Fecha field type/value:', typeof fields.Fecha, fields.Fecha);
          return await axios.post(url, { fields }, { headers });
        } catch (err) {
          lastErr = err;
          attempt++;
          if (attempt > maxRetries) break;
          const backoff = 500 * Math.pow(2, attempt - 1); // 500ms, 1s, 2s...
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Reintentando (${attempt}/${maxRetries})...` } }));
          await new Promise(r => setTimeout(r, backoff));
        }
      }

      // Surface response body for debugging (422, etc.)
      if (lastErr && lastErr.response) {
        const status = lastErr.response.status;
        const body = lastErr.response.data;
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Error ${status} al sincronizar. Respuesta: ${JSON.stringify(body)}` } }));
        // If 404, also show URL
        if (status === 404) window.dispatchEvent(new CustomEvent('toast', { detail: { message: `URL utilizada: ${url}` } }));
      }
      throw lastErr;
    },

    async loadItems() {
      this.loading = true;
      const keys = await localforage.keys();
      const list = [];
      for (const key of keys) {
        const v = await localforage.getItem(key);
        if (v && !v.sincronizado) list.push({ key, viaje: v });
      }
      this.items = list;
      this.loading = false;
    },

    async syncOne(key) {
      if (this.isSyncingAll) return; // evitar conflictos mientras se sincroniza todo
      const viaje = await localforage.getItem(key);
      if (!viaje) return;
      try {
        await this.postWithRetries(this.formatFields(viaje), 3);
  viaje.sincronizado = true;
  await localforage.setItem(key, JSON.parse(JSON.stringify(viaje)));
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Sincronizado: ' + key } }));
        await this.loadItems();
        window.dispatchEvent(new CustomEvent('count-update'));
      } catch (err) {
        log.error(err);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Error sincronizando (después de reintentos): ' + key } }));
      }
    },

    async syncAll() {
      if (this.isSyncingAll) return;
      this.isSyncingAll = true;
      this.syncedCount = 0;
      const keys = await localforage.keys();
      const toSync = [];
      for (const key of keys) {
        const v = await localforage.getItem(key);
        if (v && !v.sincronizado) toSync.push({ key, viaje: v });
      }
      this.totalToSync = toSync.length;
      if (toSync.length === 0) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'No hay viajes para sincronizar' } }));
        this.isSyncingAll = false;
        return;
      }

      for (const it of toSync) {
        try {
          await this.postWithRetries(this.formatFields(it.viaje), 3);
          it.viaje.sincronizado = true;
          await localforage.setItem(it.key, JSON.parse(JSON.stringify(it.viaje)));
          this.syncedCount++;
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Sincronizado: ${it.key}` } }));
        } catch (err) {
          log.error('Error syncAll item', it.key, err);
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Error sincronizando (después de reintentos): ${it.key}` } }));
        }
      }

      await this.loadItems();
      window.dispatchEvent(new CustomEvent('count-update'));
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Sincronización finalizada (${this.syncedCount}/${this.totalToSync})` } }));
      this.isSyncingAll = false;
      this.totalToSync = 0;
      this.syncedCount = 0;
    },

    async exportToExcel() {
      const keys = await localforage.keys();
      const rows = [];
      for (const key of keys) {
        const v = await localforage.getItem(key);
        if (!v) continue;
        rows.push({
          ID: key,
          Fecha: v.fecha || '',
          DNI: v.dni || (v.chofer && v.chofer.dni) || '',
          Patente: v.patente || (v.camion && v.camion.patente) || '',
          Origen: v.origen || '',
          Destino: v.destino || '',
          Sin_Actividad: !!v.sinActividad,
          Motivo: v.motivoSinActividad || '',
          Observaciones: v.observaciones || '',
          Producto: v.productos?.tipo || '',
          TN_Pulpable: v.productos?.pulpable ?? 0,
          TN_Rollos: v.productos?.rollos ?? 0,
          TN_Chips: v.productos?.chips ?? 0,
          Sincronizado: !!v.sincronizado
        });
      }

      if (rows.length === 0) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'No hay viajes para exportar' } }));
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Viajes');
      const fname = `viajes_export_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFileXLSX(wb, fname);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Exportado ${rows.length} viajes a ${fname}` } }));
    },

    async removeOne(key) {
      await localforage.removeItem(key);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Eliminado: ' + key } }));
      await this.loadItems();
      window.dispatchEvent(new CustomEvent('count-update'));
    }
  }
};
</script>