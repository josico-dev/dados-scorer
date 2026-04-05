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

export default function DiceRoller() {
  const [dice,    setDice]    = useState(Array(NUM_DICE).fill(0))
  const [locked,  setLocked]  = useState(Array(NUM_DICE).fill(false))
  const [rolling, setRolling] = useState(false)

  function handleRoll() {
    if (rolling) return
    setRolling(true)
    setTimeout(() => {
      setDice(prev => rollDice(prev, locked))
      setRolling(false)
    }, 280)
  }

  function toggleLock(i) {
    // Solo se puede bloquear si ya se ha lanzado al menos una vez
    if (dice[0] === 0) return
    setLocked(prev => prev.map((l, idx) => idx === i ? !l : l))
  }

  function handleReset() {
    setDice(Array(NUM_DICE).fill(0))
    setLocked(Array(NUM_DICE).fill(false))
  }

  return (
    <div className="mx-3 mb-4 rounded-2xl border border-white/10 bg-slate-800/60 p-3 flex flex-col gap-3">
      {/* Dados */}
      <div className="flex justify-center gap-2">
        {dice.map((val, i) => (
          <Die
            key={i}
            value={val}
            locked={locked[i]}
            rolling={rolling}
            onClick={() => toggleLock(i)}
          />
        ))}
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={handleRoll}
          disabled={rolling}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black transition disabled:opacity-50"
        >
          🎲 Lanzar
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white/70 transition"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
