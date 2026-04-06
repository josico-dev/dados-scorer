// ─── Modo Dice Party (estilo Yahtzee) ──────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Die, { FACE_COLORS } from '../diceParty/Die'
import { UPPER_COMBOS, LOWER_COMBOS, ALL_COMBOS } from '../diceParty/combinations'
import { calcPotential, detectJoker, calcUpperSum, calcTotal } from '../diceParty/scoring'
import PlayersModal from '../PlayersModal'

const STORAGE_KEY = 'dice-party-state'
const MAX_ROLLS   = 3
const TOTAL_TURNS = 13  // por jugador

// ── Helpers de estado ─────────────────────────────────────────────────────

function emptyPlayerScores() {
  const s = {}
  ALL_COMBOS.forEach(c => { s[c.id] = null })
  return s
}

function initialState(players) {
  return {
    players,
    currentPlayer : 0,
    scores        : players.map(() => emptyPlayerScores()),
    jokerBonuses  : players.map(() => 0),
    turn          : 0,
    dice          : [0, 0, 0, 0, 0],
    locked        : [false, false, false, false, false],
    rollsLeft     : MAX_ROLLS,
    hasRolled     : false,
    selectedCombo : null,
    jokerActive   : false,
    jokerUpperId  : null,
    phase         : 'playing',
  }
}

function rollDice(dice, locked) {
  return dice.map((d, i) => locked[i] ? d : Math.ceil(Math.random() * 6))
}

const DP_STORAGE_VERSION = 3

function loadDPState() {
  try {
    const r = localStorage.getItem(STORAGE_KEY)
    if (!r) return null
    const parsed = JSON.parse(r)
    if (parsed?._v !== DP_STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    if (!Array.isArray(parsed?.players) || parsed.players.length === 0) return null
    if (!Array.isArray(parsed?.scores)) return null
    if (typeof parsed?.turn !== 'number') return null
    return parsed
  } catch {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    return null
  }
}
function saveDPState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, _v: DP_STORAGE_VERSION })) } catch {}
}

const DEFAULT_DP_PLAYERS = ['Jugador 1', 'Jugador 2']

// ── Componente principal ──────────────────────────────────────────────────

