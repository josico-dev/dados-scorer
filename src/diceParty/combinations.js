// ─── Definición de las 13 combinaciones de Dice Party ──────────────────────
//
// Cada combinación tiene:
//   id        — identificador único
//   label     — nombre en español
//   badge     — etiqueta corta para el scorecard
//   section   — 'upper' | 'lower'
//   upperValue — (solo upper) valor del dado que se cuenta (1-6)
//   fixedScore — (solo lower) puntuación fija, o null si es suma de dados

// ── Sección Superior ────────────────────────────────────────────────────────
export const UPPER_COMBOS = [
  { id: 'ones',   label: 'Ases',    badge: 'Ases',    section: 'upper', upperValue: 1 },
  { id: 'twos',   label: 'Doses',   badge: 'Doses',   section: 'upper', upperValue: 2 },
  { id: 'threes', label: 'Treses',  badge: 'Treses',  section: 'upper', upperValue: 3 },
  { id: 'fours',  label: 'Cuatros', badge: 'Cuatros', section: 'upper', upperValue: 4 },
  { id: 'fives',  label: 'Cincos',  badge: 'Cincos',  section: 'upper', upperValue: 5 },
  { id: 'sixes',  label: 'Seises',  badge: 'Seises',  section: 'upper', upperValue: 6 },
]

// ── Sección Inferior ────────────────────────────────────────────────────────
export const LOWER_COMBOS = [
  { id: 'threeKind',   label: '3 de un Tipo',      badge: '3 Iguales', section: 'lower', fixedScore: null },
  { id: 'fourKind',    label: '4 de un Tipo',       badge: '4 Iguales', section: 'lower', fixedScore: null },
  { id: 'fullHouse',   label: 'Full',               badge: 'Full',      section: 'lower', fixedScore: 25   },
  { id: 'smallStr',    label: 'Escalera Pequeña',   badge: 'Esc. Peq.', section: 'lower', fixedScore: 30   },
  { id: 'largeStr',    label: 'Escalera Grande',    badge: 'Esc. Gran.',section: 'lower', fixedScore: 40   },
  { id: 'fiveKind',    label: '5 de un Tipo',       badge: '5 Iguales', section: 'lower', fixedScore: 50   },
  { id: 'chance',      label: 'Azar',               badge: 'Azar',      section: 'lower', fixedScore: null },
]

// Todas las combinaciones en orden
export const ALL_COMBOS = [...UPPER_COMBOS, ...LOWER_COMBOS]

// ID del upper correspondiente a cada valor de dado (para la regla Joker)
export const UPPER_ID_BY_VALUE = {
  1: 'ones',
  2: 'twos',
  3: 'threes',
  4: 'fours',
  5: 'fives',
  6: 'sixes',
}
