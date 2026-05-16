// ─── Panel de dados — modo Normal y Party ────────────────────────────────

import Die from '../diceParty/Die'
import { DICE_ICONS } from '../DiceIcons'
import { NORMAL_VALUE_TO_ID } from './faces'

// Dado del modo normal (icono del scoreboard)
function NormalDie({ value, locked, rolling, rollKey, onClick }) {
  const icon = value ? DICE_ICONS[NORMAL_VALUE_TO_ID[value]] : null
  return (
    <button onClick={onClick} className="relative touch-manipulation select-none focus:outline-none" style={{ width: 70, height: 70 }}>
      <div key={rollKey} className={rolling && !locked ? 'die-spinning' : ''}
        style={{ width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: locked ? 'drop-shadow(0 0 8px #ffffff99) brightness(1.3) saturate(0)' : 'none',
          opacity: value ? 1 : 0.35, transition: 'filter 0.2s, opacity 0.2s',
          transform: 'scale(2)', transformOrigin: 'center' }}>
        {icon ?? (
          <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
            <rect x="2" y="2" width="44" height="44" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2.5"/>
            <text x="24" y="32" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">?</text>
          </svg>
        )}
      </div>
      {locked && <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow"
        style={{ fontSize: 12, color: '#000', zIndex: 10 }}>🔒</div>}
    </button>
  )
}

export default function DicePanel({
  dice, locked, rolling, rollsLeft, rollCount,
  onRoll, onToggleLock, onPlay, canPlay,
  isMyTurn = true,
  mode = 'party',   // 'normal' | 'party'
  theme, isDark,
}) {
  const t = theme ?? {}
  const dieSize = 70

  return (
    <div className="flex flex-col gap-2.5 safe-bottom px-2 pt-1.5">

      {/* Dados */}
      <div className="flex justify-center gap-2 items-center">
        {(dice ?? []).map((val, i) =>
          mode === 'normal' ? (
            <NormalDie key={i} value={val} locked={(locked ?? [])[i]} rolling={rolling}
              rollKey={rollCount} onClick={() => onToggleLock?.(i)} />
          ) : (
            <Die key={i} value={val} locked={(locked ?? [])[i]} rolling={rolling}
              rollKey={rollCount} onClick={() => onToggleLock?.(i)} size={dieSize} />
          )
        )}
      </div>

      {/* Controles */}
      <div className="flex gap-2 items-center">
        <button
          onClick={onRoll}
          disabled={rolling || (rollsLeft ?? 0) <= 0 || !isMyTurn}
          className="flex-1 py-3.5 rounded-xl font-bold text-lg transition disabled:opacity-40 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#000' }}>
          {isMyTurn
            ? `🎲 Lanzar${(rollCount ?? 0) > 0 ? ` (${rollsLeft})` : ''}`
            : '⏳ Esperando...'}
        </button>

        {onPlay && (
          <button
            onClick={onPlay}
            disabled={!canPlay || !isMyTurn}
            className="flex-1 py-3.5 rounded-xl font-black text-lg transition active:scale-95 disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: '#000' }}>
            ✅ JUGAR
          </button>
        )}

        {/* Contador 1-2-3 */}
        <div className="flex gap-1">
          {[1, 2, 3].map(n => (
            <div key={n} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
              style={{
                background: (rollCount ?? 0) >= n ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                color: (rollCount ?? 0) >= n ? '#000' : (t.textMuted ?? '#666'),
              }}>
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
