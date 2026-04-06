// ─── App principal ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
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

  // ── Estado del juego ─────────────────────────────────────────────────────
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
  const [remoteDice,       setRemoteDice]       = useState(null)
  const [dpGameState,      setDpGameState]      = useState(null)

  // Refs — siempre actuales dentro de callbacks
  const stateRef = useRef({})
  stateRef.current = { players, scores, currentPlayer, mode, dpGameState }

  useEffect(() => { saveState(players, scores) }, [players, scores])
  useEffect(() => { saveMode(mode) }, [mode])
  useEffect(() => { saveTheme(themeName); document.body.style.background = theme.bodyBg }, [themeName])

  // ── Multiplayer ──────────────────────────────────────────────────────────
  const mpRef = useRef(null)

  const mp = useMultiplayer({
    onRemoteAction: useCallback((action) => {
      // diceUpdate lo recibe cualquiera
      if (action.action === 'diceUpdate') {
        setRemoteDice({ dice: action.dice, locked: action.locked, rollsLeft: action.rollsLeft })
        return
      }
      // El resto solo lo procesa el host
      if (!mpRef.current?.isHost) return

      if (action.action === 'requestState') {
        const s = stateRef.current
        mpRef.current.sendState({
          players: s.players,
          scores:  s.scores,
          currentPlayer: s.currentPlayer,
          mode: s.mode,
          dpGameState: s.dpGameState,
          assignedPlayerIndex: 1,
        })
        return
      }
      if (action.action === 'registerName') {
        // Guest anuncia su nombre → host actualiza players[1] y re-emite
        setPlayers(prev => {
          const next = [...prev]
          next[action.index] = action.name
          return next
        })
        return
      }
      if (action.action === 'updateScore') {
        setScores(prev => ({
          ...prev,
          [action.pi]: { ...prev[action.pi],
            [action.rowId]: { ...prev[action.pi]?.[action.rowId], [action.subId]: action.value }
          },
        }))
      }
      if (action.action === 'nextPlayer') {
        setCurrentPlayer(prev => (prev + 1) % stateRef.current.players.length)
        setRemoteDice(null)
      }
      if (action.action === 'reset') {
        setScores(emptyScores(stateRef.current.players))
      }
      if (action.action === 'dpStateUpdate') {
        setDpGameState(action.state)
      }
    }, []),

    onRemoteState: useCallback((state) => {
      if (Array.isArray(state.players))          setPlayers(state.players)
      if (state.scores        != null)           setScores(state.scores)
      if (state.currentPlayer != null)           setCurrentPlayer(state.currentPlayer)
      if (state.mode          != null)           setMode(state.mode)
      if (state.assignedPlayerIndex != null)     setMyPlayerIndex(state.assignedPlayerIndex)
      if (state.dpGameState   !== undefined)     setDpGameState(state.dpGameState)
    }, []),
  })

  // Guardar ref siempre actualizada
  useEffect(() => { mpRef.current = mp }, [mp])

  // Host emite estado completo cuando algo cambia
  useEffect(() => {
    if (mp.isConnected && mp.isHost) {
      mp.sendState({
        players, scores, currentPlayer, mode, dpGameState,
      })
    }
  }, [players, scores, currentPlayer, mode, dpGameState])

  // Al conectarse: asignar índice y anunciar nombre al otro
  useEffect(() => {
    if (!mp.isConnected) return
    const idx = mp.isHost ? 0 : 1
    setMyPlayerIndex(idx)
  }, [mp.isConnected, mp.isHost])

  // ── Helpers de juego ─────────────────────────────────────────────────────

  const updateScore = useCallback((pi, rowId, sub, val) => {
    if (mp.isConnected && !mp.isHost) {
      mp.sendAction({ action: 'updateScore', pi, rowId, subId: sub, value: val })
      return
    }
    setScores(prev => ({
      ...prev,
      [pi]: { ...prev[pi], [rowId]: { ...prev[pi][rowId], [sub]: val } },
    }))
  }, [mp.isConnected, mp.isHost])

  const advanceTurn = useCallback(() => {
    if (mp.isConnected && !mp.isHost) {
      mp.sendAction({ action: 'nextPlayer' })
    } else {
      setCurrentPlayer(prev => (prev + 1) % stateRef.current.players.length)
      setRemoteDice(null)
    }
  }, [mp.isConnected, mp.isHost])

  // Callback para DiceParty: sincroniza estado de partida
  const onDpStateChange = useCallback((newState) => {
    setDpGameState(newState)
    if (mp.isConnected) {
      if (mp.isHost) {
        mp.sendState({ ...stateRef.current, dpGameState: newState })
      } else {
        mp.sendAction({ action: 'dpStateUpdate', state: newState })
      }
    }
  }, [mp.isConnected, mp.isHost])

  // Callback para DiceParty: sincronizar dados en vuelo
  const onDiceRoll = useCallback((dice, locked, rollsLeft) => {
    if (mp.isConnected) {
      mp.sendAction({ action: 'diceUpdate', dice, locked, rollsLeft })
    }
  }, [mp.isConnected])

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

  // ── ModeToggle ────────────────────────────────────────────────────────────
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
          onAdvanceTurn={advanceTurn}
          onlineDpState={mp.isConnected ? dpGameState : null}
          onDpStateChange={mp.isConnected ? onDpStateChange : null}
          onDiceRoll={onDiceRoll}
        />
        {showMultiplayer && (
          <MultiplayerModal mp={mp} isDark={isDark} players={players}
            onConfirmPlayer={(index, name) => {
              setMyPlayerIndex(index)
              const base = players.length >= 2 ? [...players] : [...DEFAULT_PLAYERS]
              base[index] = name
              setPlayers(base)
              // Anunciar nombre al otro jugador
              if (mp.isConnected) mp.sendAction({ action: 'registerName', index, name })
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
            { label: '🎲', title: 'Dados',     active: showDiceRoller,    onClick: () => setShowDiceRoller(v => !v), activeColor: '#f59e0b' },
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
          theme={theme} isDark={isDark}
          players={players} scores={scores}
          showPlayersModal={showPlayersModal} showResetModal={showResetModal}
          onUpdateScore={updateScore}
          onClosePlayers={() => setShowPlayersModal(false)}
          onCloseReset={() => setShowResetModal(false)}
          onSavePlayers={savePlayers} onResetScores={resetScores}
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
              theme={theme} isDark={isDark}
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
        <MultiplayerModal mp={mp} isDark={isDark} players={players}
          onConfirmPlayer={(index, name) => {
            setMyPlayerIndex(index)
            const base = players.length >= 2 ? [...players] : [...DEFAULT_PLAYERS]
            base[index] = name
            setPlayers(base)
            if (mp.isConnected) mp.sendAction({ action: 'registerName', index, name })
          }}
          onClose={() => setShowMultiplayer(false)}
        />
      )}
    </div>
  )
}
