// ─── App — orquestador ────────────────────────────────────────────────────
//
// Online: SYNC SIMÉTRICO. Cualquier mutación local emite el state completo
// al peer. El receptor reemplaza su state. No hay autoridad host/guest.

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { DEFAULT_PLAYERS, ROWS, SUBTYPES } from './config'
import { THEMES, loadTheme, saveTheme } from './theme'
import { useGameState } from './game/useGameState'
import { useDice } from './game/useDice'
import { useMultiplayer } from './multiplayer/useMultiplayer'
import { ALL_COMBOS } from './diceParty/combinations'
import { detectJoker, calcPotential as calcPotentialFn } from './diceParty/scoring'
import DadosBoard from './boards/DadosBoard'
import DicePartyBoard from './boards/DicePartyBoard'
import DicePanel from './dice/DicePanel'
import MultiplayerModal from './multiplayer/MultiplayerModal'
import PlayersModal from './ui/PlayersModal'
import ResetModal from './ui/ResetModal'

const MODE_KEY = 'dados-scorer-mode'
const loadMode = () => { try { return localStorage.getItem(MODE_KEY) || 'dados' } catch { return 'dados' } }
const saveMode = m => { try { localStorage.setItem(MODE_KEY, m) } catch { /* storage no disponible */ } }

// Scores vacíos para Dice Party
function emptyDPScores(players) { return players.map(() => { const s = {}; ALL_COMBOS.forEach(c => { s[c.id] = null }); return s }) }

// Scores vacíos para modo Normal
function emptyNormalScores(players) {
  const s = {}
  players.forEach((_, pi) => { s[pi] = {}; ROWS.forEach(r => { s[pi][r.id] = {}; SUBTYPES.forEach(sub => { s[pi][r.id][sub.id] = '' }) }) })
  return s
}

