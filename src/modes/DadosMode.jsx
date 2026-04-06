// ─── Modo Dados ───────────────────────────────────────────────────────────────

import { useState } from 'react'
import { ROWS, SUBTYPES } from '../config'
import { DICE_ICONS } from '../DiceIcons'
import { playerTotal } from '../helpers'
import ScoreCell from '../ScoreCell'
import PlayersModal from '../PlayersModal'
import ResetModal from '../ResetModal'

const ROW_DICE_VALUE = { as: 6, k: 5, q: 4, j: 3, vi: 2, v: 1 }

// AS (valor 6) es comodín — cuenta para cualquier fila excepto la del propio AS
function suggestDice(rowId, rollerDice) {
  const faceNum  = ROW_DICE_VALUE[rowId]
  const AS_VALUE = 6
  return rollerDice.filter(d =>
    d === faceNum || (d === AS_VALUE && rowId !== 'as')
  ).length
}

export default function DadosMode({
  theme, isDark,
  players, scores, showPlayersModal, showResetModal,
  onUpdateScore, onClosePlayers, onCloseReset, onSavePlayers, onResetScores,
  diceActive, rollerDice, currentPlayer, onPlay, onSelectionChange,
  myPlayerIndex, isOnline,
}) {
  const t = theme ?? {}

  const [selected, setSelected] = useState(null)

  function handleCellClick(pi, rowId, subId) {
    if (!diceActive || pi !== currentPlayer) return
    // Online: solo puedes jugar en tu propia columna cuando es tu turno
    if (isOnline && myPlayerIndex !== null && pi !== myPlayerIndex) return
    const count = suggestDice(rowId, rollerDice)
    if (count === 0) return
    const next = { pi, rowId, subId, value: count }
    setSelected(next)
    onSelectionChange?.(next)
  }

  function cellKey(pi, rowId, subId) { return `${pi}-${rowId}-${subId}` }

  return (
    <>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto safe-bottom">
        <table
          className="border-separate border-spacing-0 w-full"
          style={{ minWidth: `${Math.max(320, 80 + players.length * 120)}px` }}
        >
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-12 min-w-[48px]"
                style={{ background: t.headerBg ?? '#0a081e' }} />
              {players.map((name, i) => {
                const isMe      = isOnline && i === myPlayerIndex
                const isMyTurn  = i === currentPlayer
                return (
                  <th key={i} colSpan={2} className="text-center px-1 pt-2 pb-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="block text-xs font-bold uppercase tracking-wider truncate max-w-[120px]"
                        style={{ color: isMyTurn ? '#f59e0b' : '#a78bfa' }}>
                        {name}{isMyTurn ? ' ▶' : ''}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>TÚ</span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
            <tr>
              <th className="sticky left-0 z-20 text-center px-2 py-1 text-[10px] font-medium uppercase w-12 min-w-[48px]"
                style={{ background: t.headerBg ?? '#0a081e', color: t.textMuted }}>
                Cara
              </th>
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
            {ROWS.map((row, rowIndex) => {
              const suggested = diceActive ? suggestDice(row.id, rollerDice) : 0
              const suggestedPts = suggested * row.value

              return (
                <tr key={row.id} style={{ background: rowIndex % 2 === 0 ? t.rowEven : t.rowOdd }}>
                  <td className="sticky left-0 z-10 px-1 py-0.5 whitespace-nowrap"
                    style={{ background: rowIndex % 2 === 0 ? (isDark ? '#12102a' : '#eef0fa') : (isDark ? '#0d0b22' : '#f5f7ff') }}>
                    <div className="flex flex-col items-center">
                      <div className="scale-[0.65] origin-center -my-1">{DICE_ICONS[row.id]}</div>
                      <span className="text-[9px] font-medium" style={{ color: t.textFaint }}>({row.value})</span>
                    </div>
                  </td>

                  {players.map((_, pi) =>
                    SUBTYPES.map(sub => {
                      const key      = cellKey(pi, row.id, sub.id)
                      const isMe     = diceActive && pi === currentPlayer
                      const hasSugg  = isMe && suggested > 0
                      const isSel    = selected && cellKey(selected.pi, selected.rowId, selected.subId) === key

                      return (
                        <td key={`${pi}-${sub.id}`} className="px-1 py-1">
                          {hasSugg ? (
                            <button
                              onClick={() => handleCellClick(pi, row.id, sub.id)}
                              className="w-full rounded-xl py-3 px-1 text-center text-sm font-bold transition-all active:scale-95"
                              style={{
                                background: isSel
                                  ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                                  : (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)'),
                                border: isSel
                                  ? '2px solid #a78bfa'
                                  : `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.25)'}`,
                                color: isSel ? '#fff' : '#a78bfa',
                              }}>
                              {/* Mostramos puntuación final para que sea claro, pero guardamos nº dados */}
                              {suggestedPts}
                            </button>
                          ) : (
                            <ScoreCell
                              theme={theme}
                              isDark={isDark}
                              value={scores[pi]?.[row.id]?.[sub.id] ?? ''}
                              faceValue={row.value}
                              onChange={val => onUpdateScore(pi, row.id, sub.id, val)}
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

      {showPlayersModal && <PlayersModal players={players} onSave={onSavePlayers} onClose={onClosePlayers} />}
      {showResetModal   && <ResetModal   onConfirm={onResetScores}              onClose={onCloseReset}   />}
    </>
  )
}
