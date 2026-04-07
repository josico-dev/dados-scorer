// ─── Hook de estado del juego — compartido por ambos modos ────────────────

import { useState, useRef, useEffect } from 'react'

const KEY = 'dados-scorer-v4'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!Array.isArray(d?.players) || !d?.scores) return null
    return d
  } catch { try { localStorage.removeItem(KEY) } catch {}; return null }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

export function useGameState(defaultPlayers) {
  const saved = load()
  const [players,       setPlayers]       = useState(saved?.players ?? defaultPlayers)
  const [scores,        setScores]        = useState(saved?.scores ?? {})
  const [currentPlayer, setCurrentPlayer] = useState(saved?.currentPlayer ?? 0)
  const [turn,          setTurn]          = useState(saved?.turn ?? 0)
  const [extra,         setExtra]         = useState(saved?.extra ?? {})

  const stateRef = useRef({})
  stateRef.current = { players, scores, currentPlayer, turn, extra }

  useEffect(() => { save({ players, scores, currentPlayer, turn, extra }) }, [players, scores, currentPlayer, turn, extra])

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
