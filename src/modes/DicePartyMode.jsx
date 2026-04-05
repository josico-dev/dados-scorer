// ─── Modo Dice Party (estilo Yahtzee) ──────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Die from '../diceParty/Die'
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

function loadDPState() {
  try {
    const r = localStorage.getItem(STORAGE_KEY)
    if (!r) return null
    const parsed = JSON.parse(r)
    // Validar que la estructura es compatible (tiene el campo players como array)
    if (!parsed?.players || !Array.isArray(parsed.players)) return null
    if (!Array.isArray(parsed.scores)) return null
    return parsed
  } catch { return null }
}
function saveDPState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

const DEFAULT_DP_PLAYERS = ['Jugador 1', 'Jugador 2']

// ── Componente principal ──────────────────────────────────────────────────

export default function DicePartyMode({ modeToggle }) {
  const [gs, setGs]           = useState(() => loadDPState() ?? initialState(DEFAULT_DP_PLAYERS))
  const [rolling, setRolling] = useState(false)
  const [showReset, setShowReset]     = useState(false)
  const [showPlayers, setShowPlayers] = useState(false)

  useEffect(() => { saveDPState(gs) }, [gs])

  // ── Acciones de turno ─────────────────────────────────────────────────

  const handleRoll = useCallback(() => {
    if (rolling || gs.rollsLeft <= 0 || gs.phase !== 'playing') return
    setRolling(true)
    setTimeout(() => {
      setGs(prev => {
        const newDice = rollDice(prev.dice, prev.locked)
        const { jokerActive, jokerUpperId } = detectJoker(newDice, prev.scores[prev.currentPlayer])
        return { ...prev, dice: newDice, rollsLeft: prev.rollsLeft - 1, hasRolled: true, jokerActive, jokerUpperId, selectedCombo: null }
      })
      setRolling(false)
    }, 280)
  }, [rolling, gs.rollsLeft, gs.phase])

  function toggleLock(i) {
    if (!gs.hasRolled || gs.phase !== 'playing') return
    setGs(prev => { const l = [...prev.locked]; l[i] = !l[i]; return { ...prev, locked: l } })
  }

  function selectCombo(comboId) {
    if (!gs.hasRolled || gs.phase !== 'playing') return
    const pot = calcPotential(gs.dice, gs.scores[gs.currentPlayer], gs.jokerActive, gs.jokerUpperId)
    if (!pot[comboId]?.available) return
    setGs(prev => ({ ...prev, selectedCombo: prev.selectedCombo === comboId ? null : comboId }))
  }

  function handlePlay() {
    if (!gs.selectedCombo || !gs.hasRolled) return
    const { currentPlayer, scores, dice, jokerBonuses, jokerActive, jokerUpperId } = gs
    const potential = calcPotential(dice, scores[currentPlayer], jokerActive, jokerUpperId)
    const entry = potential[gs.selectedCombo]
    if (!entry?.available) return

    const newScores = scores.map((ps, pi) =>
      pi !== currentPlayer ? ps : { ...ps, [gs.selectedCombo]: entry.score }
    )
    const newJokerBonuses = jokerBonuses.map((b, pi) => pi === currentPlayer && jokerActive ? b + 1 : b)

    const nextPlayer = (currentPlayer + 1) % gs.players.length
    const nextTurn   = gs.turn + 1
    const gameOver   = nextTurn >= TOTAL_TURNS * gs.players.length

    setGs(prev => ({
      ...prev,
      scores        : newScores,
      jokerBonuses  : newJokerBonuses,
      currentPlayer : gameOver ? prev.currentPlayer : nextPlayer,
      turn          : nextTurn,
      dice          : [0, 0, 0, 0, 0],
      locked        : [false, false, false, false, false],
      rollsLeft     : MAX_ROLLS,
      hasRolled     : false,
      jokerActive   : false,
      jokerUpperId  : null,
      selectedCombo : null,
      phase         : gameOver ? 'done' : 'playing',
    }))
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white select-none flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-white/10 px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-xl">🎲</span>
        {modeToggle}
        <div className="flex items-center gap-1.5">
          {phase !== 'done' && (
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold">
              {players[currentPlayer]} · {gs.turn + 1}/{TOTAL_TURNS * players.length}
            </span>
          )}
          <button onClick={() => setShowPlayers(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition">👥</button>
          <button onClick={() => setShowReset(true)}
            className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition">🔄</button>
        </div>
      </header>

      {/* Área de juego */}
      <div className="flex-1 flex flex-col gap-3 p-3">

        {/* Scorecard */}
        <Scorecard
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

        {/* Banner Joker */}
        {jokerActive && hasRolled && (
          <div className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold text-center">
            🌟 ¡JOKER! +100 bonus
            {forcedCombo
              ? ` · Debes jugar: ${UPPER_COMBOS.find(c => c.id === forcedCombo)?.label}`
              : ' · Elige una combinación disponible'}
          </div>
        )}

        {/* Dados más grandes */}
        <div className="flex justify-center gap-3 py-2">
          {dice.map((val, i) => (
            <Die key={i} value={val} locked={locked[i]} rolling={rolling} onClick={() => toggleLock(i)} size={72} />
          ))}
        </div>

        {/* Botones más grandes */}
        <div className="flex gap-3 pb-3">
          <button onClick={handleRoll} disabled={!canRoll}
            className="flex-1 py-4 rounded-2xl font-black text-base bg-amber-500 hover:bg-amber-400 text-black transition disabled:opacity-40 active:scale-95">
            🎲 Lanzar {rollsLeft < MAX_ROLLS ? `(${rollsLeft})` : ''}
          </button>
          <button onClick={handlePlay} disabled={!canPlay}
            className="flex-1 py-4 rounded-2xl font-black text-base bg-emerald-500 hover:bg-emerald-400 text-black transition disabled:opacity-40 active:scale-95">
            ✅ JUGAR
          </button>
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

// ── Scorecard ─────────────────────────────────────────────────────────────
//
// Filas = combinaciones, columnas = jugadores (igual que el modo normal).
// Upper y Lower son separadores sutiles, sin cabeceras dominantes.

function Scorecard({
  players, scores, potential, selectedCombo, forcedCombo,
  upperSums, upperBonuses, totals, jokerBonuses,
  onSelectCombo, currentPlayer, hasRolled, phase,
}) {
  function cellClass(comboId, pi) {
    const played      = scores[pi][comboId] !== null
    const isSelected  = selectedCombo === comboId && pi === currentPlayer
    const isForced    = forcedCombo   === comboId && pi === currentPlayer
    const isAvailable = potential?.[comboId]?.available && pi === currentPlayer && hasRolled

    if (isForced)    return 'bg-amber-500/30 border border-amber-400 text-amber-200 font-bold cursor-pointer'
    if (isSelected)  return 'bg-emerald-500/30 border border-emerald-400 text-emerald-200 font-bold cursor-pointer'
    if (played)      return 'bg-white/5 text-white/70'
    if (isAvailable) return 'bg-sky-500/15 text-sky-300 cursor-pointer active:bg-sky-500/30'
    return 'text-white/20'
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

  // Ancho de columna según número de jugadores
  const colW  = players.length <= 2 ? 'w-16' : players.length <= 3 ? 'w-14' : 'w-12'
  const colPx = players.length <= 2 ? 64     : players.length <= 3 ? 56     : 48

  const gridCols = `1fr ${players.map(() => `${colPx}px`).join(' ')}`

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-800/60">

      {/* Cabecera */}
      <div className="grid items-center bg-slate-700/60 border-b border-white/10"
           style={{ gridTemplateColumns: gridCols }}>
        <div className="py-2 pl-3 text-xs text-white/30 font-semibold uppercase tracking-wider">Combinación</div>
        {players.map((name, pi) => (
          <div key={pi} className={`text-center py-2 text-xs font-bold truncate px-1 ${pi === currentPlayer && phase === 'playing' ? 'text-amber-300' : 'text-white/40'}`}>
            {name.split(' ')[0]}
          </div>
        ))}
      </div>

      {/* Separador Superior */}
      <div className="px-3 py-1 bg-slate-900/40 border-b border-white/5">
        <span className="text-[10px] text-white/25 uppercase tracking-widest font-bold">Superior</span>
      </div>

      {/* Filas Upper */}
      {UPPER_COMBOS.map((combo, ri) => (
        <div key={combo.id}
          className={`grid items-center border-b border-white/5 ${ri % 2 === 0 ? 'bg-white/[0.03]' : ''}`}
          style={{ gridTemplateColumns: gridCols }}>
          <div className="flex items-center gap-2 pl-3 py-2">
            <MiniDie value={combo.upperValue} />
            <span className="text-white/80 text-sm font-medium">{combo.badge}</span>
          </div>
          {players.map((_, pi) => (
            <div key={pi}
              onClick={() => handleClick(combo.id, pi)}
              className={`h-10 flex items-center justify-center text-sm font-bold rounded-lg mx-1 transition-colors ${cellClass(combo.id, pi)}`}>
              {cellContent(combo.id, pi)}
            </div>
          ))}
        </div>
      ))}

      {/* Bonus upper */}
      <div className="grid items-center bg-slate-900/30 border-b border-white/10"
           style={{ gridTemplateColumns: gridCols }}>
        <div className="pl-3 py-1.5 flex items-center gap-1">
          <span className="text-xs text-amber-400/70 font-bold">Bonus +35</span>
          <span className="text-[10px] text-white/25">(&gt;62)</span>
        </div>
        {players.map((_, pi) => (
          <div key={pi} className="flex flex-col items-center py-1">
            <span className={`text-xs font-bold ${upperBonuses[pi] ? 'text-amber-300' : 'text-white/20'}`}>
              {upperBonuses[pi] ? '+35' : '—'}
            </span>
            <span className="text-[10px] text-white/30">{upperSums[pi]}</span>
          </div>
        ))}
      </div>

      {/* Separador Inferior */}
      <div className="px-3 py-1 bg-slate-900/40 border-b border-white/5">
        <span className="text-[10px] text-white/25 uppercase tracking-widest font-bold">Inferior</span>
      </div>

      {/* Filas Lower */}
      {LOWER_COMBOS.map((combo, ri) => (
        <div key={combo.id}
          className={`grid items-center border-b border-white/5 ${ri % 2 === 0 ? 'bg-white/[0.03]' : ''}`}
          style={{ gridTemplateColumns: gridCols }}>
          <div className="pl-3 py-2 flex items-center gap-1.5">
            <span className="text-white/80 text-sm font-medium">{combo.badge}</span>
            {combo.fixedScore && <span className="text-[10px] text-white/30">({combo.fixedScore})</span>}
          </div>
          {players.map((_, pi) => (
            <div key={pi}
              onClick={() => handleClick(combo.id, pi)}
              className={`h-10 flex items-center justify-center text-sm font-bold rounded-lg mx-1 transition-colors ${cellClass(combo.id, pi)}`}>
              {cellContent(combo.id, pi)}
            </div>
          ))}
        </div>
      ))}

      {/* Bonus Joker */}
      <div className="grid items-center bg-slate-900/30 border-b border-white/10"
           style={{ gridTemplateColumns: gridCols }}>
        <div className="pl-3 py-1.5">
          <span className="text-xs text-purple-300/70 font-bold">🌟 Joker ×100</span>
        </div>
        {players.map((_, pi) => (
          <div key={pi} className="flex items-center justify-center py-1.5">
            <span className={`text-xs font-bold ${jokerBonuses[pi] > 0 ? 'text-purple-300' : 'text-white/20'}`}>
              {jokerBonuses[pi] > 0 ? `+${jokerBonuses[pi] * 100}` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="grid border-t-2 border-amber-400/30 bg-slate-900/50"
           style={{ gridTemplateColumns: gridCols }}>
        <div className="pl-3 py-3 text-xs text-white/30 font-bold uppercase tracking-wider self-center">Total</div>
        {players.map((_, pi) => (
          <div key={pi} className="flex items-center justify-center py-2">
            <span className={`text-xl font-black tabular-nums ${totals[pi] > 0 ? 'text-amber-300' : 'text-white/25'}`}>
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
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="14" height="14" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5"/>
      {(MINI_PIPS[value] || []).map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="1.4" fill="#f59e0b"/>
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
