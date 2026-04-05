// ─── Lanzador de dados para el modo normal ────────────────────────────────
// Usa los mismos iconos SVG que el scoreboard (DICE_ICONS)

import { useState, useEffect, useRef } from 'react'
import { DICE_ICONS } from '../DiceIcons'

const NUM_DICE  = 5
const MAX_ROLLS = 3

// Mapeo valor (1-6) → id de cara del dado del modo normal
const VALUE_TO_ID = { 1: 'v', 2: 'vi', 3: 'j', 4: 'q', 5: 'k', 6: 'as' }

function rollDice(dice, locked) {
  return dice.map((d, i) => locked[i] ? d : Math.ceil(Math.random() * 6))
}

// Dado que muestra el icono del scoreboard, con animación y estado de bloqueo
function NormalDie({ value, locked, rolling, onClick }) {
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (rolling && !locked) setAnimKey(k => k + 1)
  }, [rolling, locked])

  const icon = value ? DICE_ICONS[VALUE_TO_ID[value]] : null

  return (
    <button
      onClick={onClick}
      className="relative touch-manipulation select-none focus:outline-none"
      style={{ width: 52, height: 52 }}
    >
      {/* Icono del scoreboard, escalado y animado */}
      <div
        key={animKey}
        className={rolling && !locked ? 'die-spinning' : ''}
        style={{
          width: 52, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: locked
            ? 'drop-shadow(0 0 8px #ffffff99) brightness(1.3) saturate(0)'
            : 'none',
          opacity: value ? 1 : 0.35,
          transition: 'filter 0.2s, opacity 0.2s',
          // Escala el SVG (que es w-9 h-9 = 36px) a 52px
          transform: 'scale(1.44)',
          transformOrigin: 'center',
        }}
      >
        {icon ?? (
          // Sin valor todavía: dado neutro con ?
          <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
            <rect x="2" y="2" width="44" height="44" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2.5"/>
            <text x="24" y="32" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">?</text>
          </svg>
        )}
      </div>

      {/* Indicador de bloqueado */}
      {locked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow"
          style={{ fontSize: 8, color: '#000', zIndex: 10 }}>🔒</div>
      )}
    </button>
  )
}

export default function DiceRoller({ theme, isDark, onDiceChange, resetKey }) {
  const [dice,      setDice]      = useState(Array(NUM_DICE).fill(0))
  const [locked,    setLocked]    = useState(Array(NUM_DICE).fill(false))
  const [rolling,   setRolling]   = useState(false)
  const [rollCount, setRollCount] = useState(0)

  const hasRolled = rollCount > 0
  const rollsLeft = MAX_ROLLS - rollCount
  const t = theme ?? {}

  // Notifica al padre cada vez que cambian los dados
  useEffect(() => {
    onDiceChange?.(dice, hasRolled)
  }, [dice, hasRolled])

  // Reset externo (cuando el padre confirma una jugada)
  useEffect(() => {
    if (resetKey === 0) return
    setDice(Array(NUM_DICE).fill(0))
    setLocked(Array(NUM_DICE).fill(false))
    setRollCount(0)
  }, [resetKey])

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
    const empty = Array(NUM_DICE).fill(0)
    setDice(empty)
    setLocked(Array(NUM_DICE).fill(false))
    setRollCount(0)
  }

  return (
    <div className="mx-3 mb-3 rounded-2xl p-3 flex flex-col gap-2"
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}>

      {/* Dados con los mismos iconos que el scoreboard */}
      <div className="flex justify-center gap-3 items-center" style={{ height: 58 }}>
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
