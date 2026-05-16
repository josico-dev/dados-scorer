// ─── Panel de dados — modo Normal y Party ────────────────────────────────

import Die from '../diceParty/Die'
import { PIP_POSITIONS, LOCKED_COLORS } from '../diceParty/dieStyles'
import { NORMAL_VALUE_TO_ID } from './faces'

// Paleta del modo Normal — mismas familias de color que Party para coherencia
// (bg oscuro, borde vivo, glow), pero asociadas por ID de cara (no por valor).
const NORMAL_COLORS = {
  v:  { bg: '#3b0f0f', border: '#ef4444', accent: '#fca5a5', glow: '#ef444488' },
  vi: { bg: '#2e2200', border: '#eab308', accent: '#fde047', glow: '#eab30888' },
  j:  { bg: '#0f1f3b', border: '#3b82f6', accent: '#93c5fd', glow: '#3b82f688' },
  q:  { bg: '#0f2e1a', border: '#22c55e', accent: '#86efac', glow: '#22c55e88' },
  k:  { bg: '#1f0f3b', border: '#a855f7', accent: '#d8b4fe', glow: '#a855f788' },
  as: { bg: '#2a0f2e', border: '#ec4899', accent: '#ef4444', glow: '#ec489988' },
}
const NORMAL_NEUTRAL = { bg: '#1e293b', border: '#475569', accent: '#475569', glow: '#47556944' }

// Símbolo de cada cara del modo Normal, dibujado en viewBox 60x60
function renderNormalFace(id, c) {
  switch (id) {
    case 'as':
      return <circle cx="30" cy="30" r="13" fill={c.accent} />
    case 'k':
    case 'q':
    case 'j':
      return (
        <text x="30" y="43" textAnchor="middle" fontSize="34"
          fill={c.accent} fontWeight="bold" fontFamily="serif">
          {id.toUpperCase()}
        </text>
      )
    case 'vi': // 6 puntos (mismas posiciones que el pip 6 de Party)
      return PIP_POSITIONS[6].map(([cx, cy], i) =>
        <circle key={i} cx={cx} cy={cy} r="5.5" fill={c.accent} />)
    case 'v':  // 5 puntos (mismas posiciones que el pip 5 de Party)
      return PIP_POSITIONS[5].map(([cx, cy], i) =>
        <circle key={i} cx={cx} cy={cy} r="5.5" fill={c.accent} />)
    default:
      return null
  }
}

// Dado del modo Normal — misma estructura visual que Die de Party,
// con sus propios símbolos por cara (AS, K, Q, J, VI, V).
function NormalDie({ value, locked, rolling, rollKey, onClick, size = 70 }) {
  const id     = value ? NORMAL_VALUE_TO_ID[value] : null
  const colors = locked ? LOCKED_COLORS : (id ? NORMAL_COLORS[id] : NORMAL_NEUTRAL)
  const gradId = `gn-${id ?? 'na'}-${locked ? 'l' : 'u'}`

  return (
    <button
      onClick={onClick}
      className="relative touch-manipulation select-none focus:outline-none"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-label={id ? `Cara ${id.toUpperCase()}${locked ? ' (bloqueado)' : ''}` : 'Dado'}
    >
      <svg
        key={rollKey}
        viewBox="0 0 60 60"
        width={size}
        height={size}
        className={rolling && !locked ? 'die-spinning' : ''}
        style={{
          display: 'block',
          filter: `drop-shadow(0 0 ${locked ? 10 : 6}px ${colors.glow})`,
          opacity: id ? 1 : 0.35,
          transition: 'filter 0.3s, opacity 0.2s',
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="54" height="54" rx="12"
          fill={colors.bg} stroke={colors.border} strokeWidth="3.5" />
        <rect x="3" y="3" width="54" height="54" rx="12" fill={`url(#${gradId})`} />
        {id
          ? renderNormalFace(id, colors)
          : <text x="30" y="38" textAnchor="middle" fontSize="22"
              fill="#475569" fontWeight="bold">?</text>
        }
      </svg>

      {locked && (
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
          style={{ fontSize: 12, color: '#000' }}>🔒</div>
      )}
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
              rollKey={rollCount} onClick={() => onToggleLock?.(i)} size={dieSize} />
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
