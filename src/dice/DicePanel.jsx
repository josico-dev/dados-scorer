// ─── Panel de dados unificado ─────────────────────────────────────────────
//
// Modo normal:  muestra iconos SVG del scorecard (DICE_ICONS)
// Modo party:   muestra dados con pips (Die.jsx)
//
// Props:
//   diceHook     — output de useDice()
//   mode         — 'dados' | 'dice-party'
//   isMyTurn     — bool
//   canPlay      — bool (hay selección confirmada)
//   playerName   — nombre del jugador actual (para mensaje de espera)
//   onPlay       — callback al pulsar JUGAR
//   theme, isDark

import Die, { FACE_COLORS } from './Die'
import { DICE_ICONS } from '../DiceIcons'
import { NORMAL_VALUE_TO_ID } from './faces'

// Dado modo normal usando iconos del scorecard
function NormalDie({ value, locked, rolling, onClick, size = 52 }) {
  const icon = value ? DICE_ICONS[NORMAL_VALUE_TO_ID[value]] : null
  return (
    <button
      onClick={onClick}
      className="relative touch-manipulation select-none focus:outline-none"
      style={{ width: size, height: size }}
    >
      <div
        className={rolling && !locked ? 'die-spinning' : ''}
        style={{
          width: size, height: size,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: locked
            ? 'drop-shadow(0 0 8px #ffffff99) brightness(1.3) saturate(0)'
            : 'none',
          opacity: value ? 1 : 0.35,
          transition: 'filter 0.2s, opacity 0.2s',
          transform: 'scale(1.44)',
          transformOrigin: 'center',
        }}
      >
        {icon ?? (
          <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
            <rect x="2" y="2" width="44" height="44" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2.5"/>
            <text x="24" y="32" textAnchor="middle" fontSize="20" fill="#475569" fontWeight="bold">?</text>
          </svg>
        )}
      </div>
      {locked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow"
          style={{ fontSize: 8, color: '#000', zIndex: 10 }}>🔒</div>
      )}
    </button>
  )
}

export default function DicePanel({
  diceHook,
  mode = 'dados',
  isMyTurn = true,
  canPlay = false,
  playerName = '',
  onPlay,
  theme,
  isDark,
}) {
  const { dice, locked, rolling, rollsLeft, hasRolled, maxRolls, roll, toggleLock } = diceHook
  const t = theme ?? {}
  const rollsDone = maxRolls - rollsLeft

  const isParty = mode === 'dice-party'

  return (
    <div className="mx-3 mb-3 rounded-2xl p-3 flex flex-col gap-2"
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}>

      {/* Dados */}
      <div className="flex justify-center gap-2 items-center" style={{ height: isParty ? 64 : 58 }}>
        {dice.map((val, i) =>
          isParty
            ? <Die key={i} index={i} value={val} locked={locked[i]} rolling={rolling} onClick={() => toggleLock(i)} size={56} />
            : <NormalDie key={i} value={val} locked={locked[i]} rolling={rolling} onClick={() => toggleLock(i)} size={52} />
        )}
      </div>

      {/* Botones + contador */}
      <div className="flex gap-2 items-center">
        <button
          onClick={roll}
          disabled={rolling || rollsLeft <= 0 || !isMyTurn}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#000' }}>
          {isMyTurn
            ? `🎲 Lanzar${rollsDone > 0 ? ` (${rollsLeft})` : ''}`
            : `⏳ ${playerName || 'Esperando...'}`}
        </button>

        {onPlay !== undefined && (
          <button
            onClick={onPlay}
            disabled={!canPlay}
            className="flex-1 py-2.5 rounded-xl font-black text-sm transition active:scale-95 disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: '#000' }}>
            ✅ JUGAR
          </button>
        )}

        {/* Indicadores de tirada */}
        <div className="flex gap-1">
          {Array.from({ length: maxRolls }, (_, n) => (
            <div key={n}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
              style={{
                background: rollsDone > n ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                color: rollsDone > n ? '#000' : (t.textMuted ?? 'rgba(255,255,255,0.3)'),
              }}>
              {n + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
