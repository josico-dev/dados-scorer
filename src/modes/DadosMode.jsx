// ─── Modo Dados ───────────────────────────────────────────────────────────────

import { ROWS, SUBTYPES } from '../config'
import { DICE_ICONS } from '../DiceIcons'
import { playerTotal } from '../helpers'
import ScoreCell from '../ScoreCell'
import PlayersModal from '../PlayersModal'
import ResetModal from '../ResetModal'

export default function DadosMode({
  players, scores, showPlayersModal, showResetModal,
  onUpdateScore, onOpenPlayers, onOpenReset,
  onClosePlayers, onCloseReset, onSavePlayers, onResetScores,
}) {
  return (
    <>
      {/* Scroll solo horizontal, la tabla ocupa su tamaño natural */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table
          className="border-separate border-spacing-0 w-full"
          style={{ minWidth: `${Math.max(320, 80 + players.length * 120)}px` }}
        >
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 w-12 min-w-[48px]" />
              {players.map((name, i) => (
                <th key={i} colSpan={2} className="text-center px-1 pt-2 pb-1">
                  <span className="block text-xs font-bold text-amber-300 uppercase tracking-wider truncate max-w-[120px] mx-auto">
                    {name}
                  </span>
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 text-center px-2 py-1 text-[10px] text-white/40 font-medium uppercase w-12 min-w-[48px]">
                Cara
              </th>
              {players.map((_, pi) =>
                SUBTYPES.map(sub => (
                  <th key={`${pi}-${sub.id}`}
                    className={`text-center px-1 pb-1 text-[11px] font-bold uppercase tracking-wider w-16 min-w-[56px] ${sub.id === 'Opc' ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {sub.label}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row, rowIndex) => (
              <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}>
                <td className={`sticky left-0 z-10 px-1 py-0.5 whitespace-nowrap ${rowIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'}`}>
                  <div className="flex flex-col items-center">
                    <div className="scale-[0.65] origin-center -my-1">{DICE_ICONS[row.id]}</div>
                    <span className="text-[9px] text-white/40">({row.value})</span>
                  </div>
                </td>
                {players.map((_, pi) =>
                  SUBTYPES.map(sub => (
                    <td key={`${pi}-${sub.id}`} className="px-1 py-1">
                      <ScoreCell
                        value={scores[pi]?.[row.id]?.[sub.id] ?? ''}
                        faceValue={row.value}
                        onChange={val => onUpdateScore(pi, row.id, sub.id, val)}
                      />
                    </td>
                  ))
                )}
              </tr>
            ))}

            <tr className="border-t-2 border-amber-400/40">
              <td className="sticky left-0 z-10 bg-slate-800 px-2 py-2 text-center">
                <span className="text-[10px] font-bold text-amber-300 uppercase">Total</span>
              </td>
              {players.map((_, pi) => {
                const total = playerTotal(scores, pi)
                return (
                  <td key={pi} colSpan={2} className="text-center px-1 py-2 bg-slate-800">
                    <span className={`text-base font-black tabular-nums ${total > 0 ? 'text-amber-300' : 'text-white/40'}`}>
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
