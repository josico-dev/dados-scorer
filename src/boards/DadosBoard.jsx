// ─── Tablero modo Normal ───────────────────────────────────────────────────
// Solo renderiza. Recibe datos y emite clicks. Sin estado propio.

import { ROWS, SUBTYPES } from '../config'
import { DICE_ICONS } from '../DiceIcons'
import ScoreCell from '../ScoreCell'
import { countDiceForFace } from '../dice/faces'

function playerTotal(scores, pi) {
  return ROWS.reduce((total, row) => {
    const opc = parseFloat(scores[pi]?.[row.id]?.Opc) || 0
    const obl = parseFloat(scores[pi]?.[row.id]?.Obl) || 0
    return total + (opc + obl) * row.value
  }, 0)
}

export default function DadosBoard({
  players, scores, currentPlayer, myPlayerIndex, isOnline,
  diceValues, hasDice, selectedCell,
  onCellClick, onScoreChange,
  theme, isDark,
}) {
  const t = theme ?? {}

  return (
    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto safe-bottom">
      <table className="border-separate border-spacing-0 w-full"
        style={{ minWidth: `${Math.max(320, 80 + players.length * 120)}px` }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-20 w-12 min-w-[48px]" style={{ background: t.headerBg ?? '#0a081e' }} />
            {players.map((name, i) => {
              const isMe = isOnline && i === myPlayerIndex
              const isTurn = i === currentPlayer
              return (
                <th key={i} colSpan={2} className="text-center px-1 pt-2 pb-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="block text-xs font-bold uppercase tracking-wider truncate max-w-[120px]"
                      style={{ color: isTurn ? '#f59e0b' : '#a78bfa' }}>
                      {name}{isTurn ? ' ▶' : ''}
                    </span>
                    {isMe && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>TÚ</span>}
                  </div>
                </th>
              )
            })}
          </tr>
          <tr>
            <th className="sticky left-0 z-20 text-center px-2 py-1 text-[10px] font-medium uppercase w-12 min-w-[48px]"
              style={{ background: t.headerBg ?? '#0a081e', color: t.textMuted }}>Cara</th>
            {players.map((_, pi) =>
              SUBTYPES.map(sub => (
                <th key={`${pi}-${sub.id}`}
                  className="text-center px-1 pb-1 text-[11px] font-bold uppercase tracking-wider w-16 min-w-[56px]"
                  style={{ color: sub.id === 'Opc' ? '#60a5fa' : '#34d399' }}>
                  {sub.label}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, ri) => {
            const suggested = hasDice ? countDiceForFace(row.id, diceValues) : 0
            const sugPts = suggested * row.value

            return (
              <tr key={row.id} style={{ background: ri % 2 === 0 ? t.rowEven : t.rowOdd }}>
                <td className="sticky left-0 z-10 px-1 py-0.5 whitespace-nowrap"
                  style={{ background: ri % 2 === 0 ? (isDark ? '#12102a' : '#eef0fa') : (isDark ? '#0d0b22' : '#f5f7ff') }}>
                  <div className="flex flex-col items-center">
                    <div className="scale-[0.65] origin-center -my-1">{DICE_ICONS[row.id]}</div>
                    <span className="text-[9px] font-medium" style={{ color: t.textFaint }}>({row.value})</span>
                  </div>
                </td>

                {players.map((_, pi) =>
                  SUBTYPES.map(sub => {
                    const cellId = `${pi}-${row.id}-${sub.id}`
                    const canSuggest = hasDice && pi === currentPlayer && suggested > 0
                    const isSel = selectedCell === cellId

                    return (
                      <td key={cellId} className="px-1 py-1">
                        {canSuggest ? (
                          <button
                            onClick={() => onCellClick?.(pi, row.id, sub.id, suggested)}
                            className="w-full rounded-xl py-3 px-1 text-center text-sm font-bold transition-all active:scale-95"
                            style={{
                              background: isSel ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)'),
                              border: isSel ? '2px solid #a78bfa' : `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.25)'}`,
                              color: isSel ? '#fff' : '#a78bfa',
                            }}>
                            {sugPts}
                          </button>
                        ) : (
                          <ScoreCell
                            theme={theme} isDark={isDark}
                            value={scores[pi]?.[row.id]?.[sub.id] ?? ''}
                            faceValue={row.value}
                            onChange={val => onScoreChange?.(pi, row.id, sub.id, val)}
                          />
                        )}
                      </td>
                    )
                  })
                )}
              </tr>
            )
          })}

          <tr style={{ borderTop: '2px solid rgba(167,139,250,0.3)' }}>
            <td className="sticky left-0 z-10 px-2 py-2 text-center"
              style={{ background: isDark ? '#12102a' : '#e8ecf8' }}>
              <span className="text-[10px] font-bold uppercase" style={{ color: '#a78bfa' }}>Total</span>
            </td>
            {players.map((_, pi) => {
              const total = playerTotal(scores, pi)
              return (
                <td key={pi} colSpan={2} className="text-center px-1 py-2"
                  style={{ background: isDark ? '#12102a' : '#e8ecf8' }}>
                  <span className="text-base font-black tabular-nums"
                    style={{ color: total > 0 ? '#a78bfa' : t.textFaint }}>
                    {total || '—'}
                  </span>
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
