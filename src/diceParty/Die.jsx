// ─── Componente SVG de un dado ─────────────────────────────────────────────
// El color depende del VALOR de la cara (1=rojo, 2=amarillo, 3=azul, 4=verde, 5=morado, 6=celeste)

import { useState, useEffect } from 'react'

const PIP_POSITIONS = {
  1: [[30, 30]],
  2: [[18, 18], [42, 42]],
  3: [[18, 18], [30, 30], [42, 42]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 15], [42, 15], [18, 30], [42, 30], [18, 45], [42, 45]],
}

// Color por VALOR de la cara
export const FACE_COLORS = {
  1: { bg: '#3b0f0f', border: '#ef4444', pip: '#fca5a5', glow: '#ef444488' }, // rojo
  2: { bg: '#2e2200', border: '#eab308', pip: '#fde047', glow: '#eab30888' }, // amarillo
  3: { bg: '#0f1f3b', border: '#3b82f6', pip: '#93c5fd', glow: '#3b82f688' }, // azul
  4: { bg: '#0f2e1a', border: '#22c55e', pip: '#86efac', glow: '#22c55e88' }, // verde
  5: { bg: '#1f0f3b', border: '#a855f7', pip: '#d8b4fe', glow: '#a855f788' }, // morado
  6: { bg: '#0a2530', border: '#06b6d4', pip: '#67e8f9', glow: '#06b6d488' }, // celeste
  0: { bg: '#1e293b', border: '#475569', pip: '#94a3b8', glow: '#47556944' }, // sin valor
}

export const LOCKED_COLORS = { bg: '#1e1a0e', border: '#f59e0b', pip: '#fcd34d', glow: '#f59e0b99' }

export default function Die({ value, locked, rolling, onClick, className = '', size = 64 }) {
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (rolling && !locked) setAnimKey(k => k + 1)
  }, [rolling, locked])

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
        key={animKey}
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
