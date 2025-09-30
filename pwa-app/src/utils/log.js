// Lightweight logging helper
// debug/info are enabled only in development (import.meta.env.DEV)
// warn/error always log (but can be routed or enhanced later)
export function debug(...args) {
  if (import.meta.env && import.meta.env.DEV) {
    console.log(...args);
  }
}

export function info(...args) {
  if (import.meta.env && import.meta.env.DEV) {
    console.info(...args);
  }
}

export function warn(...args) {
  console.warn(...args);
}

export function error(...args) {
  console.error(...args);
}

export default { debug, info, warn, error };
