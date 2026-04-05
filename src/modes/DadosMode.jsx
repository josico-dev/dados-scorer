// ─── Modo Dados ───────────────────────────────────────────────────────────────

import { ROWS, SUBTYPES } from '../config'
import { DICE_ICONS } from '../DiceIcons'
import { playerTotal } from '../helpers'
import ScoreCell from '../ScoreCell'
import PlayersModal from '../PlayersModal'
import ResetModal from '../ResetModal'

// Mapeo de id de fila → valor de cara del dado (para calcular sugerencia)
// AS=6, K=5, Q=4, J=3, VI=2, V=1 — coincide con el número de pips del dado
const ROW_DICE_VALUE = { as: 6, k: 5, q: 4, j: 3, vi: 2, v: 1 }

/**
 * Calcula cuántos dados tienen el valor de una cara y devuelve la puntuación sugerida.
 * Ej: cara AS (valor 6), dados [6,6,3,6,1] → 3 dados → 3 es el número de dados
 * El usuario apunta el número de dados, y la celda multiplica por el valor de cara.
 */
function suggestDice(rowId, rollerDice) {
  const faceNum = ROW_DICE_VALUE[rowId]  // qué número de dado corresponde a esta cara
  const count = rollerDice.filter(d => d === faceNum).length
  return count  // número de dados a apuntar
}

export default function DadosMode({
  theme, isDark,
  players, scores, showPlayersModal, showResetModal,
  onUpdateScore, onOpenPlayers, onOpenReset,
  onClosePlayers, onCloseReset, onSavePlayers, onResetScores,
  diceActive, rollerDice,
}) {
  const t = theme ?? {}

  // Estado para saber qué celda tiene una sugerencia seleccionada (pi-rowId-subId)
  // null = ninguna seleccionada
  const [pendingCell, setPendingCell] = useState(null)

  // Cuando los dados cambian o se desactivan, limpia la selección
  // (lo gestiona el usuario)

  function handleCellClick(pi, rowId, subId) {
    if (!diceActive) return // sin dados activos → comportamiento normal
    const suggested = suggestDice(rowId, rollerDice)
    if (suggested === 0) return // ningún dado de esa cara
    const key = `${pi}-${rowId}-${subId}`
    if (pendingCell === key) {
      // Segundo clic → apuntar
      onUpdateScore(pi, rowId, subId, String(suggested))
      setPendingCell(null)
    } else {
      // Primer clic → seleccionar
      setPendingCell(key)
    }
  }

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
              {players.map((name, i) => (
                <th key={i} colSpan={2} className="text-center px-1 pt-2 pb-1">
                  <span className="block text-xs font-bold uppercase tracking-wider truncate max-w-[120px] mx-auto"
                    style={{ color: '#a78bfa' }}>
                    {name}
                  </span>
                </th>
              ))}
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
              // Puntuación sugerida para esta fila (número de dados de esa cara)
              const suggested = diceActive ? suggestDice(row.id, rollerDice) : 0

              return (
                <tr key={row.id} style={{ background: rowIndex % 2 === 0 ? t.rowEven : t.rowOdd }}>
                  {/* Icono de la cara */}
                  <td className="sticky left-0 z-10 px-1 py-0.5 whitespace-nowrap"
                    style={{ background: rowIndex % 2 === 0 ? (isDark ? '#12102a' : '#eef0fa') : (isDark ? '#0d0b22' : '#f5f7ff') }}>
                    <div className="flex flex-col items-center">
                      <div className="scale-[0.65] origin-center -my-1">{DICE_ICONS[row.id]}</div>
                      <span className="text-[9px] font-medium" style={{ color: t.textFaint }}>({row.value})</span>
                    </div>
                  </td>

                  {/* Celdas de puntuación */}
                  {players.map((_, pi) =>
                    SUBTYPES.map(sub => {
                      const key = `${pi}-${row.id}-${sub.id}`
                      const isPending = pendingCell === key
                      const hasSuggestion = diceActive && suggested > 0

                      return (
                        <td key={`${pi}-${sub.id}`} className="px-1 py-1">
                          {hasSuggestion ? (
                            // Modo dados activo: celda clicable con sugerencia
                            <button
                              onClick={() => handleCellClick(pi, row.id, sub.id)}
                              className="w-full rounded-xl py-3 px-1 text-center text-sm font-bold transition-all active:scale-95"
                              style={{
                                background: isPending
                                  ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                                  : (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)'),
                                border: isPending
                                  ? '2px solid #a78bfa'
                                  : `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.25)'}`,
                                color: isPending ? '#fff' : '#a78bfa',
                              }}>
                              {isPending ? `✓ ${suggested}×${row.value}=${suggested * row.value}` : `${suggested}×${row.value}`}
                            </button>
                          ) : (
                            // Modo normal: input editable
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

            {/* Total */}
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
