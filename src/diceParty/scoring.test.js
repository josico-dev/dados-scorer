// Tests para src/diceParty/scoring.js
// Cubre la lógica de scoring de Dice Party: combos, joker, totales.

import { describe, test, expect } from 'vitest'
import {
  scoreCombo,
  jokerScoreForLower,
  isFiveOfAKind,
  detectJoker,
  calcUpperSum,
  calcTotal,
  calcPotential,
} from './scoring'

// Helpers: scores vacíos por defecto
const emptyScores = () => ({
  ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
  threeKind: null, fourKind: null, fullHouse: null,
  smallStr: null, largeStr: null, fiveKind: null, chance: null,
})

describe('scoreCombo — sección superior (ones..sixes)', () => {
  test('ones: cuenta y multiplica los 1', () => {
    expect(scoreCombo('ones', [1, 1, 1, 4, 5])).toBe(3)
    expect(scoreCombo('ones', [2, 3, 4, 5, 6])).toBe(0)
  })
  test('sixes: cuenta y multiplica los 6', () => {
    expect(scoreCombo('sixes', [6, 6, 6, 6, 1])).toBe(24)
    expect(scoreCombo('sixes', [1, 2, 3, 4, 5])).toBe(0)
  })
  test('cualquier upper devuelve 0 si no hay coincidencias', () => {
    expect(scoreCombo('fours', [1, 2, 3, 5, 6])).toBe(0)
  })
})

describe('scoreCombo — threeKind / fourKind', () => {
  test('threeKind suma todos los dados cuando hay 3+ iguales', () => {
    expect(scoreCombo('threeKind', [4, 4, 4, 2, 1])).toBe(15)
    expect(scoreCombo('threeKind', [5, 5, 5, 5, 3])).toBe(23) // 4 iguales también cumple
  })
  test('threeKind devuelve 0 si no hay 3 iguales', () => {
    expect(scoreCombo('threeKind', [1, 2, 3, 4, 5])).toBe(0)
    expect(scoreCombo('threeKind', [1, 1, 2, 2, 3])).toBe(0)
  })
  test('fourKind requiere 4 iguales', () => {
    expect(scoreCombo('fourKind', [3, 3, 3, 3, 6])).toBe(18)
    expect(scoreCombo('fourKind', [3, 3, 3, 6, 6])).toBe(0)
  })
})

describe('scoreCombo — fullHouse', () => {
  test('3+2 cuenta como full', () => {
    expect(scoreCombo('fullHouse', [2, 2, 5, 5, 5])).toBe(25)
    expect(scoreCombo('fullHouse', [6, 6, 6, 1, 1])).toBe(25)
  })
  test('5 iguales NO cuenta como full', () => {
    expect(scoreCombo('fullHouse', [4, 4, 4, 4, 4])).toBe(0)
  })
  test('4+1 no cuenta como full', () => {
    expect(scoreCombo('fullHouse', [3, 3, 3, 3, 6])).toBe(0)
  })
  test('todos distintos no cuenta', () => {
    expect(scoreCombo('fullHouse', [1, 2, 3, 4, 5])).toBe(0)
  })
})

describe('scoreCombo — escaleras', () => {
  test('smallStr: 4 consecutivos vale 30', () => {
    expect(scoreCombo('smallStr', [3, 4, 5, 6, 3])).toBe(30)
    expect(scoreCombo('smallStr', [1, 2, 3, 4, 4])).toBe(30)
  })
  test('smallStr: largeStr también la contiene', () => {
    expect(scoreCombo('smallStr', [2, 3, 4, 5, 6])).toBe(30)
  })
  test('smallStr: 3 consecutivos no basta', () => {
    expect(scoreCombo('smallStr', [1, 2, 3, 5, 6])).toBe(0)
  })
  test('largeStr: 5 consecutivos vale 40', () => {
    expect(scoreCombo('largeStr', [1, 2, 3, 4, 5])).toBe(40)
    expect(scoreCombo('largeStr', [2, 3, 4, 5, 6])).toBe(40)
  })
  test('largeStr: 4 consecutivos no basta', () => {
    expect(scoreCombo('largeStr', [1, 2, 3, 4, 6])).toBe(0)
  })
})

