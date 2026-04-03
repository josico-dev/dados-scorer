// ─── App principal ─────────────────────────────────────────────────────────
//
// Gestiona el estado global (jugadores y puntuaciones) y renderiza la tabla.
// El estado se guarda automáticamente en localStorage para no perder datos.

import { useState, useEffect } from 'react'

import { DEFAULT_PLAYERS, ROWS, SUBTYPES } from './config'
import { loadState, saveState } from './storage'
import { emptyScores, playerTotal } from './helpers'
import { DICE_ICONS } from './DiceIcons'
import ScoreCell from './ScoreCell'
import PlayersModal from './PlayersModal'
import ResetModal from './ResetModal'

export default function App() {
  // Cargamos el estado guardado al iniciar, o usamos los valores por defecto
  const saved = loadState()
  const [players, setPlayers] = useState(saved?.players ?? DEFAULT_PLAYERS)
  const [scores, setScores]   = useState(saved?.scores  ?? emptyScores(DEFAULT_PLAYERS))

  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showResetModal, setShowResetModal]     = useState(false)

  // Guardamos en localStorage cada vez que cambia algo
  useEffect(() => {
    saveState(players, scores)
  }, [players, scores])

  // Actualiza la puntuación de una celda concreta
  function updateScore(playerIndex, rowId, subtype, value) {
    setScores(prev => ({
      ...prev,
      [playerIndex]: {
        ...prev[playerIndex],
        [rowId]: {
          ...prev[playerIndex][rowId],
          [subtype]: value,
        },
      },
    }))
  }

  // Guarda los nuevos jugadores preservando las puntuaciones existentes
  function savePlayers(newNames) {
    setPlayers(newNames)
    setScores(prev => {
      const next = emptyScores(newNames)
      newNames.forEach((_, i) => {
        if (prev[i]) {
          ROWS.forEach(row => {
            next[i][row.id] = prev[i][row.id] ?? {}
          })
        }
      })
      return next
    })
    setShowPlayersModal(false)
  }

  // Borra todas las puntuaciones (los jugadores se mantienen)
  function resetScores() {
    setScores(emptyScores(players))
    setShowResetModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white select-none">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <h1 className="text-base font-bold tracking-wide text-amber-300">Dados Scorer</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPlayersModal(true)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition"
          >
            👥 Jugadores
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition"
          >
            🔄 Reset
          </button>
        </div>
      </header>

      {/* ── Tabla de puntuaciones ── */}
      <div className="overflow-x-auto pb-6">
        <table
          className="border-separate border-spacing-0 w-full"
          style={{ minWidth: `${Math.max(320, 80 + players.length * 120)}px` }}
        >
          <thead>
            {/* Fila con nombres de jugadores */}
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 w-12 min-w-[48px]" />
              {players.map((name, i) => (
                <th key={i} colSpan={2} className="text-center px-1 pt-3 pb-1">
                  <span className="block text-sm font-bold text-amber-300 uppercase tracking-wider truncate max-w-[120px] mx-auto">
                    {name}
                  </span>
                </th>
              ))}
            </tr>

            {/* Fila con Opcional / Obligado por cada jugador */}
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 text-center px-2 py-1 text-[10px] text-white/40 font-medium uppercase w-12 min-w-[48px]">
                Cara
              </th>
              {players.map((_, pi) =>
                SUBTYPES.map(sub => (
                  <th
                    key={`${pi}-${sub.id}`}
                    className={`text-center px-1 pb-2 text-xs font-bold uppercase tracking-wider w-16 min-w-[56px] ${sub.id === 'Opc' ? 'text-sky-400' : 'text-emerald-400'}`}
                  >
                    {sub.label}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {/* Una fila por cada cara del dado */}
            {ROWS.map((row, rowIndex) => (
              <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}>

                {/* Icono de la cara del dado */}
                <td className={`sticky left-0 z-10 px-2 py-2 whitespace-nowrap ${rowIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'}`}>
                  <div className="flex flex-col items-center gap-0.5">
                    {DICE_ICONS[row.id]}
                    <span className="text-[10px] text-white/40 font-medium">({row.value})</span>
                  </div>
                </td>

                {/* Celdas de puntuación: Opcional y Obligado por cada jugador */}
                {players.map((_, pi) =>
                  SUBTYPES.map(sub => (
                    <td key={`${pi}-${sub.id}`} className="px-1 py-1.5">
                      <ScoreCell
                        value={scores[pi]?.[row.id]?.[sub.id] ?? ''}
                        faceValue={row.value}
                        onChange={val => updateScore(pi, row.id, sub.id, val)}
                      />
                    </td>
                  ))
                )}
              </tr>
            ))}

            {/* Fila de totales */}
            <tr className="border-t-2 border-amber-400/40">
              <td className="sticky left-0 z-10 bg-slate-800 px-2 py-3 text-center">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Total</span>
              </td>
              {players.map((_, pi) => {
                const total = playerTotal(scores, pi)
                return (
                  <td key={pi} colSpan={2} className="text-center px-1 py-3 bg-slate-800">
                    <span className={`text-xl font-black tabular-nums ${total > 0 ? 'text-amber-300' : 'text-white/40'}`}>
                      {total || '—'}
                    </span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Modales ── */}
      {showPlayersModal && (
        <PlayersModal
          players={players}
          onSave={savePlayers}
          onClose={() => setShowPlayersModal(false)}
        />
      )}

      {showResetModal && (
        <ResetModal
          onConfirm={resetScores}
          onClose={() => setShowResetModal(false)}
        />
      )}
    </div>
  )
}