export default function DicePartyMode({
  modeToggle, theme, isDark, onToggleTheme,
  mp, onOpenMultiplayer, myPlayerIndex, remoteDice,
  onAdvanceTurn, onlineDpState, onDpStateChange, onDiceRoll,
}) {
  const t = theme ?? { appBg: 'linear-gradient(135deg,#0d0221,#060d1f)', headerBg: 'rgba(10,8,30,0.85)', scorecardBg: 'rgba(15,12,40,0.85)', scorecardBorder: 'rgba(99,102,241,0.2)', text: '#f1f5f9', textMuted: 'rgba(255,255,255,0.4)', textFaint: 'rgba(255,255,255,0.2)', rowEven: 'rgba(255,255,255,0.03)', rowOdd: 'transparent', sectionBg: 'rgba(0,0,0,0.3)', borderSubtle: 'rgba(255,255,255,0.08)' }

  const isOnline = !!mp?.isConnected
  const [gs, setGs]               = useState(() => loadDPState() ?? initialState(DEFAULT_DP_PLAYERS))
  const [rolling, setRolling]     = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showPlayers, setShowPlayers] = useState(false)

  // Ref para acceder al estado actual sin stale closure
  const gsRef = useRef(gs)
  useEffect(() => { gsRef.current = gs }, [gs])
  const myTurnRef = useRef(true)

  // Calcular si es mi turno — actualizar ref
  const isMyTurnOnline = !isOnline || myPlayerIndex === null || myPlayerIndex === gs.currentPlayer
  useEffect(() => { myTurnRef.current = isMyTurnOnline }, [isMyTurnOnline])

  // Guardar en localStorage
  useEffect(() => { saveDPState(gs) }, [gs])

  // Cuando llega estado online, aplicar COMPLETO (incluyendo jugadores, scores, turno)
  useEffect(() => {
    if (!isOnline || !onlineDpState) return
    setGs(prev => ({
      ...prev,
      ...onlineDpState,
      // No sobreescribir los dados locales del jugador activo
      dice:   myTurnRef.current ? prev.dice   : onlineDpState.dice   ?? prev.dice,
      locked: myTurnRef.current ? prev.locked : onlineDpState.locked ?? prev.locked,
    }))
  }, [JSON.stringify(onlineDpState)])

  // Sincronizar players de App → gs cuando estamos online
  // (para que los nombres se reflejen en el scorecard)
  const [onlinePlayers, setOnlinePlayers] = useState(null)
  // (Recibimos onlineDpState que incluye players desde App)

  // Función para actualizar gs y notificar a App
  const updateGs = useCallback((updater) => {
    setGs(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      if (onDpStateChange) {
        onDpStateChange(next)
      }
      return next
    })
  }, [onDpStateChange])

  // Ref para onDiceRoll — siempre actualizado, nunca stale
  const onDiceRollRef = useRef(onDiceRoll)
  useEffect(() => { onDiceRollRef.current = onDiceRoll }, [onDiceRoll])

  // Sincronizar dados al lanzar — useEffect es el lugar correcto (no dentro del updater)
  useEffect(() => {
    if (isOnline && gs.hasRolled) {
      onDiceRollRef.current?.(gs.dice, gs.locked, gs.rollsLeft)
    }
  }, [gs.dice, gs.hasRolled, isOnline])

  // ── Acciones ──────────────────────────────────────────────────────────

  const handleRoll = useCallback(() => {
    const g = gsRef.current
    if (rolling || g.rollsLeft <= 0 || g.phase !== 'playing') return
    if (!myTurnRef.current) return  // no es tu turno
    setRolling(true)
    setTimeout(() => {
      setGs(prev => {
        const newDice = rollDice(prev.dice, prev.locked)
        const { jokerActive, jokerUpperId } = detectJoker(newDice, prev.scores[prev.currentPlayer])
        return { ...prev, dice: newDice, rollsLeft: prev.rollsLeft - 1, hasRolled: true, jokerActive, jokerUpperId, selectedCombo: null }
      })
      setRolling(false)
    }, 280)
  }, [rolling, onDiceRoll])

  function toggleLock(i) {
    if (!gsRef.current.hasRolled || gsRef.current.phase !== 'playing' || !myTurnRef.current) return
    setGs(prev => { const l = [...prev.locked]; l[i] = !l[i]; return { ...prev, locked: l } })
  }

  function selectCombo(comboId) {
    const g = gsRef.current
    if (!g.hasRolled || g.phase !== 'playing' || !myTurnRef.current) return
    const pot = calcPotential(g.dice, g.scores[g.currentPlayer], g.jokerActive, g.jokerUpperId)
    if (!pot[comboId]?.available) return
    setGs(prev => ({ ...prev, selectedCombo: prev.selectedCombo === comboId ? null : comboId }))
  }

  function handlePlay() {
    if (!gs.selectedCombo || !gs.hasRolled) return
    const { currentPlayer, scores, dice, jokerBonuses, jokerActive, jokerUpperId, players } = gs
    const potential = calcPotential(dice, scores[currentPlayer], jokerActive, jokerUpperId)
    const entry = potential[gs.selectedCombo]
    if (!entry?.available) return

    const newScores = scores.map((ps, pi) =>
      pi !== currentPlayer ? ps : { ...ps, [gs.selectedCombo]: entry.score }
    )
    const newJokerBonuses = jokerBonuses.map((b, pi) => pi === currentPlayer && jokerActive ? b + 1 : b)
    const nextPlayer = (currentPlayer + 1) % players.length
    const nextTurn   = gs.turn + 1
    const gameOver   = nextTurn >= TOTAL_TURNS * players.length

    const newState = {
      scores        : newScores,
      jokerBonuses  : newJokerBonuses,
      currentPlayer : gameOver ? currentPlayer : nextPlayer,
      turn          : nextTurn,
      dice          : [0, 0, 0, 0, 0],
      locked        : [false, false, false, false, false],
      rollsLeft     : MAX_ROLLS,
      hasRolled     : false,
      jokerActive   : false,
      jokerUpperId  : null,
      selectedCombo : null,
      phase         : gameOver ? 'done' : 'playing',
    }

    updateGs(prev => ({ ...prev, ...newState }))
    // En online, notificar también el avance de turno al sistema de App
    if (isOnline) onAdvanceTurn?.()
  }

  function handleReset() {
    setGs(initialState(gs.players))
    setShowReset(false)
  }

  // Guardar jugadores preservando puntuaciones existentes
  function savePlayers(names) {
    setGs(prev => ({
      ...initialState(names),
      // Preservar puntuaciones de jugadores que siguen existiendo
      scores       : names.map((_, i) => prev.scores[i] ?? emptyPlayerScores()),
      jokerBonuses : names.map((_, i) => prev.jokerBonuses[i] ?? 0),
    }))
    setShowPlayers(false)
  }

  // ── Datos derivados ────────────────────────────────────────────────────

  const { currentPlayer, scores, dice, locked, rollsLeft, hasRolled,
          jokerActive, jokerUpperId, selectedCombo, phase, players } = gs

  const potential     = hasRolled ? calcPotential(dice, scores[currentPlayer], jokerActive, jokerUpperId) : null
  const upperSums     = players.map((_, pi) => calcUpperSum(scores[pi]))
  const upperBonuses  = upperSums.map(s => s > 62 ? 35 : 0)
  const totals        = players.map((_, pi) => calcTotal(scores[pi], gs.jokerBonuses[pi]))
  const forcedCombo   = jokerActive && jokerUpperId && scores[currentPlayer][jokerUpperId] === null ? jokerUpperId : null
  const canRoll       = !rolling && rollsLeft > 0 && phase === 'playing'
  const canPlay       = hasRolled && selectedCombo !== null && phase === 'playing'

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="app-shell select-none" style={{ background: t.appBg, color: t.text }}>

      {/* Header — dos filas */}
      <header className="shrink-0 backdrop-blur border-b px-3 pt-2 pb-2 flex flex-col gap-2"
        style={{ background: t.headerBg, borderColor: t.borderSubtle }}>

        {/* Fila 1: logo + toggle centrado + turno */}
        <div className="flex items-center">
          <span className="text-xl w-8">🎲</span>
          <div className="flex-1 flex justify-center">
            {modeToggle}
          </div>
          {phase !== 'done' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', whiteSpace: 'nowrap' }}>
              {players[currentPlayer].split(' ')[0]} {gs.turn + 1}/{TOTAL_TURNS * players.length}
            </span>
          ) : <div className="w-8" />}
        </div>

        {/* Fila 2: acciones distribuidas */}
        <div className="flex items-center justify-between gap-1">
          {[
            { label: mp?.isConnected ? '🌐 ●' : '🌐', title: 'Online',     active: !!mp?.isConnected, onClick: onOpenMultiplayer, activeColor: '#22c55e' },
            { label: '👥', title: 'Jugadores', active: false, onClick: () => setShowPlayers(true) },
            { label: '🔄', title: 'Reset',     active: false, onClick: () => setShowReset(true), danger: true },
            { label: isDark ? '☀️' : '🌙', title: 'Tema', active: false, onClick: onToggleTheme },
          ].map(btn => (
            <button key={btn.title} onClick={btn.onClick}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition flex flex-col items-center gap-0.5"
              style={{
                background: btn.active
                  ? 'rgba(34,197,94,0.2)'
                  : btn.danger ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                color: btn.active ? btn.activeColor : btn.danger ? '#f87171' : t.textMuted,
              }}>
              <span className="text-sm leading-none">{btn.label}</span>
              <span className="text-[9px] leading-none">{btn.title}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Área de juego */}
      <div className="flex flex-col px-3 pt-2 pb-2 gap-2">

        {/* Scorecard */}
        <div className="rounded-2xl">
          <Scorecard
            theme={t}
            isDark={isDark}
            myPlayerIndex={myPlayerIndex}
            isOnline={!!mp?.isConnected}
            players={players}
            scores={scores}
            potential={potential}
            selectedCombo={selectedCombo}
            forcedCombo={forcedCombo}
            upperSums={upperSums}
            upperBonuses={upperBonuses}
            totals={totals}
            jokerBonuses={gs.jokerBonuses}
            onSelectCombo={selectCombo}
            currentPlayer={currentPlayer}
            hasRolled={hasRolled}
            phase={phase}
          />
        </div>

        {/* Zona inferior: joker + dados + botones */}
        <div className="flex flex-col gap-2 safe-bottom">

          {/* Banner Joker */}
          {jokerActive && hasRolled && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold text-center">
              🌟 ¡JOKER! +100 bonus
              {forcedCombo
                ? ` · Debes jugar: ${UPPER_COMBOS.find(c => c.id === forcedCombo)?.label}`
                : ' · Elige una combinación disponible'}
            </div>
          )}

          {/* Dados — propios o del oponente según el turno */}
          {!isMyTurnOnline && remoteDice ? (
            // Modo espectador: vemos los dados del oponente (no interactivos)
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold" style={{ color: t.textMuted }}>
                👁 Dados de {players[currentPlayer]}
              </span>
              <div className="flex justify-center gap-2">
                {remoteDice.dice.map((val, i) => (
                  <Die key={i} index={i} value={val} locked={remoteDice.locked[i]} rolling={false} onClick={() => {}} size={56} />
                ))}
              </div>
              <span className="text-[10px]" style={{ color: t.textFaint }}>
                {remoteDice.rollsLeft} lanzamientos restantes
              </span>
            </div>
          ) : (
            // Turno propio: dados interactivos
            <div className="flex justify-center gap-2">
              {dice.map((val, i) => (
                <Die key={i} index={i} value={val} locked={locked[i]} rolling={rolling} onClick={() => toggleLock(i)} size={56} />
              ))}
            </div>
          )}

          {/* Botones — solo activos en tu turno */}
          <div className="flex gap-2">
            <button onClick={handleRoll} disabled={!canRoll || !isMyTurnOnline}
              className="flex-1 py-3 rounded-xl font-black text-sm transition active:scale-95 disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#000' }}>
              {isMyTurnOnline ? `🎲 Lanzar ${rollsLeft < MAX_ROLLS ? `(${rollsLeft})` : ''}` : `⏳ Turno de ${players[currentPlayer]}`}
            </button>
            <button onClick={handlePlay} disabled={!canPlay || !isMyTurnOnline}
              className="flex-1 py-3 rounded-xl font-black text-sm transition active:scale-95 disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: '#000' }}>
              ✅ JUGAR
            </button>
          </div>
        </div>
      </div>

      {/* Modal reset */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowReset(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🔄</div>
            <h2 className="text-white font-bold text-lg mb-2">¿Nueva partida?</h2>
            <p className="text-white/50 text-sm mb-5">Se borrarán todas las puntuaciones.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 font-medium">Cancelar</button>
              <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition">Reiniciar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal jugadores */}
      {showPlayers && (
        <PlayersModal players={players} onSave={savePlayers} onClose={() => setShowPlayers(false)} />
      )}

      {/* Modal fin de partida */}
      {phase === 'done' && !showReset && (
        <GameOverModal players={players} totals={totals} onReset={handleReset} />
      )}
    </div>
  )
}

// ── Modal de info de combinación ──────────────────────────────────────────

function InfoModal({ combo, onClose }) {
  if (!combo) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl p-5 border border-white/10 shadow-2xl max-w-xs w-full"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-base">{combo.label}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Requisito</div>
            <div className="text-sm text-white/80">{combo.info.req}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Puntuación</div>
            <div className="text-sm text-emerald-300 font-medium">{combo.info.score}</div>
          </div>
          <div className="bg-slate-700/60 rounded-xl px-3 py-2">
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Ejemplo</div>
            <div className="text-sm text-amber-300 font-mono">{combo.info.example}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Scorecard ─────────────────────────────────────────────────────────────
//
// Filas = combinaciones, columnas = jugadores (igual que el modo normal).
// Upper y Lower son separadores sutiles, sin cabeceras dominantes.

function Scorecard({
  theme, isDark, myPlayerIndex, isOnline,
  players, scores, potential, selectedCombo, forcedCombo,
  upperSums, upperBonuses, totals, jokerBonuses,
  onSelectCombo, currentPlayer, hasRolled, phase,
}) {
  const [infoCombo, setInfoCombo] = useState(null)
  const t = theme ?? {}

  // Colores adaptativos
  const cardBg      = t.scorecardBg    ?? 'rgba(15,12,40,0.85)'
  const cardBorder  = t.scorecardBorder ?? 'rgba(99,102,241,0.2)'
  const headerBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const sectionBg   = isDark ? 'rgba(0,0,0,0.25)'       : 'rgba(0,0,0,0.05)'
  const bonusBg     = isDark ? 'rgba(0,0,0,0.2)'        : 'rgba(0,0,0,0.04)'
  const rowEvenBg   = isDark ? 'rgba(255,255,255,0.03)'  : 'rgba(0,0,0,0.02)'
  const borderColor = isDark ? 'rgba(255,255,255,0.07)'  : 'rgba(0,0,0,0.07)'
  const textMain    = t.text    ?? '#f1f5f9'
  const textMuted   = t.textMuted ?? 'rgba(255,255,255,0.4)'
  const textFaint   = t.textFaint ?? 'rgba(255,255,255,0.2)'

  function cellStyle(comboId, pi) {
    const played      = scores[pi][comboId] !== null
    const isSelected  = selectedCombo === comboId && pi === currentPlayer
    const isForced    = forcedCombo   === comboId && pi === currentPlayer
    const isAvailable = potential?.[comboId]?.available && pi === currentPlayer && hasRolled

    if (isForced)    return { background: 'rgba(245,158,11,0.25)', border: '1px solid #f59e0b',   color: '#fde68a', cursor: 'pointer', fontWeight: 'bold' }
    if (isSelected)  return { background: 'rgba(34,197,94,0.2)',   border: '1px solid #22c55e',   color: '#86efac', cursor: 'pointer', fontWeight: 'bold' }
    if (played)      return { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: textMain }
    if (isAvailable) return { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', cursor: 'pointer' }
    return { color: textFaint }
  }

  function cellContent(comboId, pi) {
    const val = scores[pi][comboId]
    if (val !== null) return val
    if (potential?.[comboId]?.available && pi === currentPlayer && hasRolled)
      return <span className="text-[11px]">{potential[comboId].score}</span>
    return '—'
  }

  function handleClick(comboId, pi) {
    if (pi !== currentPlayer) return
    onSelectCombo(comboId)
  }

  const colPx    = players.length <= 2 ? 64 : players.length <= 3 ? 56 : 48
  const gridCols = `1fr ${players.map(() => `${colPx}px`).join(' ')}`

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>

      {/* Cabecera */}
      <div className="grid items-center border-b" style={{ gridTemplateColumns: gridCols, background: headerBg, borderColor }}>
        <div className="py-2 pl-3 text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Combinación</div>
        {players.map((name, pi) => {
          const isMe     = isOnline && pi === myPlayerIndex
          const isMyTurn = pi === currentPlayer && phase === 'playing'
          return (
            <div key={pi} className="flex flex-col items-center py-1 px-1 gap-0.5">
              <span className="text-xs font-bold truncate max-w-full"
                style={{ color: isMyTurn ? '#f59e0b' : textMuted }}>
                {name}{isMyTurn ? ' ▶' : ''}
              </span>
              {isMe && (
                <span className="text-[8px] font-bold px-1 py-0.5 rounded-full leading-none"
                  style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>TÚ</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Separador Superior */}
      <div className="px-3 py-0.5 border-b" style={{ background: sectionBg, borderColor }}>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Superior</span>
      </div>

      {/* Filas Upper */}
      {UPPER_COMBOS.map((combo, ri) => (
        <div key={combo.id} className="grid items-center border-b"
          style={{ gridTemplateColumns: gridCols, background: ri % 2 === 0 ? rowEvenBg : 'transparent', borderColor }}>
          <div className="flex items-center gap-2 pl-3 py-2">
            <MiniDie value={combo.upperValue} />
            <span className="text-sm font-medium" style={{ color: textMain }}>{combo.badge}</span>
          </div>
          {players.map((_, pi) => (
            <div key={pi} onClick={() => handleClick(combo.id, pi)}
              className="h-9 flex items-center justify-center text-sm font-bold rounded-lg mx-1 transition-all"
              style={cellStyle(combo.id, pi)}>
              {cellContent(combo.id, pi)}
            </div>
          ))}
        </div>
      ))}

      {/* Bonus upper */}
      <div className="grid items-center border-b" style={{ gridTemplateColumns: gridCols, background: bonusBg, borderColor }}>
        <div className="pl-3 py-1.5 flex items-center gap-1">
          <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Bonus +35</span>
          <span className="text-[10px]" style={{ color: textFaint }}>(&gt;62)</span>
        </div>
        {players.map((_, pi) => (
          <div key={pi} className="flex flex-col items-center py-1">
            <span className="text-xs font-bold" style={{ color: upperBonuses[pi] ? '#f59e0b' : textFaint }}>
              {upperBonuses[pi] ? '+35' : '—'}
            </span>
            <span className="text-[9px]" style={{ color: textFaint }}>{upperSums[pi]}</span>
          </div>
        ))}
      </div>

      {/* Separador Inferior */}
      <div className="px-3 py-0.5 border-b" style={{ background: sectionBg, borderColor }}>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Inferior</span>
      </div>

      {/* Filas Lower */}
      {LOWER_COMBOS.map((combo, ri) => (
        <div key={combo.id} className="grid items-center border-b"
          style={{ gridTemplateColumns: gridCols, background: ri % 2 === 0 ? rowEvenBg : 'transparent', borderColor }}>
          <div className="pl-3 py-2 flex items-center gap-1.5">
            <span className="text-sm font-medium" style={{ color: textMain }}>{combo.badge}</span>
            {combo.fixedScore && <span className="text-[10px]" style={{ color: textFaint }}>({combo.fixedScore})</span>}
            <button onClick={e => { e.stopPropagation(); setInfoCombo(combo) }}
              className="ml-auto mr-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition flex-shrink-0"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: textMuted }}>ⓘ</button>
          </div>
          {players.map((_, pi) => (
            <div key={pi} onClick={() => handleClick(combo.id, pi)}
              className="h-9 flex items-center justify-center text-sm font-bold rounded-lg mx-1 transition-all"
              style={cellStyle(combo.id, pi)}>
              {cellContent(combo.id, pi)}
            </div>
          ))}
        </div>
      ))}

      <InfoModal combo={infoCombo} onClose={() => setInfoCombo(null)} />

      {/* Bonus Joker */}
      <div className="grid items-center border-b" style={{ gridTemplateColumns: gridCols, background: bonusBg, borderColor }}>
        <div className="pl-3 py-1.5">
          <span className="text-xs font-bold" style={{ color: '#c084fc' }}>🌟 Joker ×100</span>
        </div>
        {players.map((_, pi) => (
          <div key={pi} className="flex items-center justify-center py-1.5">
            <span className="text-xs font-bold" style={{ color: jokerBonuses[pi] > 0 ? '#c084fc' : textFaint }}>
              {jokerBonuses[pi] > 0 ? `+${jokerBonuses[pi] * 100}` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="grid" style={{ gridTemplateColumns: gridCols, background: bonusBg, borderTop: '2px solid rgba(167,139,250,0.3)' }}>
        <div className="pl-3 py-3 text-xs font-bold uppercase tracking-wider self-center" style={{ color: textMuted }}>Total</div>
        {players.map((_, pi) => (
          <div key={pi} className="flex items-center justify-center py-2">
            <span className="text-xl font-black tabular-nums" style={{ color: totals[pi] > 0 ? '#a78bfa' : textFaint }}>
              {totals[pi] || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mini dado ─────────────────────────────────────────────────────────────

const MINI_PIPS = {
  1: [[8,8]],
  2: [[5,5],[11,11]],
  3: [[5,5],[8,8],[11,11]],
  4: [[5,5],[11,5],[5,11],[11,11]],
  5: [[5,5],[11,5],[8,8],[5,11],[11,11]],
  6: [[5,4],[11,4],[5,8],[11,8],[5,12],[11,12]],
}

function MiniDie({ value }) {
  const c = FACE_COLORS[value] ?? FACE_COLORS[0]
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="14" height="14" rx="3" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      {(MINI_PIPS[value] || []).map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill={c.pip}/>
      ))}
    </svg>
  )
}

// ── Modal fin de partida ──────────────────────────────────────────────────

function GameOverModal({ players, totals, onReset }) {
  const maxScore = Math.max(...totals)
  const winners  = players.filter((_, i) => totals[i] === maxScore)
  const tie      = winners.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl p-6 border border-amber-400/30 shadow-2xl max-w-xs w-full text-center">
        <div className="text-5xl mb-3">{tie ? '🤝' : '🏆'}</div>
        <h2 className="text-amber-300 font-black text-xl mb-1">
          {tie ? '¡Empate!' : `¡Gana ${winners[0]}!`}
        </h2>
        <div className="flex justify-center gap-4 my-4 flex-wrap">
          {players.map((name, pi) => (
            <div key={pi} className="flex flex-col items-center">
              <span className="text-white/50 text-xs">{name}</span>
              <span className={`text-3xl font-black ${totals[pi] === maxScore ? 'text-amber-300' : 'text-white/50'}`}>
                {totals[pi]}
              </span>
            </div>
          ))}
        </div>
        <button onClick={onReset} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition">
          Nueva partida
        </button>
      </div>
    </div>
  )
}
