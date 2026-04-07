// ─── Tablero modo Dice Party (estilo Yahtzee) ─────────────────────────────
//
// Props:
//   players, scores (array), jokerBonuses
//   theme, isDark
//   currentPlayer, myPlayerIndex, isOnline, phase
//   diceValues, hasRolled
//   potential       — output de calcPotential() | null
//   selectedCombo   — string | null
//   jokerActive, jokerUpperId
//   onComboClick(comboId)

import { useState } from 'react'
import { FACE_COLORS } from '../diceParty/Die'
import { UPPER_COMBOS, LOWER_COMBOS } from '../diceParty/combinations'
import { calcUpperSum } from '../diceParty/scoring'

// ── Mini dado (pip display) ────────────────────────────────────────────────

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

// ── Componente principal ──────────────────────────────────────────────────

export default function DicePartyBoard({
  theme, isDark,
  players, scores, jokerBonuses,
  currentPlayer, myPlayerIndex, isOnline, phase,
  diceValues, hasRolled,
  potential, selectedCombo, jokerActive, jokerUpperId,
  onComboClick,
}) {
  const [infoCombo, setInfoCombo] = useState(null)
  const t = theme ?? {}

  // Proteger contra scores en formato incorrecto (puede llegar {} durante cambio de modo)
  const safeScores = Array.isArray(scores)
    ? scores
    : players.map((_, pi) => safeScores[pi] ?? {})

  const upperSums    = players.map((_, pi) => calcUpperSum(safeScores[pi] ?? {}))
  const upperBonuses = upperSums.map(s => s > 62 ? 35 : 0)

  const forcedCombo = jokerActive && jokerUpperId && (safeScores[currentPlayer]?.[jokerUpperId] ?? null) === null
    ? jokerUpperId
    : null

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
    const played      = (safeScores[pi]?.[comboId] ?? null) !== null
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
    const val = safeScores[pi]?.[comboId] ?? null
    if (val !== null) return val
    if (potential?.[comboId]?.available && pi === currentPlayer && hasRolled)
      return <span className="text-[11px]">{potential[comboId].score}</span>
    return '—'
  }

  function handleClick(comboId, pi) {
    if (pi !== currentPlayer) return
    onComboClick(comboId)
  }

  const colPx    = players.length <= 2 ? 64 : players.length <= 3 ? 56 : 48
  const gridCols = `1fr ${players.map(() => `${colPx}px`).join(' ')}`

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-2">
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

        {/* Sección Superior */}
        <div className="px-3 py-0.5 border-b" style={{ background: sectionBg, borderColor }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Superior</span>
        </div>

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

        {/* Sección Inferior */}
        <div className="px-3 py-0.5 border-b" style={{ background: sectionBg, borderColor }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Inferior</span>
        </div>

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
              <span className="text-xs font-bold" style={{ color: (jokerBonuses[pi] ?? 0) > 0 ? '#c084fc' : textFaint }}>
                {(jokerBonuses[pi] ?? 0) > 0 ? `+${jokerBonuses[pi] * 100}` : '—'}
              </span>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="grid" style={{ gridTemplateColumns: gridCols, background: bonusBg, borderTop: '2px solid rgba(167,139,250,0.3)' }}>
          <div className="pl-3 py-3 text-xs font-bold uppercase tracking-wider self-center" style={{ color: textMuted }}>Total</div>
          {players.map((_, pi) => {
            const { calcTotal } = require('../diceParty/scoring')
            const total = calcTotal(safeScores[pi] ?? {}, jokerBonuses?.[pi] ?? 0)
            return (
              <div key={pi} className="flex items-center justify-center py-2">
                <span className="text-xl font-black tabular-nums" style={{ color: total > 0 ? '#a78bfa' : textFaint }}>
                  {total || '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
