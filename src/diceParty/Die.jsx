// ─── Componente SVG de un dado ─────────────────────────────────────────────

import { useState, useEffect } from 'react'

const PIP_POSITIONS = {
  1: [[30, 30]],
  2: [[18, 18], [42, 42]],
  3: [[18, 18], [30, 30], [42, 42]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 15], [42, 15], [18, 30], [42, 30], [18, 45], [42, 45]],
}

export default function Die({ value, locked, rolling, onClick, className = '', size = 64 }) {
  // animKey cambia con cada tirada para reiniciar la animación CSS desde cero
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (rolling) setAnimKey(k => k + 1)
  }, [rolling])

  const pips        = value >= 1 && value <= 6 ? PIP_POSITIONS[value] : []
  const borderColor = locked ? '#f59e0b' : '#94a3b8'
  const bgColor     = locked ? '#1e1a0e' : '#1e293b'
  const pipColor    = locked ? '#f59e0b' : '#e2e8f0'

  return (
    <button
      onClick={onClick}
      className={`relative touch-manipulation select-none focus:outline-none ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-label={value ? `Dado ${value}${locked ? ' (bloqueado)' : ''}` : 'Dado'}
    >
      <svg
        key={animKey}              /* reinicia la animación en cada tirada */
        viewBox="0 0 60 60"
        width={size}
        height={size}
        className={rolling && !locked ? 'die-rolling' : ''}
        style={{
          filter: locked
            ? 'drop-shadow(0 0 6px #f59e0b88)'
            : 'none',
          transition: 'filter 0.2s',
          display: 'block',
        }}
      >
        <rect x="3" y="3" width="54" height="54" rx="10"
          fill={bgColor} stroke={borderColor} strokeWidth="3" />

        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill={pipColor} />
        ))}

        {!value && (
          <text x="30" y="38" textAnchor="middle" fontSize="24"
            fill="#475569" fontWeight="bold">?</text>
        )}
      </svg>

      {/* Indicador de bloqueado */}
      {locked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center"
          style={{ fontSize: 9, color: '#000' }}>
          🔒
        </div>
      )}
    </button>
  )
}
