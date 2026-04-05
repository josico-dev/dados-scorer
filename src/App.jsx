// ─── App principal ─────────────────────────────────────────────────────────
//
// Gestiona la selección de modo de juego (Dados o Dice Party).
// El modo activo se guarda en localStorage para persistir entre sesiones.

import { useState, useEffect } from 'react'

import { DEFAULT_PLAYERS, ROWS } from './config'
import { loadState, saveState } from './storage'
import { emptyScores } from './helpers'
import DadosMode from './modes/DadosMode'
import DicePartyMode from './modes/DicePartyMode'

// Clave para guardar el modo activo
const MODE_KEY = 'dados-scorer-mode'

function loadMode() {
  try { return localStorage.getItem(MODE_KEY) || null } catch { return null }
}
function saveMode(mode) {
  try { localStorage.setItem(MODE_KEY, mode) } catch {}
}

export default function App() {
  // Modo activo: null (pantalla selección), 'dados', o 'dice-party'
  const [mode, setMode] = useState(() => loadMode())

  // ── Estado del modo Dados ────────────────────────────────────────────────
  const saved = loadState()
  const [players, setPlayers] = useState(saved?.players ?? DEFAULT_PLAYERS)
  const [scores, setScores]   = useState(saved?.scores  ?? emptyScores(DEFAULT_PLAYERS))

  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showResetModal, setShowResetModal]     = useState(false)

  // Guardar estado Dados en localStorage
  useEffect(() => {
    saveState(players, scores)
  }, [players, scores])

  // Guardar modo activo
  useEffect(() => {
    if (mode) saveMode(mode)
  }, [mode])

  // ── Handlers Dados ───────────────────────────────────────────────────────

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

  function resetScores() {
    setScores(emptyScores(players))
    setShowResetModal(false)
  }

  // ── Pantalla de selección de modo ────────────────────────────────────────

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center justify-center p-6 gap-8">
        <div className="text-center">
          <div className="text-6xl mb-3">🎲</div>
          <h1 className="text-3xl font-black text-amber-300 tracking-wide">Dados Scorer</h1>
          <p className="text-white/40 text-sm mt-1">Elige un modo de juego</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {/* Modo Dados */}
          <button
            onClick={() => setMode('dados')}
            className="group relative overflow-hidden rounded-2xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 p-5 text-left transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🃏</span>
              <div>
                <h2 className="text-lg font-bold text-amber-300">Dados</h2>
                <p className="text-white/50 text-xs mt-0.5">Marcador manual de dados</p>
              </div>
            </div>
          </button>

          {/* Modo Dice Party */}
          <button
            onClick={() => setMode('dice-party')}
            className="group relative overflow-hidden rounded-2xl border border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 p-5 text-left transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎳</span>
              <div>
                <h2 className="text-lg font-bold text-sky-300">Dice Party</h2>
                <p className="text-white/50 text-xs mt-0.5">Estilo Yahtzee · 2 jugadores</p>
              </div>
            </div>
            <span className="absolute top-2 right-2 text-[10px] bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Nuevo
            </span>
          </button>
        </div>
      </div>
    )
  }

  // ── Modo Dice Party ───────────────────────────────────────────────────────

  if (mode === 'dice-party') {
    return <DicePartyMode onExit={() => setMode(null)} />
  }

  // ── Modo Dados ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white select-none">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Botón para volver a la selección de modo */}
          <button
            onClick={() => setMode(null)}
            className="text-white/40 hover:text-white/70 transition text-lg mr-1"
            aria-label="Volver"
          >
            ←
          </button>
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

      <DadosMode
        players={players}
        scores={scores}
        showPlayersModal={showPlayersModal}
        showResetModal={showResetModal}
        onUpdateScore={updateScore}
        onOpenPlayers={() => setShowPlayersModal(true)}
        onOpenReset={() => setShowResetModal(true)}
        onClosePlayers={() => setShowPlayersModal(false)}
        onCloseReset={() => setShowResetModal(false)}
        onSavePlayers={savePlayers}
        onResetScores={resetScores}
      />
    </div>
  )
}
