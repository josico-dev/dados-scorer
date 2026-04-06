// ─── App principal ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { DEFAULT_PLAYERS, ROWS } from './config'
import { loadState, saveState } from './storage'
import { emptyScores } from './helpers'
import { THEMES, loadTheme, saveTheme } from './theme'
import DadosMode from './modes/DadosMode'
import DicePartyMode from './modes/DicePartyMode'
import DiceRoller from './components/DiceRoller'
import { useMultiplayer } from './multiplayer/useMultiplayer'
import MultiplayerModal from './multiplayer/MultiplayerModal'

const MODE_KEY = 'dados-scorer-mode'
const loadMode = () => { try { return localStorage.getItem(MODE_KEY) || 'dados' } catch { return 'dados' } }
const saveMode = m => { try { localStorage.setItem(MODE_KEY, m) } catch {} }

export default function App() {
  const [mode,      setMode]      = useState(() => loadMode())
  const [themeName, setThemeName] = useState(() => loadTheme())

  const theme = THEMES[themeName] ?? THEMES.dark
  const isDark = themeName === 'dark'

  // ── Estado modo Dados ────────────────────────────────────────────────────
  const saved = loadState()
  const [players, setPlayers] = useState(saved?.players ?? DEFAULT_PLAYERS)
  const [scores,  setScores]  = useState(saved?.scores  ?? emptyScores(DEFAULT_PLAYERS))
  const [showMultiplayer, setShowMultiplayer] = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showResetModal,   setShowResetModal]   = useState(false)
  const [showDiceRoller,   setShowDiceRoller]   = useState(false)
  // Estado de los dados compartido con el tablero
  const [rollerDice,      setRollerDice]      = useState(Array(5).fill(0))
  const [rollerHasRolled, setRollerHasRolled] = useState(false)
  const [currentPlayer,   setCurrentPlayer]   = useState(0)
  const [rollerReset,     setRollerReset]     = useState(0)
  const [diceSelected,    setDiceSelected]    = useState(null)

  // ── Multiplayer ──────────────────────────────────────────────────────────
  const mp = useMultiplayer({
    onRemoteState: (state) => {
      // Recibe estado del otro jugador y lo aplica
      if (state.players)       setPlayers(state.players)
      if (state.scores)        setScores(state.scores)
      if (state.currentPlayer !== undefined) setCurrentPlayer(state.currentPlayer)
      if (state.mode)          setMode(state.mode)
    },
  })

  // Cuando el host cambia el estado, lo emite al guest
  useEffect(() => {
    if (mp.isConnected && mp.isHost) {
      mp.sendState({ players, scores, currentPlayer, mode })
    }
  }, [players, scores, currentPlayer])

  useEffect(() => { saveState(players, scores) }, [players, scores])
  useEffect(() => { saveMode(mode) }, [mode])
  useEffect(() => {
    saveTheme(themeName)
    document.body.style.background = theme.bodyBg
  }, [themeName, theme.bodyBg])

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

  function toggleTheme() {
    setThemeName(t => t === 'dark' ? 'light' : 'dark')
  }

  // ── Componentes de header compartidos ────────────────────────────────────

  function ModeToggle() {
    return (
      <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        {[
          { id: 'dados',      label: '🃏 Dados'      },
          { id: 'dice-party', label: '🎲 Dice Party' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="px-3 py-1 rounded-lg text-xs font-black transition-all"
            style={mode === m.id
              ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }
              : { color: theme.textMuted }}>
            {m.label}
          </button>
        ))}
      </div>
    )
  }

  function HeaderButtons({ extra }) {
    return (
      <div className="flex gap-1.5 items-center">
        {extra}
        {/* Toggle tema */}
        <button onClick={toggleTheme}
          className="px-2.5 py-1.5 rounded-lg text-sm transition"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: theme.text }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    )
  }

  // ── Modo Dice Party ───────────────────────────────────────────────────────
  if (mode === 'dice-party') {
    return (
      <>
        <DicePartyMode
          theme={theme}
          isDark={isDark}
          modeToggle={<ModeToggle />}
          onToggleTheme={toggleTheme}
          mp={mp}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
        />
        {showMultiplayer && (
          <MultiplayerModal mp={mp} isDark={isDark} onClose={() => setShowMultiplayer(false)} />
        )}
      </>
    )
  }

  // ── Modo Dados ────────────────────────────────────────────────────────────
  return (
    <div className="app-shell select-none" style={{ background: theme.appBg, color: theme.text }}>
      <header className="shrink-0 backdrop-blur border-b px-3 pt-2 pb-2 flex flex-col gap-2"
        style={{ background: theme.headerBg, borderColor: theme.borderSubtle }}>

        {/* Fila 1: logo a la izq, toggle centrado */}
        <div className="flex items-center">
          <span className="text-xl w-8">🎲</span>
          <div className="flex-1 flex justify-center">
            <ModeToggle />
          </div>
          <div className="w-8" /> {/* espacio para equilibrar el logo */}
        </div>

        {/* Fila 2: acciones distribuidas uniformemente */}
        <div className="flex items-center justify-between gap-1">
          {[
            { label: '🎲', title: 'Dados', active: showDiceRoller, onClick: () => setShowDiceRoller(v => !v), activeColor: '#f59e0b' },
            { label: mp.isConnected ? '🌐 ●' : '🌐', title: 'Online', active: mp.isConnected, onClick: () => setShowMultiplayer(true), activeColor: '#22c55e' },
            { label: '👥', title: 'Jugadores', active: false, onClick: () => setShowPlayersModal(true) },
            { label: '🔄', title: 'Reset',     active: false, onClick: () => setShowResetModal(true),   danger: true },
            { label: isDark ? '☀️' : '🌙', title: 'Tema', active: false, onClick: toggleTheme },
          ].map(btn => (
            <button key={btn.title} onClick={btn.onClick}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition flex flex-col items-center gap-0.5"
              style={{
                background: btn.active
                  ? `rgba(${btn.activeColor === '#f59e0b' ? '245,158,11' : '34,197,94'},0.2)`
                  : btn.danger ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                color: btn.active ? btn.activeColor : btn.danger ? '#f87171' : theme.textMuted,
              }}>
              <span className="text-sm leading-none">{btn.label}</span>
              <span className="text-[9px] leading-none">{btn.title}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col">
        <DadosMode
          theme={theme}
          isDark={isDark}
          players={players}
          scores={scores}
          showPlayersModal={showPlayersModal}
          showResetModal={showResetModal}
          onUpdateScore={updateScore}
          onClosePlayers={() => setShowPlayersModal(false)}
          onCloseReset={() => setShowResetModal(false)}
          onSavePlayers={savePlayers}
          onResetScores={resetScores}
          diceActive={showDiceRoller && rollerHasRolled}
          rollerDice={rollerDice}
          currentPlayer={currentPlayer}
          onSelectionChange={setDiceSelected}
          onPlay={(pi, rowId, subId, value) => {
            updateScore(pi, rowId, subId, String(value))
            setCurrentPlayer(prev => (prev + 1) % players.length)
            setRollerReset(r => r + 1)
            setDiceSelected(null)
          }}
        />
        {showMultiplayer && (
        <MultiplayerModal
          mp={mp}
          isDark={isDark}
          onClose={() => setShowMultiplayer(false)}
        />
      )}

      {showDiceRoller && (
          <div className="shrink-0 safe-bottom">
            <DiceRoller
              theme={theme}
              isDark={isDark}
              resetKey={rollerReset}
              canPlay={!!diceSelected}
              onDiceChange={(dice, hasRolled) => {
                setRollerDice(dice)
                setRollerHasRolled(hasRolled)
              }}
              onPlay={() => {
                if (!diceSelected) return
                updateScore(diceSelected.pi, diceSelected.rowId, diceSelected.subId, String(diceSelected.value))
                setCurrentPlayer(prev => (prev + 1) % players.length)
                setRollerReset(r => r + 1)
                setDiceSelected(null)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
