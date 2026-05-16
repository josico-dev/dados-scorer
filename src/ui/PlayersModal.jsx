// ─── Modal de gestión de jugadores ────────────────────────────────────────
//
// Permite añadir, renombrar y eliminar jugadores.
// Se abre desde el botón "Jugadores" del header.

import { useState } from 'react'

export default function PlayersModal({ players, onSave, onClose }) {
  const [names, setNames] = useState([...players])

  function updateName(index, newName) {
    setNames(prev => prev.map((n, i) => i === index ? newName : n))
  }

  function addPlayer() {
    setNames(prev => [...prev, `Jugador ${prev.length + 1}`])
  }

  function removePlayer(index) {
    if (names.length <= 1) return // mínimo 1 jugador
    setNames(prev => prev.filter((_, i) => i !== index))
  }

  return (
    // Fondo oscuro — al hacer clic fuera se cierra el modal
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Tarjeta del modal — stopPropagation para que no se cierre al hacer clic dentro */}
      <div
        className="w-full max-w-md bg-slate-800 rounded-2xl p-5 shadow-2xl border border-white/10 mb-2"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-lg mb-4">👥 Jugadores</h2>

        {/* Lista de jugadores */}
        <div className="space-y-2 mb-4">
          {names.map((name, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={name}
                onChange={e => updateName(i, e.target.value)}
                placeholder={`Jugador ${i + 1}`}
                className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 border border-white/10 focus:border-amber-400 focus:outline-none"
              />
              <button
                onClick={() => removePlayer(i)}
                disabled={names.length <= 1}
                className="text-red-400 disabled:opacity-20 text-xl px-1"
              >✕</button>
            </div>
          ))}
        </div>

        {/* Botón añadir jugador */}
        <button
          onClick={addPlayer}
          className="w-full py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-sm hover:border-amber-400/50 hover:text-amber-300 transition mb-4"
        >
          + Añadir jugador
        </button>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/20 text-white/60 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(names)}
            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
