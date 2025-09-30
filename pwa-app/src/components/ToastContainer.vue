<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <transition-group name="toast" tag="div">
      <div v-for="t in toasts" :key="t.id" class="max-w-sm w-full bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'ToastContainer',
  setup() {
    const toasts = ref([]);
    const add = (msg, timeout = 3000) => {
      const id = Date.now() + Math.random();
      toasts.value.push({ id, message: msg });
      setTimeout(() => {
        const idx = toasts.value.findIndex(x => x.id === id);
        if (idx !== -1) toasts.value.splice(idx, 1);
      }, timeout);
    };

    const onToast = (e) => {
      const detail = e.detail || {};
      add(detail.message || String(detail));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('toast', onToast);
    }

    return { toasts };
  }
};
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-6px); }
.toast-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
