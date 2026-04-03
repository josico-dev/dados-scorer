// ─── Persistencia en localStorage ─────────────────────────────────────────
//
// Guarda y carga el estado de la partida para que no se pierda al recargar.

const STORAGE_KEY = 'dados-scorer-state'

// Carga el estado guardado. Devuelve null si no hay nada.
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Guarda el estado actual de jugadores y puntuaciones.
export function saveState(players, scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, scores }))
  } catch {
    // Si el localStorage no está disponible, simplemente ignoramos el error
  }
}
