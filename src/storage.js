// ─── Persistencia en localStorage ─────────────────────────────────────────
//
// Guarda y carga el estado de la partida para que no se pierda al recargar.

const STORAGE_KEY    = 'dados-scorer-state'
const STORAGE_VERSION = 3  // incrementar cuando cambie la estructura

// Carga el estado guardado. Devuelve null si no hay nada o si está corrupto.
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Validación de versión y estructura
    if (parsed?._v !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    if (!Array.isArray(parsed?.players) || typeof parsed?.scores !== 'object') return null
    return parsed
  } catch {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    return null
  }
}

// Guarda el estado actual de jugadores y puntuaciones.
export function saveState(players, scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ _v: STORAGE_VERSION, players, scores }))
  } catch {}
}