describe('scoreCombo — fiveKind y chance', () => {
  test('fiveKind: 5 iguales vale 50', () => {
    expect(scoreCombo('fiveKind', [6, 6, 6, 6, 6])).toBe(50)
    expect(scoreCombo('fiveKind', [1, 1, 1, 1, 1])).toBe(50)
  })
  test('fiveKind: 4 iguales no basta', () => {
    expect(scoreCombo('fiveKind', [5, 5, 5, 5, 2])).toBe(0)
  })
  test('chance: siempre suma', () => {
    expect(scoreCombo('chance', [1, 2, 3, 4, 6])).toBe(16)
    expect(scoreCombo('chance', [6, 6, 6, 6, 6])).toBe(30)
  })
  test('comboId desconocido: 0', () => {
    expect(scoreCombo('inventado', [1, 2, 3, 4, 5])).toBe(0)
  })
})

describe('jokerScoreForLower', () => {
  test('fullHouse fijo 25', () => {
    expect(jokerScoreForLower('fullHouse', [1, 2, 3, 4, 5])).toBe(25)
  })
  test('smallStr fijo 30', () => {
    expect(jokerScoreForLower('smallStr', [6, 6, 6, 6, 6])).toBe(30)
  })
  test('largeStr fijo 40', () => {
    expect(jokerScoreForLower('largeStr', [1, 1, 1, 1, 1])).toBe(40)
  })
  test('threeKind / fourKind / chance: suma de dados', () => {
    expect(jokerScoreForLower('threeKind', [4, 4, 4, 4, 4])).toBe(20)
    expect(jokerScoreForLower('fourKind',  [5, 5, 5, 5, 5])).toBe(25)
    expect(jokerScoreForLower('chance',    [2, 2, 2, 2, 2])).toBe(10)
  })
})

describe('isFiveOfAKind', () => {
  test('5 iguales → true', () => {
    expect(isFiveOfAKind([3, 3, 3, 3, 3])).toBe(true)
  })
  test('4 iguales → false', () => {
    expect(isFiveOfAKind([3, 3, 3, 3, 6])).toBe(false)
  })
  test('todos distintos → false', () => {
    expect(isFiveOfAKind([1, 2, 3, 4, 5])).toBe(false)
  })
  test('menos de 5 dados → false', () => {
    expect(isFiveOfAKind([3, 3, 3])).toBe(false)
  })
  test('dado 0 (estado inicial) → false', () => {
    expect(isFiveOfAKind([0, 0, 0, 0, 0])).toBe(false)
  })
})

describe('detectJoker', () => {
  test('no joker si dados no son 5 iguales', () => {
    const r = detectJoker([1, 2, 3, 4, 5], { ...emptyScores(), fiveKind: 50 })
    expect(r).toEqual({ jokerActive: false, jokerUpperId: null })
  })
  test('no joker si fiveKind aún no se ha jugado (null)', () => {
    const r = detectJoker([3, 3, 3, 3, 3], emptyScores())
    expect(r).toEqual({ jokerActive: false, jokerUpperId: null })
  })
  test('no joker si fiveKind se jugó con 0 (tachado)', () => {
    const r = detectJoker([3, 3, 3, 3, 3], { ...emptyScores(), fiveKind: 0 })
    expect(r).toEqual({ jokerActive: false, jokerUpperId: null })
  })
  test('joker activo si fiveKind=50 y dados son 5 iguales', () => {
    const r = detectJoker([3, 3, 3, 3, 3], { ...emptyScores(), fiveKind: 50 })
    expect(r).toEqual({ jokerActive: true, jokerUpperId: 'threes' })
  })
  test('jokerUpperId corresponde al valor de los dados', () => {
    expect(detectJoker([1, 1, 1, 1, 1], { ...emptyScores(), fiveKind: 50 }).jokerUpperId).toBe('ones')
    expect(detectJoker([6, 6, 6, 6, 6], { ...emptyScores(), fiveKind: 50 }).jokerUpperId).toBe('sixes')
  })
})

describe('calcUpperSum', () => {
  test('suma solo los uppers, ignora null', () => {
    const s = { ...emptyScores(), ones: 3, twos: 6, threes: 9 }
    expect(calcUpperSum(s)).toBe(18)
  })
  test('ignora los lowers aunque tengan valor', () => {
    const s = { ...emptyScores(), ones: 5, threeKind: 30, fullHouse: 25 }
    expect(calcUpperSum(s)).toBe(5)
  })
  test('todos null → 0', () => {
    expect(calcUpperSum(emptyScores())).toBe(0)
  })
})