export default function App() {
  const [mode,      setMode]      = useState(() => loadMode())
  const [themeName, setThemeName] = useState(() => loadTheme())
  const theme  = THEMES[themeName] ?? THEMES.dark
  const isDark = themeName === 'dark'

  // ── Estado del juego ─────────────────────────────────────────────────────
  const game = useGameState(DEFAULT_PLAYERS, mode)
  const dice = useDice()

  // UI
  const [showMultiplayer,  setShowMultiplayer]  = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showResetModal,   setShowResetModal]   = useState(false)
  const [showDice,         setShowDice]         = useState(false)
  // Dice Party
  const [selectedCombo,    setSelectedCombo]    = useState(null)
  const [jokerBonuses,     setJokerBonuses]     = useState([0, 0])
  const [dpPhase,          setDpPhase]          = useState('playing')
  // Normal mode
  const [selectedCell,     setSelectedCell]     = useState(null)
  const pendingNormalRef = useRef(null)

  useEffect(() => { saveMode(mode) }, [mode])
  useEffect(() => { saveTheme(themeName); document.body.style.background = theme.bodyBg }, [themeName, theme.bodyBg])

  // ── Multiplayer (sync simétrico) ─────────────────────────────────────────
  // Flag: estoy aplicando un state recibido → no re-emitirlo
  const skipEmitRef = useRef(false)
  // Flag: ya recibí al menos un state remoto (el que se une espera al iniciador)
  const hasReceivedStateRef = useRef(false)

  const mp = useMultiplayer({
    onRemoteState: useCallback(state => {
      skipEmitRef.current = true
      hasReceivedStateRef.current = true

      const prev = game.stateRef.current
      const turnChanged = state.turn != null && state.turn !== prev.turn
      const modeChanged = state.mode != null && state.mode !== prev.mode
      const currentPlayerChanged = state.currentPlayer != null && state.currentPlayer !== prev.currentPlayer

      if (state.players)               game.setPlayers(state.players)
      if (state.scores != null)        game.setScores(state.scores)
      if (state.currentPlayer != null) game.setCurrentPlayer(state.currentPlayer)
      if (state.turn != null)          game.setTurn(state.turn)
      if (state.jokerBonuses)          setJokerBonuses(state.jokerBonuses)
      if (state.dpPhase)               setDpPhase(state.dpPhase)
      if (state.mode)                  setMode(state.mode)
      if (state.dice) {
        dice.applyRemote({ dice: state.dice, locked: state.locked, rollsLeft: state.rollsLeft })
      }

      // Resetear UI volátil cuando cambia turno / modo (afecta a ambos peers)
      if (turnChanged || modeChanged || currentPlayerChanged) {
        setSelectedCell(null)
        setSelectedCombo(null)
        pendingNormalRef.current = null
      }
    }, [game, dice]),

    onConnected: useCallback(isInitiator => {
      // Iniciador emite su state inmediatamente para que el peer se ponga al día.
      // Quien se une espera a recibir.
      if (isInitiator) {
        // skipEmitRef false: dejar que el useEffect emit dispare en el próximo render
        // (en realidad se forzará vía cambio de mp.isConnected)
        hasReceivedStateRef.current = true
      }
    }, []),
  })

  const myPlayerIndex = mp.myIndex ?? 0
  const isOnline      = mp.isConnected
  const isMyTurn      = !isOnline || myPlayerIndex === game.currentPlayer
  const isParty       = mode === 'dice-party'
  const activeDice    = dice.dice
  const currentScores = game.scores?.[game.currentPlayer] ?? {}

  // ── Emit state al peer cuando algo compartido cambia ─────────────────────
  // Destructuro para tener referencias estables (sendState es useCallback con [])
  const { isConnected: mpConnected, sendState: mpSendState } = mp
  useEffect(() => {
    if (skipEmitRef.current) {
      skipEmitRef.current = false
      return
    }
    if (!mpConnected) return
    // Quien se une no emite hasta haber recibido el state inicial del iniciador
    if (!hasReceivedStateRef.current) return

    mpSendState({
      players: game.players,
      scores: game.scores,
      currentPlayer: game.currentPlayer,
      turn: game.turn,
      jokerBonuses,
      dpPhase,
      mode,
      dice: dice.dice,
      locked: dice.locked,
      rollsLeft: dice.rollsLeft,
    })
  }, [
    mpConnected, mpSendState,
    game.players, game.scores, game.currentPlayer, game.turn,
    jokerBonuses, dpPhase, mode,
    dice.dice, dice.locked, dice.rollsLeft,
  ])

  // Al desconectar, resetea el flag para una próxima conexión
  useEffect(() => {
    if (!mpConnected) hasReceivedStateRef.current = false
  }, [mpConnected])

  // ── Acciones — siempre locales, el sync se encarga del resto ─────────────

  function handleAdvanceTurn() {
    game.advanceTurn()
    dice.reset()
    setSelectedCell(null)
    setSelectedCombo(null)
    pendingNormalRef.current = null
  }

  // ── Normal mode: JUGAR ─────────────────────────────────────────────────

  function handleNormalCellClick(pi, rowId, subId, count) {
    if (isOnline && pi !== myPlayerIndex) return
    setSelectedCell(`${pi}-${rowId}-${subId}`)
    pendingNormalRef.current = { pi, rowId, subId, count }
  }

  function handleNormalPlay() {
    const p = pendingNormalRef.current
    if (!p) return
    game.updateScore(p.pi, p.rowId, p.subId, String(p.count))
    handleAdvanceTurn()
  }

  // ── Party mode: seleccionar combo + JUGAR ─────────────────────────────

  function handleComboClick(comboId) {
    if (!dice.hasRolled || !isMyTurn) return
    setSelectedCombo(prev => prev === comboId ? null : comboId)
  }

  function handlePartyPlay() {
    if (!selectedCombo || !dice.hasRolled) return
    const potential = calcPotentialFn(dice.dice, currentScores, jokerActive, jokerUpperId)
    const entry = potential[selectedCombo]
    if (!entry?.available) return

    const pi = game.currentPlayer
    game.updateScore(pi, selectedCombo, null, entry.score)

    if (jokerActive) {
      setJokerBonuses(prev => prev.map((b, i) => i === pi ? b + 1 : b))
    }

    const totalTurns = 13 * game.players.length
    if (game.turn + 1 >= totalTurns) setDpPhase('done')

    handleAdvanceTurn()
  }

  // Detectar joker en Dice Party (derivado)
  const { jokerActive, jokerUpperId } = useMemo(() => {
    if (isParty && dice.hasRolled && game.scores?.[game.currentPlayer]) {
      return detectJoker(dice.dice, game.scores[game.currentPlayer])
    }
    return { jokerActive: false, jokerUpperId: null }
  }, [dice.dice, dice.hasRolled, isParty, game.currentPlayer, game.scores])

  // ── Reset / jugadores / online ─────────────────────────────────────────

  function handleReset() {
    const empty = isParty ? emptyDPScores(game.players) : emptyNormalScores(game.players)
    game.resetGame(game.players, empty, {})
    setJokerBonuses(game.players.map(() => 0))
    setDpPhase('playing')
    dice.reset()
    setSelectedCombo(null)
    setSelectedCell(null)
    pendingNormalRef.current = null
    setShowResetModal(false)
  }

  function handleSavePlayers(names) {
    // Si estamos online, limitar a 2 jugadores
    const finalNames = isOnline ? names.slice(0, 2) : names
    const safeNames = finalNames.length >= 1 ? finalNames : ['Jugador 1']
    const empty = isParty ? emptyDPScores(safeNames) : emptyNormalScores(safeNames)
    game.resetGame(safeNames, empty, {})
    setJokerBonuses(safeNames.map(() => 0))
    setShowPlayersModal(false)
  }

  function handleStartOnline({ name, index }) {
    // Solo actualiza mi propio nombre en el slot correspondiente.
    // No resetea la partida — sync simétrico se encarga al conectar.
    game.setPlayers(prev => {
      const next = [...prev]
      while (next.length < 2) next.push(`Jugador ${next.length + 1}`)
      next[index] = name || `Jugador ${index + 1}`
      return next.slice(0, 2)
    })
  }

  function toggleTheme() { setThemeName(t => t === 'dark' ? 'light' : 'dark') }

  function switchMode(newMode) {
    if (newMode === mode) return
    const empty = newMode === 'dice-party' ? emptyDPScores(game.players) : emptyNormalScores(game.players)
    game.setScores(empty)
    game.setCurrentPlayer(0)
    game.setTurn(0)
    setJokerBonuses(game.players.map(() => 0))
    setDpPhase('playing')
    setMode(newMode)
    dice.reset()
    setSelectedCombo(null)
    setSelectedCell(null)
    pendingNormalRef.current = null
  }

  // Toggle lock: solo si es mi turno (bloquea manipulación del espectador)
  const handleToggleLock = useCallback(i => {
    if (!isMyTurn) return
    dice.toggleLock(i)
  }, [isMyTurn, dice])

  const diceVisible = isParty || showDice

  const forcedCombo = jokerActive && jokerUpperId && currentScores[jokerUpperId] === null
    ? jokerUpperId : null

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="app-shell select-none" style={{ background: theme.appBg, color: theme.text }}>

      {/* Header */}
      <header className="shrink-0 backdrop-blur border-b px-3 pt-2 pb-2 flex flex-col gap-2"
        style={{ background: theme.headerBg, borderColor: theme.borderSubtle }}>

        <div className="flex items-center">
          <span className="text-xl w-8">🎲</span>
          <div className="flex-1 flex justify-center">
            <div className="flex rounded-2xl p-1 gap-1" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              {[{ id: 'dados', label: '🃏 Dados' }, { id: 'dice-party', label: '🎲 Dice Party' }].map(m => (
                <button key={m.id} onClick={() => switchMode(m.id)}
                  className="px-4 py-2 rounded-xl text-sm font-black transition-all"
                  style={mode === m.id ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' } : { color: theme.textMuted }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {isParty && dpPhase !== 'done' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', whiteSpace: 'nowrap' }}>
              T{game.turn + 1}/{13 * game.players.length}
            </span>
          ) : <div className="w-8" />}
        </div>

        <div className="flex items-center justify-between gap-1">
          {[
            ...(!isParty ? [{ label: '🎲', title: 'Dados', active: showDice, onClick: () => setShowDice(v => !v), activeColor: '#f59e0b' }] : []),
            { label: isOnline ? '🌐 ●' : '🌐', title: 'Online', active: isOnline, onClick: () => setShowMultiplayer(true), activeColor: '#22c55e' },
            { label: '👥', title: 'Jugadores', active: false, onClick: () => setShowPlayersModal(true) },
            { label: '🔄', title: 'Reset',     active: false, onClick: () => setShowResetModal(true), danger: true },
            { label: isDark ? '☀️' : '🌙', title: 'Tema', active: false, onClick: toggleTheme },
          ].map(btn => (
            <button key={btn.title} onClick={btn.onClick}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition flex flex-col items-center gap-0.5"
              style={{
                background: btn.active ? `rgba(${btn.activeColor === '#f59e0b' ? '245,158,11' : '34,197,94'},0.2)` : btn.danger ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                color: btn.active ? btn.activeColor : btn.danger ? '#f87171' : theme.textMuted,
              }}>
              <span className="text-sm leading-none">{btn.label}</span>
              <span className="text-[9px] leading-none">{btn.title}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Tablero */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isParty ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2">
            <DicePartyBoard
              players={game.players} scores={game.scores} jokerBonuses={jokerBonuses}
              currentPlayer={game.currentPlayer} myPlayerIndex={isOnline ? myPlayerIndex : null} isOnline={isOnline}
              diceValues={activeDice} hasRolled={dice.hasRolled} selectedCombo={selectedCombo} forcedCombo={forcedCombo}
              jokerActive={jokerActive} jokerUpperId={jokerUpperId}
              onComboClick={handleComboClick}
              theme={theme} isDark={isDark} phase={dpPhase}
            />
          </div>
        ) : (
          <DadosBoard
            players={game.players} scores={game.scores}
            currentPlayer={game.currentPlayer} myPlayerIndex={isOnline ? myPlayerIndex : null} isOnline={isOnline}
            diceValues={activeDice} hasRolled={dice.hasRolled && isMyTurn} selectedCell={selectedCell}
            onCellClick={handleNormalCellClick}
            onUpdateScore={(pi, rowId, subId, val) => {
              if (isOnline && pi !== myPlayerIndex) return
              game.updateScore(pi, rowId, subId, val)
            }}
            theme={theme} isDark={isDark}
          />
        )}

        {/* Panel de dados */}
        {diceVisible && (
          <div className="shrink-0">
            <DicePanel
              dice={dice.dice}
              locked={dice.locked}
              rolling={dice.rolling}
              rollsLeft={dice.rollsLeft}
              rollCount={dice.rollCount}
              onRoll={dice.roll}
              onToggleLock={handleToggleLock}
              onPlay={isParty ? handlePartyPlay : handleNormalPlay}
              canPlay={isParty ? !!selectedCombo : !!selectedCell}
              isMyTurn={isMyTurn}
              mode={isParty ? 'party' : 'normal'}
              theme={theme}
              isDark={isDark}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      {showMultiplayer && <MultiplayerModal mp={mp} isDark={isDark} onStartOnline={handleStartOnline} onClose={() => setShowMultiplayer(false)} />}
      {showPlayersModal && <PlayersModal players={game.players} maxPlayers={isOnline ? 2 : Infinity} onSave={handleSavePlayers} onClose={() => setShowPlayersModal(false)} />}
      {showResetModal && <ResetModal onConfirm={handleReset} onClose={() => setShowResetModal(false)} />}
    </div>
  )
}
