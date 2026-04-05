// ─── Modo Dados (juego original) ────────────────────────────────────────────
//
// Extraído de App.jsx. Recibe props del componente padre para gestionar
// el estado de jugadores y puntuaciones.

import { ROWS, SUBTYPES } from '../config'
import { DICE_ICONS } from '../DiceIcons'
import { playerTotal } from '../helpers'
import ScoreCell from '../ScoreCell'
import PlayersModal from '../PlayersModal'
import ResetModal from '../ResetModal'

export default function DadosMode({
  players,
  scores,
  showPlayersModal,
  showResetModal,
  onUpdateScore,
  onOpenPlayers,
  onOpenReset,
  onClosePlayers,
  onCloseReset,
  onSavePlayers,
  onResetScores,
}) {
  return (
    <>
      {/* ── Tabla de puntuaciones ── */}
      <div className="overflow-x-auto pb-6">
        <table
          className="border-separate border-spacing-0 w-full"
          style={{ minWidth: `${Math.max(320, 80 + players.length * 120)}px` }}
        >
          <thead>
            {/* Fila con nombres de jugadores */}
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 w-12 min-w-[48px]" />
              {players.map((name, i) => (
                <th key={i} colSpan={2} className="text-center px-1 pt-3 pb-1">
                  <span className="block text-sm font-bold text-amber-300 uppercase tracking-wider truncate max-w-[120px] mx-auto">
                    {name}
                  </span>
                </th>
              ))}
            </tr>

            {/* Fila con Opcional / Obligado por cada jugador */}
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 text-center px-2 py-1 text-[10px] text-white/40 font-medium uppercase w-12 min-w-[48px]">
                Cara
              </th>
              {players.map((_, pi) =>
                SUBTYPES.map(sub => (
                  <th
                    key={`${pi}-${sub.id}`}
                    className={`text-center px-1 pb-2 text-xs font-bold uppercase tracking-wider w-16 min-w-[56px] ${sub.id === 'Opc' ? 'text-sky-400' : 'text-emerald-400'}`}
                  >
                    {sub.label}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {/* Una fila por cada cara del dado */}
            {ROWS.map((row, rowIndex) => (
              <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}>

                {/* Icono de la cara del dado */}
                <td className={`sticky left-0 z-10 px-2 py-2 whitespace-nowrap ${rowIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'}`}>
                  <div className="flex flex-col items-center gap-0.5">
                    {DICE_ICONS[row.id]}
                    <span className="text-[10px] text-white/40 font-medium">({row.value})</span>
                  </div>
                </td>

                {/* Celdas de puntuación: Opcional y Obligado por cada jugador */}
                {players.map((_, pi) =>
                  SUBTYPES.map(sub => (
                    <td key={`${pi}-${sub.id}`} className="px-1 py-1.5">
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

            {/* Fila de totales */}
            <tr className="border-t-2 border-amber-400/40">
              <td className="sticky left-0 z-10 bg-slate-800 px-2 py-3 text-center">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Total</span>
              </td>
              {players.map((_, pi) => {
                const total = playerTotal(scores, pi)
                return (
                  <td key={pi} colSpan={2} className="text-center px-1 py-3 bg-slate-800">
                    <span className={`text-xl font-black tabular-nums ${total > 0 ? 'text-amber-300' : 'text-white/40'}`}>
                      {total || '—'}
                    </span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Modales ── */}
      {showPlayersModal && (
        <PlayersModal
          players={players}
          onSave={onSavePlayers}
          onClose={onClosePlayers}
        />
      )}

      {showResetModal && (
        <ResetModal
          onConfirm={onResetScores}
          onClose={onCloseReset}
        />
      )}
    </>
  )
}
