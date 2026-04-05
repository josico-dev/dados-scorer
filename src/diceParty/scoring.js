// ─── Funciones de puntuación para Dice Party ───────────────────────────────
//
// Calcula la puntuación potencial de cada combinación dado un array de 5 dados.
// También gestiona la lógica del Joker (5 de un tipo bonus).

import { UPPER_COMBOS, LOWER_COMBOS, ALL_COMBOS, UPPER_ID_BY_VALUE } from './combinations'

// ── Helpers internos ─────────────────────────────────────────────────────────

/** Suma de todos los dados */
function sumDice(dice) {
  return dice.reduce((a, b) => a + b, 0)
}

/** Cuenta las ocurrencias de cada valor */
function countValues(dice) {
  const c = {}
  dice.forEach(d => { c[d] = (c[d] || 0) + 1 })
  return c
}

/** Comprueba si hay al menos N dados del mismo valor */
function hasNOfAKind(dice, n) {
  return Object.values(countValues(dice)).some(v => v >= n)
}

/** Comprueba si hay full house (3+2), sin contar 5 iguales */
function isFullHouse(dice) {
  const vals = Object.values(countValues(dice))
  return vals.length === 2 && vals.includes(3) && vals.includes(2)
}

/** Comprueba si hay una secuencia de longitud >= n */
function hasSequence(dice, n) {
  const unique = [...new Set(dice)].sort((a, b) => a - b)
  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    streak = unique[i] === unique[i - 1] + 1 ? streak + 1 : 1
    if (streak >= n) return true
  }
  return streak >= n
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Calcula la puntuación de una combinación para unos dados dados.
 * Devuelve el valor numérico (0 si no cumple el requisito).
 *
 * @param {string}   comboId - ID de la combinación
 * @param {number[]} dice    - Array de 5 valores (1-6)
 * @returns {number}
 */
export function scoreCombo(comboId, dice) {
  // Sección superior: suma de dados con el valor correspondiente
  const upper = UPPER_COMBOS.find(c => c.id === comboId)
  if (upper) {
    return dice.filter(d => d === upper.upperValue).reduce((a, b) => a + b, 0)
  }

  // Sección inferior
  switch (comboId) {
    case 'threeKind':
      return hasNOfAKind(dice, 3) ? sumDice(dice) : 0
    case 'fourKind':
      return hasNOfAKind(dice, 4) ? sumDice(dice) : 0
    case 'fullHouse':
      return isFullHouse(dice) ? 25 : 0
    case 'smallStr':
      return hasSequence(dice, 4) ? 30 : 0
    case 'largeStr':
      return hasSequence(dice, 5) ? 40 : 0
    case 'fiveKind':
      return hasNOfAKind(dice, 5) ? 50 : 0
    case 'chance':
      return sumDice(dice)
    default:
      return 0
  }
}

/**
 * Calcula la puntuación de un lower combo cuando actúa como Joker.
 * Full/EscPeq/EscGran puntúan sus valores fijos.
 * Los demás puntúan la suma de los dados.
 */
export function jokerScoreForLower(comboId, dice) {
  switch (comboId) {
    case 'fullHouse': return 25
    case 'smallStr':  return 30
    case 'largeStr':  return 40
    default:          return sumDice(dice) // threeKind, fourKind, chance
  }
}

/**
 * Comprueba si los dados son 5 de un tipo.
 */
export function isFiveOfAKind(dice) {
  return dice.length === 5 && new Set(dice).size === 1 && dice[0] !== 0
}

/**
 * Detecta si el joker está activo para este turno.
 * - Los dados son 5 iguales
 * - La combinación 5Iguales ya fue jugada CON 50 pts (no con 0)
 *
 * @returns {{ jokerActive: boolean, jokerUpperId: string|null }}
 */
export function detectJoker(dice, playerScores) {
  if (!isFiveOfAKind(dice)) return { jokerActive: false, jokerUpperId: null }
  const fiveKindScore = playerScores['fiveKind']
  if (fiveKindScore !== 50) return { jokerActive: false, jokerUpperId: null }
  const upperId = UPPER_ID_BY_VALUE[dice[0]]
  return { jokerActive: true, jokerUpperId: upperId }
}

/**
 * Calcula la suma de la sección superior de un jugador.
 */
export function calcUpperSum(playerScores) {
  return UPPER_COMBOS.reduce((s, c) => s + (playerScores[c.id] ?? 0), 0)
}

/**
 * Calcula el total completo de un jugador.
 *
 * @param {Object} playerScores    - { comboId: valor|null }
 * @param {number} jokerBonusCount - cuántas veces ganó el bonus Joker
 * @returns {number}
 */
export function calcTotal(playerScores, jokerBonusCount = 0) {
  const comboSum = ALL_COMBOS.reduce((s, c) => s + (playerScores[c.id] ?? 0), 0)
  const bonus = calcUpperSum(playerScores) > 62 ? 35 : 0
  return comboSum + bonus + jokerBonusCount * 100
}

/**
 * Calcula la puntuación potencial de todas las combinaciones para el turno actual.
 * Respeta la regla Joker si aplica.
 *
 * @param {number[]} dice         - Valores actuales de los dados
 * @param {Object}   playerScores - Puntuaciones del jugador actual
 * @param {boolean}  jokerActive  - Si el joker está activo
 * @param {string}   jokerUpperId - ID del upper correspondiente (si joker)
 * @returns {Object}              - { comboId: { score, available, forced } }
 */
export function calcPotential(dice, playerScores, jokerActive, jokerUpperId) {
  const result = {}
  const diceSum = sumDice(dice)

  ALL_COMBOS.forEach(combo => {
    const alreadyPlayed = playerScores[combo.id] !== null && playerScores[combo.id] !== undefined
    let score = 0
    let available = !alreadyPlayed
    let forced = false

    if (jokerActive) {
      const upperFree = playerScores[jokerUpperId] === null || playerScores[jokerUpperId] === undefined

      if (combo.id === jokerUpperId) {
        // El upper correspondiente al joker
        score = scoreCombo(combo.id, dice)
        available = !alreadyPlayed
        forced = upperFree && !alreadyPlayed
      } else if (!upperFree && !alreadyPlayed) {
        // Upper ocupado → puede usar cualquier combo disponible
        const isLower = LOWER_COMBOS.some(c => c.id === combo.id)
        if (isLower) {
          // Combos lower puntúan con valores joker especiales
          score = jokerScoreForLower(combo.id, dice)
          available = true
        } else {
          // Upper alternativo → 0 pts
          score = 0
          available = true
        }
      } else if (upperFree && combo.id !== jokerUpperId) {
        // Joker activo pero el upper está libre → DEBE usar el upper, resto bloqueado
        available = false
        score = alreadyPlayed ? (playerScores[combo.id] ?? 0) : 0
      } else {
        available = false
        score = playerScores[combo.id] ?? 0
      }
    } else {
      score = alreadyPlayed ? (playerScores[combo.id] ?? 0) : scoreCombo(combo.id, dice)
    }

    result[combo.id] = { score, available, forced }
  })

  return result
}
