// ─── Lanzador de dados para el modo normal ────────────────────────────────
// Los dados muestran las caras propias del juego: V(1), VI(2), J(3), Q(4), K(5), AS(6)

import { useState, useEffect } from 'react'
import { FACE_COLORS } from '../diceParty/Die'

const NUM_DICE  = 5
const MAX_ROLLS = 3

// Caras con letra (J, Q, K) y cara con punto grande (AS=6)
// V(1) y VI(2) usan pips como un dado real
const FACE_AS_DOT  = 6  // punto central grande
const FACE_LABELS  = { 3: 'J', 4: 'Q', 5: 'K' }

// Posiciones de pips para V(1)=5pips y VI(2)=6pips
const NORMAL_PIPS = {
  1: [[30,18],[18,30],[30,30],[42,30],[30,42]],           // V → 5 puntos
  2: [[18,13],[42,13],[18,30],[42,30],[18,47],[42,47]],   // VI → 6 puntos
}

function rollDice(dice, locked) {
  return dice.map((d, i) => locked[i] ? d : Math.ceil(Math.random() * 6))
}

// Dado SVG con etiqueta del modo normal
function NormalDie({ value, locked, rolling, onClick }) {
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (rolling && !locked) setAnimKey(k => k + 1)
  }, [rolling, locked])

  const colors = locked
    ? { bg: '#1e293b', border: '#ffffff', pip: '#ffffff', glow: '#ffffff99' }
    : (FACE_COLORS[value] ?? FACE_COLORS[0])

  const size = 58

  return (
    <button
      onClick={onClick}
      className="relative touch-manipulation select-none focus:outline-none"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <svg
        key={animKey}
        viewBox="0 0 60 60"
        width={size}
        height={size}
        className={rolling && !locked ? 'die-spinning' : ''}
        style={{
          display: 'block',
          filter: `drop-shadow(0 0 ${locked ? 8 : 5}px ${colors.glow ?? colors.border + '88'})`,
          transition: 'filter 0.2s',
        }}
      >
        <defs>
          <linearGradient id={`ng-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="54" height="54" rx="12"
          fill={colors.bg} stroke={colors.border} strokeWidth="3.5" />
        <rect x="3" y="3" width="54" height="54" rx="12"
          fill={`url(#ng-${value})`} />

        {value === FACE_AS_DOT ? (
          // AS → punto central grande
          <circle cx="30" cy="30" r="10" fill={colors.pip ?? colors.border} />
        ) : NORMAL_PIPS[value] ? (
          // V (1→5 pips) y VI (2→6 pips) → puntitos como dado real
          NORMAL_PIPS[value].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill={colors.pip ?? colors.border} />
          ))
        ) : value >= 3 ? (
          // J, Q, K → letra
          <text x="30" y="36" textAnchor="middle" fontSize="20"
            fill={colors.pip ?? colors.border} fontWeight="900" fontFamily="system-ui, sans-serif">
            {FACE_LABELS[value]}
          </text>
        ) : (
          // Sin lanzar → ?
          <text x="30" y="38" textAnchor="middle" fontSize="22"
            fill={colors.border} fontWeight="bold" opacity="0.4">?</text>
        )}
      </svg>

      {locked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow"
          style={{ fontSize: 8, color: '#000' }}>🔒</div>
      )}
    </button>
  )
}

export default function DiceRoller({ theme, isDark }) {
  const [dice,      setDice]      = useState(Array(NUM_DICE).fill(0))
  const [locked,    setLocked]    = useState(Array(NUM_DICE).fill(false))
  const [rolling,   setRolling]   = useState(false)
  const [rollCount, setRollCount] = useState(0)

  const hasRolled = rollCount > 0
  const rollsLeft = MAX_ROLLS - rollCount
  const t = theme ?? {}

  function handleRoll() {
    if (rolling || rollsLeft <= 0) return
    setRolling(true)
    setTimeout(() => {
      setDice(prev => rollDice(prev, locked))
      setRollCount(prev => prev + 1)
      setRolling(false)
    }, 280)
  }

  function toggleLock(i) {
    if (!hasRolled) return
    setLocked(prev => prev.map((l, idx) => idx === i ? !l : l))
  }

  function handleReset() {
    setDice(Array(NUM_DICE).fill(0))
    setLocked(Array(NUM_DICE).fill(false))
    setRollCount(0)
  }

  return (
    <div className="mx-3 mb-3 rounded-2xl p-3 flex flex-col gap-2"
      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>

      {/* Dados con caras del modo normal */}
      <div className="flex justify-center gap-2">
        {dice.map((val, i) => (
          <NormalDie key={i} value={val} locked={locked[i]} rolling={rolling} onClick={() => toggleLock(i)} />
        ))}
      </div>

      {/* Botones + contador */}
      <div className="flex gap-2 items-center">
        <button onClick={handleRoll} disabled={rolling || rollsLeft <= 0}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#000' }}>
          🎲 Lanzar
        </button>

        {/* Contador */}
        <div className="flex gap-1">
          {[1, 2, 3].map(n => (
            <div key={n}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
              style={{
                background: rollCount >= n ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                color: rollCount >= n ? '#000' : (t.textMuted ?? 'rgba(255,255,255,0.3)'),
              }}>
              {n}
            </div>
          ))}
        </div>

        <button onClick={handleReset}
          className="px-3 py-2.5 rounded-xl font-bold text-sm transition"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: t.textMuted ?? 'rgba(255,255,255,0.6)' }}>
          ✕
        </button>
      </div>
    </div>
  )
}
