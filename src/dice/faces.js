// ─── Mapas de caras por modo ───────────────────────────────────────────────

export const NORMAL_VALUE_TO_ID  = { 1: 'v', 2: 'vi', 3: 'j', 4: 'q', 5: 'k', 6: 'as' }
export const NORMAL_ID_TO_VALUE = { v: 1, vi: 2, j: 3, q: 4, k: 5, as: 6 }

export const AS_VALUE = 6

// Cuenta cuántos dados coinciden con una cara (AS = comodín excepto en fila AS)
export function countDiceForFace(faceId, diceValues) {
  const target = NORMAL_ID_TO_VALUE[faceId]
  return diceValues.filter(d =>
    d === target || (d === AS_VALUE && faceId !== 'as')
  ).length
}
