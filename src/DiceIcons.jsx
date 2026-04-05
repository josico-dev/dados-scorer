// ─── Iconos SVG de los dados — modo normal ────────────────────────────────
// Cada cara tiene un color vivo propio, coherente con FACE_COLORS de Die.jsx

const BASE = { viewBox: '0 0 48 48', className: 'w-9 h-9', fill: 'none' }

// AS (valor 6) → punto rojo sólido
function DiceAs() {
  return (
    <svg {...BASE}>
      <rect x="2" y="2" width="44" height="44" rx="8" fill="#2a0f2e" stroke="#ec4899" strokeWidth="2.5"/>
      <circle cx="24" cy="24" r="10" fill="#ef4444" />
    </svg>
  )
}

// K (valor 5) → morado
function DiceK() {
  return (
    <svg {...BASE}>
      <rect x="2" y="2" width="44" height="44" rx="8" fill="#1f0f3b" stroke="#a855f7" strokeWidth="2.5"/>
      <text x="24" y="33" textAnchor="middle" fontSize="26" fill="#d8b4fe" fontWeight="bold" fontFamily="serif">K</text>
    </svg>
  )
}

// Q (valor 4) → verde
function DiceQ() {
  return (
    <svg {...BASE}>
      <rect x="2" y="2" width="44" height="44" rx="8" fill="#0f2e1a" stroke="#22c55e" strokeWidth="2.5"/>
      <text x="24" y="33" textAnchor="middle" fontSize="26" fill="#86efac" fontWeight="bold" fontFamily="serif">Q</text>
    </svg>
  )
}

// J (valor 3) → azul
function DiceJ() {
  return (
    <svg {...BASE}>
      <rect x="2" y="2" width="44" height="44" rx="8" fill="#0f1f3b" stroke="#3b82f6" strokeWidth="2.5"/>
      <text x="24" y="33" textAnchor="middle" fontSize="26" fill="#93c5fd" fontWeight="bold" fontFamily="serif">J</text>
    </svg>
  )
}

// VI (valor 2) → amarillo — 6 puntos
function DiceSix() {
  const dots = [[15,13],[33,13],[15,24],[33,24],[15,35],[33,35]]
  return (
    <svg {...BASE}>
      <rect x="2" y="2" width="44" height="44" rx="8" fill="#2e2200" stroke="#eab308" strokeWidth="2.5"/>
      {dots.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="4" fill="#fde047"/>)}
    </svg>
  )
}

// V (valor 1) → rojo — 5 puntos
function DiceFive() {
  const dots = [[15,15],[33,15],[24,24],[15,33],[33,33]]
  return (
    <svg {...BASE}>
      <rect x="2" y="2" width="44" height="44" rx="8" fill="#3b0f0f" stroke="#ef4444" strokeWidth="2.5"/>
      {dots.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="4" fill="#fca5a5"/>)}
    </svg>
  )
}

export const DICE_ICONS = {
  as: <DiceAs />,
  k:  <DiceK />,
  q:  <DiceQ />,
  j:  <DiceJ />,
  vi: <DiceSix />,
  v:  <DiceFive />,
}
