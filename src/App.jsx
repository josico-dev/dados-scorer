// ─── App principal ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

import { DEFAULT_PLAYERS, ROWS, SUBTYPES } from './config'
import { loadState, saveState } from './storage'
import { emptyScores } from './helpers'
import DadosMode from './modes/DadosMode'
import DicePartyMode from './modes/DicePartyMode'
import DiceRoller from './components/DiceRoller'
import PlayersModal from './PlayersModal'
import ResetModal from './ResetModal'

const MODE_KEY = 'dados-scorer-mode'
const loadMode = () => { try { return localStorage.getItem(MODE_KEY) || 'dados' } catch { return 'dados' } }
const saveMode = m => { try { localStorage.setItem(MODE_KEY, m) } catch {} }

export default function App() {
  const [mode, setMode] = useState(() => loadMode())

  // ── Estado modo Dados ────────────────────────────────────────────────────
  const saved = loadState()
  const [players, setPlayers] = useState(saved?.players ?? DEFAULT_PLAYERS)
  const [scores,  setScores]  = useState(saved?.scores  ?? emptyScores(DEFAULT_PLAYERS))
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showResetModal,   setShowResetModal]   = useState(false)
  const [showDiceRoller,   setShowDiceRoller]   = useState(false)

  useEffect(() => { saveState(players, scores) }, [players, scores])
  useEffect(() => { saveMode(mode) }, [mode])

  function updateScore(pi, rowId, sub, val) {
    setScores(prev => ({
      ...prev,
      [pi]: { ...prev[pi], [rowId]: { ...prev[pi][rowId], [sub]: val } },
    }))
  }

  function savePlayers(names) {
    setPlayers(names)
    setScores(prev => {
      const next = emptyScores(names)
      names.forEach((_, i) => {
        if (prev[i]) ROWS.forEach(r => { next[i][r.id] = prev[i][r.id] ?? {} })
      })
      return next
    })
    setShowPlayersModal(false)
  }

  function resetScores() {
    setScores(emptyScores(players))
    setShowResetModal(false)
  }

  // ── Tab toggle de modo ───────────────────────────────────────────────────

  function ModeToggle() {
    return (
      <div className="flex bg-white/10 rounded-lg p-0.5 gap-0.5">
        {[
          { id: 'dados',      label: '🃏 Dados' },
          { id: 'dice-party', label: '🎲 Dice Party' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              mode === m.id
                ? 'bg-amber-500 text-black shadow'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    )
  }

  // ── Modo Dice Party ───────────────────────────────────────────────────────
  if (mode === 'dice-party') {
    return <DicePartyMode modeToggle={<ModeToggle />} />
  }

  // ── Modo Dados ────────────────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white select-none flex flex-col">
      <header className="shrink-0 bg-slate-900/80 backdrop-blur border-b border-white/10 px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-xl">🎲</span>
        <ModeToggle />
        <div className="flex gap-1.5">
          <button onClick={() => setShowDiceRoller(v => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${showDiceRoller ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 hover:bg-white/20'}`}>
            🎲
          </button>
          <button onClick={() => setShowPlayersModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition">
            👥
          </button>
          <button onClick={() => setShowResetModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition">
            🔄
          </button>
        </div>
      </header>

      <DadosMode
        players={players}
        scores={scores}
        showPlayersModal={showPlayersModal}
        showResetModal={showResetModal}
        onUpdateScore={updateScore}
        onClosePlayers={() => setShowPlayersModal(false)}
        onCloseReset={() => setShowResetModal(false)}
        onSavePlayers={savePlayers}
        onResetScores={resetScores}
      />

      {/* Lanzador de dados — fijo al final, debajo de la tabla */}
      {showDiceRoller && <div className="shrink-0"><DiceRoller /></div>}
    </div>
  )
}
