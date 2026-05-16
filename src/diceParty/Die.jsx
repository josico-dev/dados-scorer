// ─── Componente SVG de un dado ─────────────────────────────────────────────
// El color depende del VALOR de la cara (1=rojo, 2=amarillo, …, 6=fucsia).
// El padre pasa `rollKey` (típicamente rollCount) para que la animación CSS
// se reinicie en cada tirada — el cambio de key remonta el SVG.

import { PIP_POSITIONS, FACE_COLORS, LOCKED_COLORS } from './dieStyles'

export default function Die({ value, locked, rolling, rollKey = 0, onClick, className = '', size = 64 }) {
  const pips   = value >= 1 && value <= 6 ? PIP_POSITIONS[value] : []
  const colors = locked ? LOCKED_COLORS : (FACE_COLORS[value] ?? FACE_COLORS[0])

  return (
    <button
      onClick={onClick}
      className={`relative touch-manipulation select-none focus:outline-none ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-label={value ? `Dado ${value}${locked ? ' (bloqueado)' : ''}` : 'Dado'}
    >
      <svg
        key={rollKey}
        viewBox="0 0 60 60"
        width={size}
        height={size}
        className={rolling && !locked ? 'die-spinning' : ''}
        style={{
          display: 'block',
          filter: `drop-shadow(0 0 ${locked ? 10 : 6}px ${colors.glow})`,
          transition: 'filter 0.3s',
        }}
      >
        <defs>
          <linearGradient id={`g-${value}-${locked}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
          </linearGradient>
        </defs>

        {/* Fondo */}
        <rect x="3" y="3" width="54" height="54" rx="12"
          fill={colors.bg} stroke={colors.border} strokeWidth="3.5" />
        {/* Brillo */}
        <rect x="3" y="3" width="54" height="54" rx="12"
          fill={`url(#g-${value}-${locked})`} />

        {/* Pips */}
        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5.5" fill={colors.pip} />
        ))}

        {!value && (
          <text x="30" y="38" textAnchor="middle" fontSize="22"
            fill="#475569" fontWeight="bold">?</text>
        )}
      </svg>

      {locked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
          style={{ fontSize: 10, color: '#000' }}>🔒</div>
      )}
    </button>
  )
}
