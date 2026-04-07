// ─── Hook compartido de estado de juego ───────────────────────────────────
//
// Gestiona: jugadores, puntuaciones, turno actual.
// Ambos modos (Dados y DiceParty) usan este hook; el schema de scores
// varía por modo (lo inicializa el modo correspondiente).

import { useState, useCallback, useRef } from 'react'
import { DEFAULT_PLAYERS, ROWS, SUBTYPES } from '../config'

// ── Helpers de scores vacíos ──────────────────────────────────────────────

export function emptyDadosScores(players) {
  const scores = {}
  players.forEach((_, i) => {
    scores[i] = {}
    ROWS.forEach(row => {
      scores[i][row.id] = {}
      SUBTYPES.forEach(sub => {
        scores[i][row.id][sub.id] = ''
      })
    })
  })
  return scores
}

export function emptyPartyScores(players) {
  // Importamos ALL_COMBOS dinámicamente para no crear dependencia circular
  // Se pasa como parámetro en lugar de importar
  return players.map(() => ({}))
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useGameState() {
  const saved = loadState()

  const [players, setPlayers]           = useState(saved?.players ?? DEFAULT_PLAYERS)
  const [scores, setScores]             = useState(saved?.scores  ?? emptyDadosScores(saved?.players ?? DEFAULT_PLAYERS))
  const [currentPlayer, setCurrentPlayer] = useState(saved?.currentPlayer ?? 0)

  // Ref para acceso sin stale en callbacks
  const stateRef = useRef({ players, scores, currentPlayer })
  stateRef.current = { players, scores, currentPlayer }

  // Persistir en cada cambio
  const persist = useCallback((p, s, cp) => {
    saveState(p, s, cp)
  }, [])

  const updatePlayers = useCallback((newPlayers, newScores) => {
    setPlayers(newPlayers)
    setScores(newScores)
    persist(newPlayers, newScores, 0)
  }, [persist])

  const updateScore = useCallback((pi, rowId, subId, value) => {
    setScores(prev => {
      const next = {
        ...prev,
        [pi]: { ...prev[pi], [rowId]: { ...prev[pi]?.[rowId], [subId]: value } },
      }
      persist(stateRef.current.players, next, stateRef.current.currentPlayer)
      return next
    })
  }, [persist])

  const replaceScores = useCallback((newScores) => {
    setScores(newScores)
    persist(stateRef.current.players, newScores, stateRef.current.currentPlayer)
  }, [persist])

  const advanceTurn = useCallback(() => {
    setCurrentPlayer(prev => {
      const next = (prev + 1) % stateRef.current.players.length
      persist(stateRef.current.players, stateRef.current.scores, next)
      return next
    })
  }, [persist])

  const resetScores = useCallback((emptyFn) => {
    const empty = emptyFn ? emptyFn(stateRef.current.players) : emptyDadosScores(stateRef.current.players)
    setScores(empty)
    setCurrentPlayer(0)
    persist(stateRef.current.players, empty, 0)
  }, [persist])

  // Sobrescribir estado completo (usado por online)
  const applyRemoteState = useCallback((state) => {
    if (Array.isArray(state.players))     setPlayers(state.players)
    if (state.scores != null)             setScores(state.scores)
    if (state.currentPlayer != null)      setCurrentPlayer(state.currentPlayer)
  }, [])

  return {
    players, scores, currentPlayer,
    stateRef,
    updatePlayers,
    updateScore,
    replaceScores,
    advanceTurn,
    resetScores,
    applyRemoteState,
    setCurrentPlayer,
  }
}
