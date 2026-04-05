// ─── Modo Dice Party (estilo Yahtzee) ──────────────────────────────────────
//
// Juego para 2 jugadores con 5 dados y 13 combinaciones.
// Estado guardado en localStorage bajo la clave 'dice-party-state'.

import { useState, useEffect, useCallback } from 'react'
import Die from '../diceParty/Die'
import { UPPER_COMBOS, LOWER_COMBOS, ALL_COMBOS, UPPER_ID_BY_VALUE } from '../diceParty/combinations'
import {
  scoreCombo,
  calcPotential,
  detectJoker,
  calcUpperSum,
  calcTotal,
} from '../diceParty/scoring'

// ── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY  = 'dice-party-state'
const NUM_DICE     = 5
const MAX_ROLLS    = 3
const TOTAL_TURNS  = 13   // combinaciones por jugador → 26 turnos totales
const JOKER_BONUS  = 100
const UPPER_BONUS_THRESHOLD = 62
const UPPER_BONUS_VALUE     = 35
const PLAYER_NAMES = ['Ellos', 'Tú']

// ── Estado inicial ───────────────────────────────────────────────────────────

function emptyPlayerScores() {
  const s = {}
  ALL_COMBOS.forEach(c => { s[c.id] = null }) // null = no jugado aún
  return s
}

function initialState() {
  return {
    currentPlayer : 0,
    scores        : [emptyPlayerScores(), emptyPlayerScores()],
    jokerBonuses  : [0, 0],   // bonus Joker acumulados por jugador
    turn          : 0,        // turno global (0-25)
    // Estado del turno en curso
    dice          : [0, 0, 0, 0, 0],
    locked        : [false, false, false, false, false],
    rollsLeft     : MAX_ROLLS,
    hasRolled     : false,
    selectedCombo : null,
    jokerActive   : false,
    jokerUpperId  : null,
    phase         : 'playing', // 'playing' | 'done'
  }
}

// ── Persistencia ─────────────────────────────────────────────────────────────

function loadDPState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDPState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

// ── Helper: lanza dados no bloqueados ────────────────────────────────────────

