// ─── Componente SVG de un dado ─────────────────────────────────────────────
// Cada dado tiene un color propio y animación de giro al lanzar.

import { useState, useEffect } from 'react'

const PIP_POSITIONS = {
  1: [[30, 30]],
  2: [[18, 18], [42, 42]],
  3: [[18, 18], [30, 30], [42, 42]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 15], [42, 15], [18, 30], [42, 30], [18, 45], [42, 45]],
}

// Color de cada dado por índice (0–5): rojo, amarillo, azul, verde, morado, celeste
const DIE_COLORS = [
  { bg: '#3b1212', border: '#ef4444', pip: '#fca5a5' }, // 0 → rojo
  { bg: '#2e2500', border: '#eab308', pip: '#fde047' }, // 1 → amarillo
  { bg: '#1e3a5f', border: '#3b82f6', pip: '#93c5fd' }, // 2 → azul
  { bg: '#1a3320', border: '#22c55e', pip: '#86efac' }, // 3 → verde
  { bg: '#2d1f3d', border: '#a855f7', pip: '#d8b4fe' }, // 4 → morado
  { bg: '#0e2e38', border: '#06b6d4', pip: '#67e8f9' }, // 5 → celeste
]

// Cuando está bloqueado todos se vuelven dorados
const LOCKED = { bg: '#1e1a0e', border: '#f59e0b', pip: '#fcd34d' }

export default function Die({ value, locked, rolling, onClick, className = '', size = 64, index = 0 }) {
  const [animKey, setAnimKey] = useState(0)

  // Reinicia la animación en cada tirada (solo si no está bloqueado)
  useEffect(() => {
    if (rolling && !locked) setAnimKey(k => k + 1)
  }, [rolling, locked])

  const pips   = value >= 1 && value <= 6 ? PIP_POSITIONS[value] : []
  const colors = locked ? LOCKED : DIE_COLORS[index % DIE_COLORS.length]
  const { bg, border, pip } = colors

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
          filter: `drop-shadow(0 0 ${locked ? 8 : 5}px ${border}${locked ? '99' : '66'})`,
          transition: 'filter 0.2s',
        }}
      >
        {/* Sombra interior */}
        <defs>
          <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>
        </defs>

        {/* Fondo del dado */}
        <rect x="3" y="3" width="54" height="54" rx="11"
          fill={bg} stroke={border} strokeWidth="3" />

        {/* Brillo superior */}
        <rect x="3" y="3" width="54" height="54" rx="11"
          fill={`url(#grad-${index})`} />

        {/* Pips */}
        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5.5" fill={pip} />
        ))}

        {/* Si no hay valor todavía */}
        {!value && (
          <text x="30" y="38" textAnchor="middle" fontSize="22"
            fill={border} fontWeight="bold" opacity="0.5">?</text>
        )}
      </svg>

      {/* Indicador de bloqueado */}
      {locked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
          style={{ fontSize: 10, color: '#000' }}>
          🔒
        </div>
      )}
    </button>
  )
}
