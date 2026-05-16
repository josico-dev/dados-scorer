// ─── Modal de confirmación de reset ───────────────────────────────────────
//
// Pide confirmación antes de borrar todas las puntuaciones.

export default function ResetModal({ onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl max-w-xs w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">🔄</div>
        <h2 className="text-white font-bold text-lg mb-2">¿Resetear partida?</h2>
        <p className="text-white/50 text-sm mb-5">
          Se borrarán todas las puntuaciones. Los jugadores se mantienen.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition"
          >
            Resetear
          </button>
        </div>
      </div>
    </div>
  )
}
