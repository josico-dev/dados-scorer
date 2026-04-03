import { useState } from 'react'

// ─── Config ────────────────────────────────────────────────────────────────

const DEFAULT_PLAYERS = ['Jugador 1', 'Jugador 2']

const ROWS = [
  { id: 'as', label: 'AS', value: 6 },
  { id: 'k',  label: 'K',  value: 5 },
  { id: 'q',  label: 'Q',  value: 4 },
  { id: 'j',  label: 'J',  value: 3 },
  { id: 'vi', label: 'VI', value: 2 },
  { id: 'v',  label: 'V',  value: 1 },
]

const SUBTYPES = ['Opc', 'Obl']   // Opcional, Obligado

// ─── Helpers ───────────────────────────────────────────────────────────────

function emptyScores(players) {
  const s = {}
  players.forEach((_, pi) => {
    s[pi] = {}
    ROWS.forEach(r => {
      s[pi][r.id] = { L: '', O: '' }
    })
  })
  return s
}

function playerTotal(scores, pi) {
  return ROWS.reduce((acc, r) => {
    const opc = parseFloat(scores[pi]?.[r.id]?.Opc) || 0
    const obl = parseFloat(scores[pi]?.[r.id]?.Obl) || 0
    return acc + (opc + obl) * r.value
  }, 0)
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ScoreCell({ value, faceValue, onChange }) {
  const [focused, setFocused] = useState(false)

  const numDice = parseFloat(value)
  const calculated = !isNaN(numDice) && value !== '' ? numDice * faceValue : ''

  return (
    <div className="relative w-full">
      <input
        type="number"
        inputMode="numeric"
        value={focused ? value : ''}
        onChange={e => onChange(e.target.value)}
        onFocus={e => { setFocused(true); e.target.select() }}
        onBlur={() => setFocused(false)}
        className="
          w-full text-center text-base font-semibold
          bg-white/10 text-white placeholder-white/30
          rounded-xl py-3 px-1
          border border-white/10 focus:border-amber-400/80
          focus:outline-none focus:ring-2 focus:ring-amber-400/60
          transition-all duration-150
          [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
        "
        placeholder={focused ? 'dados' : '—'}
      />
      {/* Display calculated value when not focused */}
      {!focused && calculated !== '' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-base font-bold text-white">{calculated}</span>
          <span className="text-[10px] text-white/35 ml-1 mt-0.5">({value}×{faceValue})</span>
        </div>
      )}
    </div>
  )
}

function PlayersModal({ players, onSave, onClose }) {
  const [names, setNames] = useState([...players])

  function setName(i, val) {
    setNames(prev => prev.map((n, idx) => idx === i ? val : n))
  }

  function addPlayer() {
    setNames(prev => [...prev, `Jugador ${prev.length + 1}`])
  }

  function removePlayer(i) {
    if (names.length <= 1) return
    setNames(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-5 shadow-2xl border border-white/10 mb-2"
           onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-lg mb-4">👥 Jugadores</h2>

        <div className="space-y-2 mb-4">
          {names.map((n, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={n}
                onChange={e => setName(i, e.target.value)}
                className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 border border-white/10 focus:border-amber-400 focus:outline-none"
                placeholder={`Jugador ${i + 1}`}
              />
              <button onClick={() => removePlayer(i)}
                      disabled={names.length <= 1}
                      className="text-red-400 disabled:opacity-20 text-xl px-1">✕</button>
            </div>
          ))}
        </div>

        <button onClick={addPlayer}
                className="w-full py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-sm hover:border-amber-400/50 hover:text-amber-300 transition mb-4">
          + Añadir jugador
        </button>

        <div className="flex gap-2">
          <button onClick={onClose}
                  className="flex-1 py-2 rounded-lg border border-white/20 text-white/60 text-sm">
            Cancelar
          </button>
          <button onClick={() => onSave(names)}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────

export default function App() {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS)
  const [scores, setScores] = useState(() => emptyScores(DEFAULT_PLAYERS))
  const [showPlayers, setShowPlayers] = useState(false)
  const [showReset, setShowReset] = useState(false)

  function updateScore(pi, rowId, sub, val) {
    setScores(prev => ({
      ...prev,
      [pi]: {
        ...prev[pi],
        [rowId]: {
          ...prev[pi][rowId],
          [sub]: val,
        },
      },
    }))
  }

  function savePlayers(names) {
    setPlayers(names)
    setScores(prev => {
      const next = emptyScores(names)
      // preserve existing scores for matching indices
      names.forEach((_, pi) => {
        if (prev[pi]) {
          ROWS.forEach(r => {
            next[pi][r.id] = prev[pi][r.id] ?? { L: '', O: '' }
          })
        }
      })
      return next
    })
    setShowPlayers(false)
  }

  function resetAll() {
    setScores(emptyScores(players))
    setShowReset(false)
  }

  const numPlayers = players.length
  // each player has 2 sub-cols; col widths
  // row label col: ~44px, then equal flex cols
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white select-none">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <h1 className="text-base font-bold tracking-wide text-amber-300">Dados Scorer</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPlayers(true)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition">
            👥 Jugadores
          </button>
          <button onClick={() => setShowReset(true)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition">
            🔄 Reset
          </button>
        </div>
      </header>

      {/* Scrollable table area */}
      <div className="overflow-x-auto pb-6 flex justify-center">
        <table className="border-separate border-spacing-0 mx-auto" style={{ minWidth: `${Math.max(320, 80 + numPlayers * 120)}px`, width: `${Math.max(320, 80 + numPlayers * 120)}px` }}>
          <thead>
            {/* Player name row */}
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 w-10 min-w-[40px]" />
              {players.map((name, pi) => (
                <th key={pi} colSpan={2}
                    className="text-center px-1 pt-3 pb-1">
                  <span className="block text-sm font-bold text-amber-300 uppercase tracking-wider truncate max-w-[120px] mx-auto">
                    {name}
                  </span>
                </th>
              ))}
            </tr>
            {/* L / O sub-header row */}
            <tr>
              <th className="sticky left-0 z-20 bg-slate-900 text-left px-2 py-1 text-[10px] text-white/40 font-medium uppercase">
                Cara
              </th>
              {players.map((_, pi) =>
                SUBTYPES.map(sub => (
                  <th key={`${pi}-${sub}`}
                      className={`text-center px-1 pb-2 text-xs font-bold uppercase tracking-wider w-16 min-w-[56px] ${sub === 'Opc' ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {sub === 'Opc' ? 'Opcional' : 'Obligado'}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row, ri) => (
              <tr key={row.id}
                  className={ri % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}>
                {/* Row label */}
                <td className="sticky left-0 z-10 bg-inherit px-2 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-amber-300">{row.label}</span>
                    <span className="text-xs text-white/40 font-medium">({row.value})</span>
                  </div>
                </td>

                {players.map((_, pi) =>
                  SUBTYPES.map(sub => (
                    <td key={`${pi}-${sub}`} className="px-1 py-1.5">
                      <ScoreCell
                        value={scores[pi]?.[row.id]?.[sub] ?? ''}
                        faceValue={row.value}
                        onChange={val => updateScore(pi, row.id, sub, val)}
                      />
                    </td>
                  ))
                )}
              </tr>
            ))}

            {/* Total row */}
            <tr className="border-t-2 border-amber-400/40">
              <td className="sticky left-0 z-10 bg-slate-800 px-2 py-3">
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

      {/* Legend */}
      <div className="px-4 pb-8 flex gap-4 justify-center text-[11px] text-white/40">
        <span><span className="text-sky-400 font-bold">Opc</span> = Opcional</span>
        <span><span className="text-emerald-400 font-bold">Obl</span> = Obligado</span>
        <span className="text-white/25">· número entre paréntesis = valor de la cara</span>
      </div>

      {/* Modals */}
      {showPlayers && (
        <PlayersModal players={players} onSave={savePlayers} onClose={() => setShowPlayers(false)} />
      )}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
             onClick={() => setShowReset(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl max-w-xs w-full text-center"
               onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🔄</div>
            <h2 className="text-white font-bold text-lg mb-2">¿Resetear partida?</h2>
            <p className="text-white/50 text-sm mb-5">Se borrarán todas las puntuaciones. Los jugadores se mantienen.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 font-medium">
                Cancelar
              </button>
              <button onClick={resetAll}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition">
                Resetear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
