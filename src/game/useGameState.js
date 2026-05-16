// ─── Hook de estado del juego — compartido por ambos modos ────────────────
//
// El estado se persiste con una clave por modo, de modo que el formato de
// `scores` guardado siempre coincide con el modo cargado en memoria. El modo
// se pasa como parámetro al hook.

import { useState, useRef, useEffect } from 'react'

const KEY_PREFIX = 'dados-scorer-v5'
const keyFor = mode => `${KEY_PREFIX}-${mode}`

function load(mode) {
  try {
    const raw = localStorage.getItem(keyFor(mode))
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!Array.isArray(d?.players) || d?.scores == null) return null
    return d
  } catch {
    try { localStorage.removeItem(keyFor(mode)) } catch { /* storage no disponible */ }
    return null
  }
}

function save(mode, state) {
  try { localStorage.setItem(keyFor(mode), JSON.stringify(state)) } catch { /* storage no disponible o lleno */ }
}

export function useGameState(defaultPlayers, mode) {
  // Estado inicial leído del slot del modo activo (o defaults si no hay nada).
  // useState con initializer lazy: solo se evalúa en el primer render.
  const [players,       setPlayers]       = useState(() => load(mode)?.players       ?? defaultPlayers)
  const [scores,        setScores]        = useState(() => load(mode)?.scores        ?? {})
  const [currentPlayer, setCurrentPlayer] = useState(() => load(mode)?.currentPlayer ?? 0)
  const [turn,          setTurn]          = useState(() => load(mode)?.turn          ?? 0)
  const [extra,         setExtra]         = useState(() => load(mode)?.extra         ?? {})

  // Ref con el último snapshot — actualizada vía useEffect (no durante render)
  const stateRef = useRef({ players, scores, currentPlayer, turn, extra, mode })
  useEffect(() => {
    stateRef.current = { players, scores, currentPlayer, turn, extra, mode }
  }, [players, scores, currentPlayer, turn, extra, mode])

  // Persistir bajo la clave del modo activo. App es responsable de mantener
  // `scores` en formato coherente con `mode` (reiniciándolos al cambiar).
  useEffect(() => {
    save(mode, { players, scores, currentPlayer, turn, extra })
  }, [mode, players, scores, currentPlayer, turn, extra])

  function updateScore(pi, key, subKey, value) {
    setScores(prev => ({
      ...prev,
      [pi]: subKey != null
        ? { ...prev[pi], [key]: { ...(prev[pi]?.[key] ?? {}), [subKey]: value } }
        : { ...prev[pi], [key]: value },
    }))
  }

  function advanceTurn() {
    setCurrentPlayer(prev => (prev + 1) % stateRef.current.players.length)
    setTurn(prev => prev + 1)
  }

  function resetGame(newPlayers, newScores, newExtra) {
    setPlayers(newPlayers ?? stateRef.current.players)
    setScores(newScores ?? {})
    setCurrentPlayer(0)
    setTurn(0)
    setExtra(newExtra ?? {})
  }

  return {
    players, setPlayers,
    scores, setScores, updateScore,
    currentPlayer, setCurrentPlayer,
    turn, setTurn,
    extra, setExtra,
    advanceTurn, resetGame,
    stateRef,
  }
}
