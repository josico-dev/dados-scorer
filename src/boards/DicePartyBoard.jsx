// ─── Tablero modo Dice Party ───────────────────────────────────────────────
// Solo renderiza el scorecard. Sin estado propio.

import { useState } from 'react'
import { FACE_COLORS } from '../diceParty/Die'
import { UPPER_COMBOS, LOWER_COMBOS } from '../diceParty/combinations'
import { calcPotential, calcUpperSum, calcTotal } from '../diceParty/scoring'

// ── Mini dado ─────────────────────────────────────────────────────────────

const MINI_PIPS = {
  1: [[8,8]], 2: [[5,5],[11,11]], 3: [[5,5],[8,8],[11,11]],
  4: [[5,5],[11,5],[5,11],[11,11]], 5: [[5,5],[11,5],[8,8],[5,11],[11,11]],
  6: [[5,4],[11,4],[5,8],[11,8],[5,12],[11,12]],
}

function MiniDie({ value }) {
  const c = FACE_COLORS[value] ?? FACE_COLORS[0]
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="14" height="14" rx="3" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      {(MINI_PIPS[value] || []).map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="1.5" fill={c.pip}/>)}
    </svg>
  )
}

// ── Info Modal ────────────────────────────────────────────────────────────

function InfoModal({ combo, onClose }) {
  if (!combo) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl p-5 border border-white/10 shadow-2xl max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-base">{combo.label}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">✕</button>
        </div>
        {combo.info && (
          <div className="space-y-3">
            <div><div className="text-[10px] text-white/40 uppercase mb-1">Requisito</div><div className="text-sm text-white/80">{combo.info.req}</div></div>
            <div><div className="text-[10px] text-white/40 uppercase mb-1">Puntuación</div><div className="text-sm text-emerald-300 font-medium">{combo.info.score}</div></div>
            <div className="bg-slate-700/60 rounded-xl px-3 py-2"><div className="text-[10px] text-white/40 uppercase mb-1">Ejemplo</div><div className="text-sm text-amber-300 font-mono">{combo.info.example}</div></div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────

export default function DicePartyBoard({
  players, scores, jokerBonuses,
  currentPlayer, myPlayerIndex, isOnline,
  diceValues, hasRolled, selectedCombo, forcedCombo,
  jokerActive, jokerUpperId,
  onComboClick,
  theme, isDark, phase = 'playing',
}) {
  const [infoCombo, setInfoCombo] = useState(null)
  const t = theme ?? {}

  const potential    = hasRolled ? calcPotential(diceValues, scores[currentPlayer], jokerActive, jokerUpperId) : null
  const upperSums    = players.map((_, pi) => calcUpperSum(scores[pi]))
  const upperBonuses = upperSums.map(s => s > 62 ? 35 : 0)
  const totals       = players.map((_, pi) => calcTotal(scores[pi], jokerBonuses?.[pi] ?? 0))

  // Colores adaptativos
  const cardBg      = t.scorecardBg ?? 'rgba(15,12,40,0.85)'
  const cardBorder  = t.scorecardBorder ?? 'rgba(99,102,241,0.2)'
  const headerBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const sectionBg   = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.05)'
  const bonusBg     = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'
  const rowEvenBg   = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const textMain    = t.text ?? '#f1f5f9'
  const textMuted   = t.textMuted ?? 'rgba(255,255,255,0.4)'
  const textFaint   = t.textFaint ?? 'rgba(255,255,255,0.2)'

  function cellStyle(comboId, pi) {
    const played    = scores[pi]?.[comboId] !== null && scores[pi]?.[comboId] !== undefined
    const isSel     = selectedCombo === comboId && pi === currentPlayer
    const isForced  = forcedCombo === comboId && pi === currentPlayer
    const isAvail   = potential?.[comboId]?.available && pi === currentPlayer && hasRolled
    if (isForced) return { background: 'rgba(245,158,11,0.25)', border: '1px solid #f59e0b', color: '#fde68a', cursor: 'pointer', fontWeight: 'bold' }
    if (isSel)    return { background: 'rgba(34,197,94,0.2)', border: '1px solid #22c55e', color: '#86efac', cursor: 'pointer', fontWeight: 'bold' }
    if (played)   return { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: textMain }
    if (isAvail)  return { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', cursor: 'pointer' }
    return { color: textFaint }
  }

  function cellContent(comboId, pi) {
    const val = scores[pi]?.[comboId]
    if (val !== null && val !== undefined) return val
    if (potential?.[comboId]?.available && pi === currentPlayer && hasRolled)
      return <span className="text-[11px]">{potential[comboId].score}</span>
    return '—'
  }

  const colPx    = players.length <= 2 ? 64 : players.length <= 3 ? 56 : 48
  const gridCols = `1fr ${players.map(() => `${colPx}px`).join(' ')}`

  function ComboRow({ combo, ri }) {
    return (
      <div className="grid items-center border-b"
        style={{ gridTemplateColumns: gridCols, background: ri % 2 === 0 ? rowEvenBg : 'transparent', borderColor }}>
        <div className="flex items-center gap-2 pl-3 py-2">
          {combo.upperValue && <MiniDie value={combo.upperValue} />}
          <span className="text-sm font-medium" style={{ color: textMain }}>{combo.badge}</span>
          {combo.fixedScore && <span className="text-[10px]" style={{ color: textFaint }}>({combo.fixedScore})</span>}
          {combo.info && (
            <button onClick={e => { e.stopPropagation(); setInfoCombo(combo) }}
              className="ml-auto mr-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: textMuted }}>ⓘ</button>
          )}
        </div>
        {players.map((_, pi) => (
          <div key={pi} onClick={() => onComboClick?.(combo.id, pi)}
            className="h-9 flex items-center justify-center text-sm font-bold rounded-lg mx-1 transition-all"
            style={cellStyle(combo.id, pi)}>
            {cellContent(combo.id, pi)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      {/* Header */}
      <div className="grid items-center border-b" style={{ gridTemplateColumns: gridCols, background: headerBg, borderColor }}>
        <div className="py-2 pl-3 text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Combinación</div>
        {players.map((name, pi) => {
          const isMe = isOnline && pi === myPlayerIndex
          const isTurn = pi === currentPlayer && phase === 'playing'
          return (
            <div key={pi} className="flex flex-col items-center py-1 px-1 gap-0.5">
              <span className="text-xs font-bold truncate max-w-full" style={{ color: isTurn ? '#f59e0b' : textMuted }}>
                {name}{isTurn ? ' ▶' : ''}
              </span>
              {isMe && <span className="text-[8px] font-bold px-1 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>TÚ</span>}
            </div>
          )
        })}
      </div>

      {/* Superior */}
      <div className="px-3 py-0.5 border-b" style={{ background: sectionBg, borderColor }}>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Superior</span>
      </div>
      {UPPER_COMBOS.map((c, i) => <ComboRow key={c.id} combo={c} ri={i} />)}

      {/* Bonus upper */}
      <div className="grid items-center border-b" style={{ gridTemplateColumns: gridCols, background: bonusBg, borderColor }}>
        <div className="pl-3 py-1.5 flex items-center gap-1">
          <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Bonus +35</span>
          <span className="text-[10px]" style={{ color: textFaint }}>(&gt;62)</span>
        </div>
        {players.map((_, pi) => (
          <div key={pi} className="flex flex-col items-center py-1">
            <span className="text-xs font-bold" style={{ color: upperBonuses[pi] ? '#f59e0b' : textFaint }}>{upperBonuses[pi] ? '+35' : '—'}</span>
            <span className="text-[9px]" style={{ color: textFaint }}>{upperSums[pi]}</span>
          </div>
        ))}
      </div>

      {/* Inferior */}
      <div className="px-3 py-0.5 border-b" style={{ background: sectionBg, borderColor }}>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Inferior</span>
      </div>
      {LOWER_COMBOS.map((c, i) => <ComboRow key={c.id} combo={c} ri={i} />)}

      <InfoModal combo={infoCombo} onClose={() => setInfoCombo(null)} />

      {/* Joker */}
      <div className="grid items-center border-b" style={{ gridTemplateColumns: gridCols, background: bonusBg, borderColor }}>
        <div className="pl-3 py-1.5"><span className="text-xs font-bold" style={{ color: '#c084fc' }}>🌟 Joker ×100</span></div>
        {players.map((_, pi) => (
          <div key={pi} className="flex items-center justify-center py-1.5">
            <span className="text-xs font-bold" style={{ color: (jokerBonuses?.[pi] ?? 0) > 0 ? '#c084fc' : textFaint }}>
              {(jokerBonuses?.[pi] ?? 0) > 0 ? `+${jokerBonuses[pi] * 100}` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="grid" style={{ gridTemplateColumns: gridCols, background: bonusBg, borderTop: '2px solid rgba(167,139,250,0.3)' }}>
        <div className="pl-3 py-3 text-xs font-bold uppercase tracking-wider self-center" style={{ color: textMuted }}>Total</div>
        {players.map((_, pi) => (
          <div key={pi} className="flex items-center justify-center py-2">
            <span className="text-xl font-black tabular-nums" style={{ color: totals[pi] > 0 ? '#a78bfa' : textFaint }}>{totals[pi] || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