describe('calcTotal', () => {
  test('suma básica sin bonus ni joker', () => {
    const s = { ...emptyScores(), ones: 3, threeKind: 15, chance: 20 }
    expect(calcTotal(s, 0)).toBe(38)
  })
  test('bonus 35 si upper sum > 62', () => {
    const s = {
      ...emptyScores(),
      ones: 4, twos: 8, threes: 12, fours: 16, fives: 15, sixes: 12, // = 67
    }
    expect(calcTotal(s, 0)).toBe(67 + 35)
  })
  test('sin bonus si upper sum es exactamente 62', () => {
    const s = {
      ...emptyScores(),
      ones: 3, twos: 4, threes: 9, fours: 8, fives: 20, sixes: 18, // suma 62
    }
    expect(calcTotal(s, 0)).toBe(62)
  })
  test('+100 por cada jokerBonusCount', () => {
    const s = { ...emptyScores(), chance: 20 }
    expect(calcTotal(s, 1)).toBe(120)
    expect(calcTotal(s, 3)).toBe(320)
  })
  test('jokerBonusCount por defecto = 0', () => {
    const s = { ...emptyScores(), chance: 10 }
    expect(calcTotal(s)).toBe(10)
  })
})

describe('calcPotential — sin joker', () => {
  test('combo libre muestra su score potencial', () => {
    const r = calcPotential([4, 4, 4, 2, 1], emptyScores(), false, null)
    expect(r.threeKind).toEqual({ score: 15, available: true, forced: false })
    expect(r.fours).toEqual({ score: 12, available: true, forced: false })
  })
  test('combo ya jugado: available=false, conserva score guardado', () => {
    const s = { ...emptyScores(), threeKind: 22 }
    const r = calcPotential([1, 2, 3, 4, 5], s, false, null)
    expect(r.threeKind).toEqual({ score: 22, available: false, forced: false })
  })
  test('combo jugado con 0 (tachado) sigue ocupando la casilla', () => {
    const s = { ...emptyScores(), fullHouse: 0 }
    const r = calcPotential([2, 2, 5, 5, 5], s, false, null)
    expect(r.fullHouse.available).toBe(false)
    expect(r.fullHouse.score).toBe(0)
  })
})

describe('calcPotential — joker activo', () => {
  test('upper libre: el upperId queda forzado, el resto bloqueado', () => {
    const s = { ...emptyScores(), fiveKind: 50 }
    const r = calcPotential([3, 3, 3, 3, 3], s, true, 'threes')
    // El upper correspondiente debe usarse: forced=true
    expect(r.threes).toEqual({ score: 15, available: true, forced: true })
    // El resto bloqueado
    expect(r.chance.available).toBe(false)
    expect(r.fullHouse.available).toBe(false)
    expect(r.fours.available).toBe(false)
  })

  test('upper ocupado: lowers con score joker disponibles, otros uppers disponibles a 0', () => {
    const s = { ...emptyScores(), fiveKind: 50, threes: 9 }
    const r = calcPotential([3, 3, 3, 3, 3], s, true, 'threes')
    // El upperId ya jugado: no disponible
    expect(r.threes.available).toBe(false)
    // Lowers libres con score joker
    expect(r.fullHouse).toEqual({ score: 25, available: true, forced: false })
    expect(r.smallStr).toEqual({ score: 30, available: true, forced: false })
    expect(r.largeStr).toEqual({ score: 40, available: true, forced: false })
    expect(r.chance).toEqual({ score: 15, available: true, forced: false })
    expect(r.threeKind).toEqual({ score: 15, available: true, forced: false })
    expect(r.fourKind).toEqual({ score: 15, available: true, forced: false })
    // Otros uppers libres → 0 pts, available
    expect(r.ones).toEqual({ score: 0, available: true, forced: false })
    expect(r.sixes).toEqual({ score: 0, available: true, forced: false })
  })

  test('upper ocupado y lower también ocupado: ese lower no disponible', () => {
    const s = { ...emptyScores(), fiveKind: 50, threes: 9, fullHouse: 25 }
    const r = calcPotential([3, 3, 3, 3, 3], s, true, 'threes')
    expect(r.fullHouse.available).toBe(false)
    expect(r.fullHouse.score).toBe(25) // conserva el valor guardado
    // Pero otros lowers siguen disponibles
    expect(r.chance.available).toBe(true)
  })
})
