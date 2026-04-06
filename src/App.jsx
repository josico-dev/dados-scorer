// ─── App principal ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
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

  const theme  = THEMES[themeName] ?? THEMES.dark
  const isDark = themeName === 'dark'

  // ── Estado modo Dados ────────────────────────────────────────────────────
  const saved = loadState()
  const [players, setPlayers] = useState(saved?.players ?? DEFAULT_PLAYERS)
  const [scores,  setScores]  = useState(saved?.scores  ?? emptyScores(DEFAULT_PLAYERS))
  const [showMultiplayer,  setShowMultiplayer]  = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showResetModal,   setShowResetModal]   = useState(false)
  const [showDiceRoller,   setShowDiceRoller]   = useState(false)
  const [rollerDice,       setRollerDice]       = useState(Array(5).fill(0))
  const [rollerHasRolled,  setRollerHasRolled]  = useState(false)
  const [currentPlayer,    setCurrentPlayer]    = useState(0)
  const [rollerReset,      setRollerReset]      = useState(0)
  const [diceSelected,     setDiceSelected]     = useState(null)
  const [myPlayerIndex,    setMyPlayerIndex]    = useState(0)
  // Dados remotos del oponente (para modo espectador en Dice Party)
  const [remoteDice,     setRemoteDice]     = useState(null)
  // Estado de Dice Party elevado a App para sincronización online
  const [dpGameState,    setDpGameState]    = useState(null)   // null = usa estado interno de DicePartyMode
  const dpStateRef = useRef(null)
  useEffect(() => { dpStateRef.current = dpGameState }, [dpGameState])

  // Refs para callbacks sin stale closure
  const playersRef = useRef(players)
  const scoresRef  = useRef(scores)
  const cpRef      = useRef(currentPlayer)
  useEffect(() => { playersRef.current = players },       [players])
  useEffect(() => { scoresRef.current  = scores },        [scores])
  useEffect(() => { cpRef.current      = currentPlayer }, [currentPlayer])

  // ── Multiplayer ──────────────────────────────────────────────────────────
  const mp = useMultiplayer({
    onRemoteAction: (action) => {
      // diceUpdate lo procesa cualquiera (espectador de dados)
      if (action.action === 'diceUpdate') {
        setRemoteDice({ dice: action.dice, locked: action.locked, rollsLeft: action.rollsLeft })
        return
      }
      // El resto solo lo procesa el host
      if (!mpRef.current.isHost) return

      if (action.action === 'requestState') {
        mpRef.current.sendState({
          players: playersRef.current,
          scores:  scoresRef.current,
          currentPlayer: cpRef.current,
          mode,
          assignedPlayerIndex: 1,
          dpGameState: dpStateRef.current,
        })
        return
      }
      if (action.action === 'dpStateUpdate') {
        // Guest envía su estado de Dice Party al host para sincronizar
        setDpGameState(action.state)
        return
      }
      if (action.action === 'updateScore') {
        setScores(prev => ({
          ...prev,
          [action.pi]: {
            ...prev[action.pi],
            [action.rowId]: { ...prev[action.pi]?.[action.rowId], [action.subId]: action.value },
          },
        }))
      }
      if (action.action === 'nextPlayer') {
        setCurrentPlayer(prev => (prev + 1) % playersRef.current.length)
        setRemoteDice(null)
      }
      if (action.action === 'reset') {
        setScores(emptyScores(playersRef.current))
      }
    },
    onRemoteState: (state) => {
      if (state.players       !== undefined) setPlayers(state.players)
      if (state.scores        !== undefined) setScores(state.scores)
      if (state.currentPlayer !== undefined) setCurrentPlayer(state.currentPlayer)
      if (state.mode          !== undefined) setMode(state.mode)
      if (state.assignedPlayerIndex !== undefined) setMyPlayerIndex(state.assignedPlayerIndex)
      if (state.dpGameState   !== undefined) setDpGameState(state.dpGameState)
    },
  })

  const mpRef = useRef(mp)
  useEffect(() => { mpRef.current = mp }, [mp])

  useEffect(() => {
    if (mp.isConnected) setMyPlayerIndex(mp.isHost ? 0 : 1)
  }, [mp.isConnected, mp.isHost])

  // Host emite estado completo en cada cambio
  useEffect(() => {
    if (mpRef.current.isConnected && mpRef.current.isHost) {
      mpRef.current.sendState({ players, scores, currentPlayer, mode, dpGameState })
    }
  }, [players, scores, currentPlayer, mode, dpGameState])

  useEffect(() => { saveState(players, scores) }, [players, scores])
  useEffect(() => { saveMode(mode) }, [mode])
  useEffect(() => { saveTheme(themeName); document.body.style.background = theme.bodyBg }, [themeName])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function updateScore(pi, rowId, sub, val) {
    if (mp.isConnected && !mp.isHost) {
      mp.sendAction({ action: 'updateScore', pi, rowId, subId: sub, value: val })
      return
    }
    setScores(prev => ({
      ...prev,
      [pi]: { ...prev[pi], [rowId]: { ...prev[pi][rowId], [sub]: val } },
    }))
  }

  function advanceTurn() {
    if (mp.isConnected && !mp.isHost) {
      mp.sendAction({ action: 'nextPlayer' })
    } else {
      setCurrentPlayer(prev => (prev + 1) % players.length)
      setRemoteDice(null)
    }
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

  function toggleTheme() { setThemeName(t => t === 'dark' ? 'light' : 'dark') }

  // ── Shared header components ──────────────────────────────────────────────

  function ModeToggle() {
    return (
      <div className="flex rounded-2xl p-1 gap-1"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
        {[
          { id: 'dados',      label: '🃏 Dados'      },
          { id: 'dice-party', label: '🎲 Dice Party' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="px-4 py-2 rounded-xl text-sm font-black transition-all"
            style={mode === m.id
              ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }
              : { color: theme.textMuted }}>
            {m.label}
          </button>
        ))}
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
          myPlayerIndex={mp.isConnected ? myPlayerIndex : null}
          remoteDice={remoteDice}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
          // Cuando Dice Party cambia el turno, lo sube al App para sincronizar
          onAdvanceTurn={advanceTurn}
          // Estado online de Dice Party (sincronizado entre host y guest)
          onlineDpState={mp.isConnected ? dpGameState : null}
          onDpStateChange={mp.isConnected ? (newState) => {
            setDpGameState(newState)
            // El host también lo emite al guest inmediatamente
            if (mpRef.current.isHost) {
              mpRef.current.sendState({ players, scores, currentPlayer, mode, dpGameState: newState })
            } else {
              // El guest lo envía al host
              mpRef.current.sendAction({ action: 'dpStateUpdate', state: newState })
            }
          } : null}
        />
        {showMultiplayer && (
          <MultiplayerModal
            mp={mp}
            isDark={isDark}
            players={players}
            onConfirmPlayer={(index, name) => {
              setMyPlayerIndex(index)
              const newPlayers = [...players]
              newPlayers[index] = name
              setPlayers(newPlayers)
            }}
            onClose={() => setShowMultiplayer(false)}
          />
        )}
      </>
    )
  }

  // ── Modo Dados ────────────────────────────────────────────────────────────
  return (
    <div className="app-shell select-none" style={{ background: theme.appBg, color: theme.text }}>
      <header className="shrink-0 backdrop-blur border-b px-3 pt-2 pb-2 flex flex-col gap-2"
        style={{ background: theme.headerBg, borderColor: theme.borderSubtle }}>
        <div className="flex items-center">
          <span className="text-xl w-8">🎲</span>
          <div className="flex-1 flex justify-center"><ModeToggle /></div>
          <div className="w-8" />
        </div>
        <div className="flex items-center justify-between gap-1">
          {[
            { label: '🎲', title: 'Dados',     active: showDiceRoller,  onClick: () => setShowDiceRoller(v => !v), activeColor: '#f59e0b' },
            { label: mp.isConnected ? '🌐 ●' : '🌐', title: 'Online', active: mp.isConnected, onClick: () => setShowMultiplayer(true), activeColor: '#22c55e' },
            { label: '👥', title: 'Jugadores', active: false, onClick: () => setShowPlayersModal(true) },
            { label: '🔄', title: 'Reset',     active: false, onClick: () => setShowResetModal(true), danger: true },
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
          myPlayerIndex={mp.isConnected ? myPlayerIndex : null}
          isOnline={mp.isConnected}
          onSelectionChange={setDiceSelected}
          onPlay={(pi, rowId, subId, value) => {
            updateScore(pi, rowId, subId, String(value))
            advanceTurn()
            setRollerReset(r => r + 1)
            setDiceSelected(null)
          }}
        />

        {showDiceRoller && (
          <div className="shrink-0 safe-bottom">
            <DiceRoller
              theme={theme}
              isDark={isDark}
              resetKey={rollerReset}
              canPlay={!!diceSelected}
              isMyTurn={!mp.isConnected || myPlayerIndex === currentPlayer}
              onDiceChange={(dice, hasRolled) => { setRollerDice(dice); setRollerHasRolled(hasRolled) }}
              onPlay={() => {
                if (!diceSelected) return
                updateScore(diceSelected.pi, diceSelected.rowId, diceSelected.subId, String(diceSelected.value))
                advanceTurn()
                setRollerReset(r => r + 1)
                setDiceSelected(null)
              }}
            />
          </div>
        )}
      </div>

      {showMultiplayer && (
        <MultiplayerModal
          mp={mp}
          isDark={isDark}
          players={players}
          onConfirmPlayer={(index, name) => {
            setMyPlayerIndex(index)
            const newPlayers = [...players]
            newPlayers[index] = name
            setPlayers(newPlayers)
          }}
          onClose={() => setShowMultiplayer(false)}
        />
      )}
    </div>
  )
}
