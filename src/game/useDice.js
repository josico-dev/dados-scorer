// ─── Hook de dados ────────────────────────────────────────────────────────
//
// Estado de los 5 dados: valores, bloqueos, tiradas restantes.
// Independiente del modo de juego.

import { useState, useCallback, useRef, useEffect } from 'react'

const NUM_DICE  = 5
const MAX_ROLLS = 3

function rollDice(dice, locked) {
  return dice.map((d, i) => locked[i] ? d : Math.ceil(Math.random() * 6))
}

export function useDice({ onRollChange } = {}) {
  const [dice,      setDice]      = useState(Array(NUM_DICE).fill(0))
  const [locked,    setLocked]    = useState(Array(NUM_DICE).fill(false))
  const [rolling,   setRolling]   = useState(false)
  const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS)

  const rollCount = MAX_ROLLS - rollsLeft
  const hasRolled = rollCount > 0

  const onRollChangeRef = useRef(onRollChange)
  useEffect(() => { onRollChangeRef.current = onRollChange }, [onRollChange])

  const roll = useCallback(() => {
    if (rolling || rollsLeft <= 0) return
    setRolling(true)
    setTimeout(() => {
      setDice(prev => {
        const newDice = rollDice(prev, locked)
        setRollsLeft(r => {
          const newLeft = r - 1
          onRollChangeRef.current?.(newDice, locked, newLeft)
          return newLeft
        })
        return newDice
      })
      setRolling(false)
    }, 280)
  }, [rolling, rollsLeft, locked])

  const toggleLock = useCallback((i) => {
    if (rollsLeft >= MAX_ROLLS) return  // no ha tirado aún
    setLocked(prev => prev.map((l, idx) => idx === i ? !l : l))
  }, [rollsLeft])

  const reset = useCallback(() => {
    setDice(Array(NUM_DICE).fill(0))
    setLocked(Array(NUM_DICE).fill(false))
    setRollsLeft(MAX_ROLLS)
  }, [])

  // Aplicar estado remoto (modo online: espectador ve los dados del jugador activo)
  const applyRemote = useCallback(({ dice: d, locked: l, rollsLeft: r }) => {
    if (d)    setDice(d)
    if (l)    setLocked(l)
    if (r != null) setRollsLeft(r)
  }, [])

  return {
    dice,
    locked,
    rolling,
    rollsLeft,
    rollCount,
    hasRolled,
    maxRolls: MAX_ROLLS,
    roll,
    toggleLock,
    reset,
    applyRemote,
    setDice,
    setLocked,
  }
}
