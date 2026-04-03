// ─── Funciones de utilidad ─────────────────────────────────────────────────

import { ROWS, SUBTYPES } from './config'

// Crea un marcador vacío para todos los jugadores.
// Estructura: scores[indiceJugador][idCara][idTipo] = ''
export function emptyScores(players) {
  const scores = {}
  players.forEach((_, playerIndex) => {
    scores[playerIndex] = {}
    ROWS.forEach(row => {
      scores[playerIndex][row.id] = {}
      SUBTYPES.forEach(sub => {
        scores[playerIndex][row.id][sub.id] = ''
      })
    })
  })
  return scores
}

// Calcula el total de puntos de un jugador.
// Total = suma de (dadosOpcionales + dadosObligados) × valorDeLaCara
export function playerTotal(scores, playerIndex) {
  return ROWS.reduce((total, row) => {
    const optional = parseFloat(scores[playerIndex]?.[row.id]?.Opc) || 0
    const mandatory = parseFloat(scores[playerIndex]?.[row.id]?.Obl) || 0
    return total + (optional + mandatory) * row.value
  }, 0)
}
