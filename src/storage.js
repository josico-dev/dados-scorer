// ─── Persistencia en localStorage ─────────────────────────────────────────
//
// Guarda y carga el estado de la partida para que no se pierda al recargar.

const STORAGE_KEY = 'dados-scorer-state'

// Carga el estado guardado. Devuelve null si no hay nada o si está corrupto.
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Validación mínima de estructura
    if (!Array.isArray(parsed?.players) || typeof parsed?.scores !== 'object') return null
    return parsed
  } catch {
    // Si está corrupto, lo borramos para no volver a fallar
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    return null
  }
}

// Guarda el estado actual de jugadores y puntuaciones.
export function saveState(players, scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, scores }))
  } catch {}
}
