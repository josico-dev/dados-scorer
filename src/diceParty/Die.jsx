// ─── Componente SVG de un dado ─────────────────────────────────────────────
// Animación: parpadeo de caras aleatorias mientras rueda, luego muestra el valor final.

import { useState, useEffect, useRef } from 'react'

const PIP_POSITIONS = {
  1: [[30, 30]],
  2: [[18, 18], [42, 42]],
  3: [[18, 18], [30, 30], [42, 42]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 15], [42, 15], [18, 30], [42, 30], [18, 45], [42, 45]],
}

function randomFace() { return Math.ceil(Math.random() * 6) }

export default function Die({ value, locked, rolling, onClick, className = '', size = 64 }) {
  // displayValue: lo que se muestra (parpadea mientras anima, luego value)
  const [displayValue, setDisplayValue] = useState(value)
  const [shaking,      setShaking]      = useState(false)
  const intervalRef = useRef(null)
  const timeoutRef  = useRef(null)

  useEffect(() => {
    if (rolling && !locked) {
      setShaking(true)

      // Parpadea caras aleatorias cada 60ms durante 400ms
      intervalRef.current = setInterval(() => {
        setDisplayValue(randomFace())
      }, 60)

      // Al final muestra el valor real y para
      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current)
        setDisplayValue(value)
        setShaking(false)
      }, 420)
    } else {
      setDisplayValue(value)
    }

    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [rolling, value, locked])

  const pips        = displayValue >= 1 && displayValue <= 6 ? PIP_POSITIONS[displayValue] : []
  const borderColor = locked ? '#f59e0b' : shaking ? '#f59e0b66' : '#94a3b8'
  const bgColor     = locked ? '#1e1a0e' : shaking ? '#1a2535' : '#1e293b'
  const pipColor    = locked ? '#f59e0b' : shaking ? '#f8fafc' : '#e2e8f0'

  return (
    <button
      onClick={onClick}
      className={`relative touch-manipulation select-none focus:outline-none ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-label={value ? `Dado ${value}${locked ? ' (bloqueado)' : ''}` : 'Dado'}
    >
      <svg
        viewBox="0 0 60 60"
        width={size}
        height={size}
        style={{
          display: 'block',
          transition: shaking ? 'none' : 'filter 0.3s',
          filter: locked
            ? 'drop-shadow(0 0 8px #f59e0baa)'
            : shaking
              ? 'drop-shadow(0 0 10px #ffffff44) brightness(1.15)'
              : 'none',
          animation: shaking ? 'die-shake 0.08s infinite alternate' : 'none',
        }}
      >
        <rect x="3" y="3" width="54" height="54" rx="10"
          fill={bgColor} stroke={borderColor} strokeWidth={shaking ? 4 : 3}
          style={{ transition: shaking ? 'none' : 'all 0.2s' }}
        />
        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill={pipColor}
            style={{ transition: shaking ? 'none' : 'fill 0.2s' }}
          />
        ))}
        {!displayValue && (
          <text x="30" y="38" textAnchor="middle" fontSize="24"
            fill="#475569" fontWeight="bold">?</text>
        )}
      </svg>

      {locked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center"
          style={{ fontSize: 9, color: '#000' }}>
          🔒
        </div>
      )}
    </button>
  )
}