function rollDice(dice, locked) {
  return dice.map((d, i) => locked[i] ? d : Math.ceil(Math.random() * 6))
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DicePartyMode({ onExit }) {
  const [gs, setGs]         = useState(() => loadDPState() ?? initialState())
  const [rolling, setRolling] = useState(false)
  const [showReset, setShowReset] = useState(false)

  // Persistir cada vez que cambia el estado del juego
  useEffect(() => { saveDPState(gs) }, [gs])

  // ── Acciones ──────────────────────────────────────────────────────────────

  /** Lanza los dados no bloqueados (animación breve) */
  const handleRoll = useCallback(() => {
    if (rolling || gs.rollsLeft <= 0 || gs.phase !== 'playing') return
    setRolling(true)
    setTimeout(() => {
      setGs(prev => {
        const newDice = rollDice(prev.dice, prev.locked)
        const { jokerActive, jokerUpperId } = detectJoker(newDice, prev.scores[prev.currentPlayer])
        return {
          ...prev,
          dice         : newDice,
          rollsLeft    : prev.rollsLeft - 1,
          hasRolled    : true,
          jokerActive,
          jokerUpperId,
          selectedCombo: null,
        }
      })
      setRolling(false)
    }, 280)
  }, [rolling, gs.rollsLeft, gs.phase])

  /** Bloquea / desbloquea un dado */
  function toggleLock(i) {
    if (!gs.hasRolled || gs.phase !== 'playing') return
    setGs(prev => {
      const locked = [...prev.locked]
      locked[i] = !locked[i]
      return { ...prev, locked }
    })
  }

  /** Selecciona (o deselecciona) una combinación del scorecard */
  function selectCombo(comboId, available) {
    if (!gs.hasRolled || !available || gs.phase !== 'playing') return
    setGs(prev => ({
      ...prev,
      selectedCombo: prev.selectedCombo === comboId ? null : comboId,
    }))
  }

  /** Confirma la jugada con la combinación seleccionada */
  function handlePlay() {
    if (!gs.selectedCombo || !gs.hasRolled) return

    const { jokerActive, jokerUpperId, currentPlayer, scores, dice, jokerBonuses } = gs
    const playerScores = scores[currentPlayer]
    const potential = calcPotential(dice, playerScores, jokerActive, jokerUpperId)
    const entry = potential[gs.selectedCombo]
    if (!entry?.available) return

    // Aplica la puntuación
    const newScores = scores.map((ps, pi) =>
      pi !== currentPlayer ? ps : { ...ps, [gs.selectedCombo]: entry.score }
    )

    // Acumula bonus joker si aplica
    const newJokerBonuses = [...jokerBonuses]
    if (jokerActive) newJokerBonuses[currentPlayer] += 1

    // Avanza turno
    const nextPlayer = currentPlayer === 0 ? 1 : 0
    const nextTurn   = gs.turn + 1
    const gameOver   = nextTurn >= TOTAL_TURNS * 2

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

  /** Reinicia la partida */
  function handleReset() {
    setGs(initialState())
    setShowReset(false)
  }

  // ── Datos derivados ───────────────────────────────────────────────────────

  const {
    currentPlayer, scores, dice, locked, rollsLeft,
    hasRolled, jokerActive, jokerUpperId, selectedCombo, phase,
  } = gs

  const potential = hasRolled
    ? calcPotential(dice, scores[currentPlayer], jokerActive, jokerUpperId)
    : null

  const totals     = [0, 1].map(pi => calcTotal(scores[pi], gs.jokerBonuses[pi]))
  const upperSums  = [0, 1].map(pi => calcUpperSum(scores[pi]))
  const upperBonuses = upperSums.map(s => s > UPPER_BONUS_THRESHOLD ? UPPER_BONUS_VALUE : 0)

  const canRoll = !rolling && rollsLeft > 0 && phase === 'playing'
  const canPlay = hasRolled && selectedCombo !== null && phase === 'playing'

  // Combo forzado por la regla Joker (el upper correspondiente si está libre)
  const forcedCombo = jokerActive && jokerUpperId && scores[currentPlayer][jokerUpperId] === null
    ? jokerUpperId : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white select-none flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-white/10 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎲</span>
          <h1 className="text-sm font-bold tracking-wide text-amber-300">Dice Party</h1>
        </div>
        <div className="flex items-center gap-2">
          {phase !== 'done' && (
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold">
              {PLAYER_NAMES[currentPlayer]} · T{gs.turn + 1}/26
            </span>
          )}
          <button
            onClick={() => setShowReset(true)}
            className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition"
          >
            🔄
          </button>
          <button
            onClick={onExit}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ── Área de juego ── */}
      <div className="flex-1 flex flex-col gap-3 p-3">

        {/* Dados */}
        <div className="flex justify-center gap-2 py-2">
          {dice.map((val, i) => (
            <Die
              key={i}
              value={val}
              locked={locked[i]}
              rolling={rolling}
              onClick={() => toggleLock(i)}
            />
          ))}
        </div>

        {/* Banner Joker */}
        {jokerActive && hasRolled && (
          <div className="mx-auto px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold text-center leading-snug">
            🌟 ¡JOKER! +100 bonus
            {forcedCombo
              ? ` · Debes jugar: ${UPPER_COMBOS.find(c => c.id === forcedCombo)?.label}`
              : ' · Elige una combinación disponible'}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={handleRoll}
            disabled={!canRoll}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition
              bg-amber-500 hover:bg-amber-400 text-black
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🎲 Lanzar {rollsLeft < MAX_ROLLS ? `(${rollsLeft} left)` : ''}
          </button>
          <button
            onClick={handlePlay}
            disabled={!canPlay}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition
              bg-emerald-500 hover:bg-emerald-400 text-black
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✅ JUGAR
          </button>
        </div>

        {/* Scorecard */}
        <Scorecard
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

      {/* ── Modal reset ── */}
      {showReset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowReset(false)}
        >
          <div
            className="bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl max-w-xs w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🔄</div>
            <h2 className="text-white font-bold text-lg mb-2">¿Nueva partida?</h2>
            <p className="text-white/50 text-sm mb-5">Se borrarán todas las puntuaciones.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 font-medium">
                Cancelar
              </button>
              <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition">
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal fin de partida ── */}
      {phase === 'done' && !showReset && (
        <GameOverModal totals={totals} onReset={handleReset} onExit={onExit} />
      )}
    </div>
  )
}

// ── Scorecard ─────────────────────────────────────────────────────────────────
//
// Layout de dos columnas side-by-side: UPPER (izq) | LOWER (der)
// Subcabeceras: ELLOS / TÚ por cada columna
// Compacto para que quepa en pantalla móvil sin scroll.

function Scorecard({
  scores, potential, selectedCombo, forcedCombo,
  upperSums, upperBonuses, totals, jokerBonuses,
  onSelectCombo, currentPlayer, hasRolled, phase,
}) {

  /** Clases CSS de una celda según su estado */
  function cellClass(comboId, playerIdx) {
    const played = scores[playerIdx][comboId] !== null
    const isSelected  = selectedCombo === comboId && playerIdx === currentPlayer
    const isForced    = forcedCombo   === comboId && playerIdx === currentPlayer
    const pot         = potential?.[comboId]
    const isAvailable = pot?.available && playerIdx === currentPlayer && hasRolled

    if (isForced)    return 'bg-amber-500/30 border border-amber-400 text-amber-200 font-bold cursor-pointer'
    if (isSelected)  return 'bg-emerald-500/30 border border-emerald-400 text-emerald-200 font-bold cursor-pointer'
    if (played)      return 'bg-white/5 text-white/70'
    if (isAvailable) return 'bg-sky-500/15 text-sky-300 cursor-pointer active:bg-sky-500/30'
    return 'bg-white/5 text-white/25'
  }

  /** Contenido de una celda */
  function cellContent(comboId, playerIdx) {
    const val = scores[playerIdx][comboId]
    if (val !== null) return <span>{val}</span>
    if (potential && playerIdx === currentPlayer && hasRolled) {
      const pot = potential[comboId]
      if (pot?.available) return <span className="text-sky-300/80 text-[11px]">{pot.score}</span>
    }
    return <span className="text-white/20">—</span>
  }

  function handleClick(comboId, playerIdx) {
    if (playerIdx !== currentPlayer || !hasRolled || phase !== 'playing') return
    const pot = potential?.[comboId]
    if (pot?.available) onSelectCombo(comboId, true)
  }

  // Columna de celdas para un jugador dado
  function PlayerCells({ comboId }) {
    return [0, 1].map(pi => (
      <div
        key={pi}
        onClick={() => handleClick(comboId, pi)}
        className={`w-9 h-7 flex items-center justify-center text-xs font-bold rounded mx-px transition-colors ${cellClass(comboId, pi)}`}
      >
        {cellContent(comboId, pi)}
      </div>
    ))
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-800/60 text-xs">

      {/* ── Cabeceras de sección ── */}
      <div className="grid grid-cols-2 divide-x divide-white/10">
        <div className="bg-slate-700/70 text-center py-1">
          <span className="font-bold text-amber-300 uppercase tracking-widest text-[11px]">Upper</span>
        </div>
        <div className="bg-slate-700/70 text-center py-1">
          <span className="font-bold text-sky-300 uppercase tracking-widest text-[11px]">Lower</span>
        </div>
      </div>

      {/* ── Subcabeceras ELLOS / TÚ ── */}
      <div className="grid grid-cols-2 divide-x divide-white/10 bg-slate-700/40 border-b border-white/10">
        {/* Upper subheader */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center">
          <div className="py-1 pl-2 text-[10px] text-white/30 font-semibold">Combo</div>
          <div className="w-9 text-center py-1 text-[10px] text-slate-400 font-bold">{PLAYER_NAMES[0]}</div>
          <div className="w-9 text-center py-1 pr-1 text-[10px] text-amber-300 font-bold">{PLAYER_NAMES[1]}</div>
        </div>
        {/* Lower subheader */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center">
          <div className="py-1 pl-2 text-[10px] text-white/30 font-semibold">Combo</div>
          <div className="w-9 text-center py-1 text-[10px] text-slate-400 font-bold">{PLAYER_NAMES[0]}</div>
          <div className="w-9 text-center py-1 pr-1 text-[10px] text-amber-300 font-bold">{PLAYER_NAMES[1]}</div>
        </div>
      </div>

      {/* ── Filas de combinaciones (upper | lower en paralelo) ── */}
      {/* Las 6 upper y 7 lower se alinean fila a fila; la última fila lower no tiene par */}
      <div className="divide-y divide-white/5">
        {Array.from({ length: Math.max(UPPER_COMBOS.length, LOWER_COMBOS.length) }).map((_, rowIdx) => {
          const uc = UPPER_COMBOS[rowIdx]
          const lc = LOWER_COMBOS[rowIdx]
          return (
            <div key={rowIdx} className="grid grid-cols-2 divide-x divide-white/10">
              {/* Celda upper */}
              {uc ? (
                <div className="grid grid-cols-[1fr_auto_auto] items-center py-0.5">
                  <div className="flex items-center gap-1 pl-1.5">
                    <MiniDie value={uc.upperValue} />
                    <span className="text-[11px] text-white/70 leading-none">{uc.badge}</span>
                  </div>
                  <PlayerCells comboId={uc.id} />
                </div>
              ) : (
                <div />
              )}

              {/* Celda lower */}
              {lc ? (
                <div className="grid grid-cols-[1fr_auto_auto] items-center py-0.5">
                  <div className="pl-1.5">
                    <span className="text-[11px] text-white/70 leading-none">{lc.badge}</span>
                    {lc.fixedScore && (
                      <span className="text-[9px] text-white/30 ml-1">({lc.fixedScore})</span>
                    )}
                  </div>
                  <PlayerCells comboId={lc.id} />
                </div>
              ) : (
                <div />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Filas de bonus ── */}
      <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 bg-slate-900/30">
        {/* Bonus upper */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center py-1">
          <div className="pl-1.5">
            <span className="text-[10px] text-amber-400 font-bold">Bonus +35</span>
            <span className="text-[9px] text-white/30 block">&gt;62 pts</span>
          </div>
          {[0, 1].map(pi => (
            <div key={pi} className="w-9 flex flex-col items-center">
              <span className={`text-[11px] font-bold ${upperBonuses[pi] ? 'text-amber-300' : 'text-white/25'}`}>
                {upperBonuses[pi] ? '+35' : '—'}
              </span>
              <span className="text-[9px] text-white/30">{upperSums[pi]}</span>
            </div>
          ))}
        </div>

        {/* Bonus joker */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center py-1">
          <div className="pl-1.5">
            <span className="text-[10px] text-purple-300 font-bold">🌟 Joker</span>
            <span className="text-[9px] text-white/30 block">×100 c/u</span>
          </div>
          {[0, 1].map(pi => (
            <div key={pi} className="w-9 flex items-center justify-center">
              <span className={`text-[11px] font-bold ${jokerBonuses[pi] > 0 ? 'text-purple-300' : 'text-white/25'}`}>
                {jokerBonuses[pi] > 0 ? `+${jokerBonuses[pi] * 100}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Totales ── */}
      <div className="grid grid-cols-2 border-t-2 border-amber-400/30 bg-slate-900/50">
        {[0, 1].map(pi => (
          <div key={pi} className={`flex flex-col items-center py-2 ${pi === 0 ? 'border-r border-white/10' : ''}`}>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">{PLAYER_NAMES[pi]}</span>
            <span className={`text-2xl font-black tabular-nums ${totals[pi] > 0 ? 'text-amber-300' : 'text-white/25'}`}>
              {totals[pi] || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mini dado para scorecard ──────────────────────────────────────────────────

const MINI_PIPS = {
  1: [[8, 8]],
  2: [[5, 5], [11, 11]],
  3: [[5, 5], [8, 8], [11, 11]],
  4: [[5, 5], [11, 5], [5, 11], [11, 11]],
  5: [[5, 5], [11, 5], [8, 8], [5, 11], [11, 11]],
  6: [[5, 4], [11, 4], [5, 8], [11, 8], [5, 12], [11, 12]],
}

function MiniDie({ value }) {
  const pips = MINI_PIPS[value] || []
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="14" height="14" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.4" fill="#f59e0b" />
      ))}
    </svg>
  )
}

// ── Modal fin de partida ──────────────────────────────────────────────────────

function GameOverModal({ totals, onReset, onExit }) {
  const winner = totals[0] > totals[1] ? 0 : totals[1] > totals[0] ? 1 : -1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl p-6 border border-amber-400/30 shadow-2xl max-w-xs w-full text-center">
        <div className="text-5xl mb-3">{winner === -1 ? '🤝' : '🏆'}</div>
        <h2 className="text-amber-300 font-black text-xl mb-1">
          {winner === -1 ? '¡Empate!' : `¡Gana ${PLAYER_NAMES[winner]}!`}
        </h2>
        <div className="flex justify-center gap-6 my-4">
          {[0, 1].map(pi => (
            <div key={pi} className="flex flex-col items-center">
              <span className="text-white/50 text-xs">{PLAYER_NAMES[pi]}</span>
              <span className={`text-3xl font-black ${winner === pi ? 'text-amber-300' : 'text-white/60'}`}>
                {totals[pi]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onExit} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 font-medium text-sm">
            Salir
          </button>
          <button onClick={onReset} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition">
            Nueva partida
          </button>
        </div>
      </div>
    </div>
  )
}
