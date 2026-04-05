// ─── Lanzador de dados para el modo normal ────────────────────────────────
//
// Panel opcional con 5 dados que se pueden lanzar y bloquear.
// El usuario puede mostrarlo u ocultarlo con un botón en el header.

import { useState } from 'react'
import Die from '../diceParty/Die'

const NUM_DICE = 5

function rollDice(dice, locked) {
  return dice.map((d, i) => locked[i] ? d : Math.ceil(Math.random() * 6))
}

const MAX_ROLLS = 3

export default function DiceRoller() {
  const [dice,      setDice]      = useState(Array(NUM_DICE).fill(0))
  const [locked,    setLocked]    = useState(Array(NUM_DICE).fill(false))
  const [rolling,   setRolling]   = useState(false)
  const [rollCount, setRollCount] = useState(0) // 0 = sin lanzar

  const hasRolled = rollCount > 0
  const rollsLeft = MAX_ROLLS - rollCount

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
    <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-slate-800/60 p-3 flex flex-col gap-2">
      {/* Dados */}
      <div className="flex justify-center gap-2">
        {dice.map((val, i) => (
          <Die key={i} value={val} locked={locked[i]} rolling={rolling} onClick={() => toggleLock(i)} />
        ))}
      </div>

      {/* Botones + contador */}
      <div className="flex gap-2 items-center">
        <button
          onClick={handleRoll}
          disabled={rolling || rollsLeft <= 0}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black transition disabled:opacity-40"
        >
          🎲 Lanzar
        </button>

        {/* Contador de tiradas */}
        <div className="flex gap-1">
          {[1, 2, 3].map(n => (
            <div key={n} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
              rollCount >= n
                ? 'bg-amber-500 text-black'
                : 'bg-white/10 text-white/30'
            }`}>
              {n}
            </div>
          ))}
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white/70 transition"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
