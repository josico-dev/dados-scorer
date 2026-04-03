// ─── Configuración del juego ───────────────────────────────────────────────
//
// Aquí defines las caras del dado y los jugadores por defecto.
// Si quieres cambiar los valores de puntuación, edita aquí.

export const DEFAULT_PLAYERS = ['Jugador 1', 'Jugador 2']

// Cada cara del dado tiene un id único, una etiqueta y su valor en puntos
export const ROWS = [
  { id: 'as', label: 'AS', value: 6 },
  { id: 'k',  label: 'K',  value: 5 },
  { id: 'q',  label: 'Q',  value: 4 },
  { id: 'j',  label: 'J',  value: 3 },
  { id: 'vi', label: 'VI', value: 2 },
  { id: 'v',  label: 'V',  value: 1 },
]

// Los dos tipos de puntuación por jugador
export const SUBTYPES = [
  { id: 'Opc', label: 'Opcional' },
  { id: 'Obl', label: 'Obligado' },
]
