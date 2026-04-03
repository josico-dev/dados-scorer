// ─── Iconos SVG de los dados ───────────────────────────────────────────────
//
// Cada componente representa una cara del dado como SVG.
// Todos tienen el mismo tamaño (w-9 h-9) y fondo oscuro.

// Estilo base compartido por todos los dados
const BASE = { viewBox: '0 0 48 48', className: 'w-9 h-9', fill: 'none' }
const BG_GOLD  = { x: 2, y: 2, width: 44, height: 44, rx: 8, fill: '#1e293b', stroke: '#f59e0b', strokeWidth: 2.5 }
const BG_RED   = { ...BG_GOLD, stroke: '#ef4444' }
const BG_GRAY  = { ...BG_GOLD, stroke: '#94a3b8' }

// AS → punto rojo central (borde dorado)
function DiceAs() {
  return (
    <svg {...BASE}>
      <rect {...BG_GOLD} />
      <circle cx="24" cy="24" r="9" fill="#ef4444" />
    </svg>
  )
}

// K, Q, J → letra en dorado sobre dado (borde dorado)
function DiceLetter({ letter }) {
  return (
    <svg {...BASE}>
      <rect {...BG_GOLD} />
      <text x="24" y="33" textAnchor="middle" fontSize="26" fill="#f59e0b" fontWeight="bold" fontFamily="serif">
        {letter}
      </text>
    </svg>
  )
}

// VI → 6 puntos rojos (borde rojo)
function DiceSix() {
  const dots = [
    [15, 13], [33, 13],
    [15, 24], [33, 24],
    [15, 35], [33, 35],
  ]
  return (
    <svg {...BASE}>
      <rect {...BG_RED} />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#ef4444" />
      ))}
    </svg>
  )
}

// V → 5 puntos grises (borde gris)
function DiceFive() {
  const dots = [
    [15, 15], [33, 15],
    [24, 24],
    [15, 33], [33, 33],
  ]
  return (
    <svg {...BASE}>
      <rect {...BG_GRAY} />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#94a3b8" />
      ))}
    </svg>
  )
}

// Mapa de id de cara → componente SVG
export const DICE_ICONS = {
  as: <DiceAs />,
  k:  <DiceLetter letter="K" />,
  q:  <DiceLetter letter="Q" />,
  j:  <DiceLetter letter="J" />,
  vi: <DiceSix />,
  v:  <DiceFive />,
}
