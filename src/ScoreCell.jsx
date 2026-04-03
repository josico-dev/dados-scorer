// ─── Celda de puntuación ───────────────────────────────────────────────────
//
// Muestra el resultado calculado (dados × valor) cuando no está en foco.
// Al hacer clic, muestra el número de dados para editar.

import { useState } from 'react'

export default function ScoreCell({ value, faceValue, onChange }) {
  const [focused, setFocused] = useState(false)

  // Calculamos el resultado: número de dados × valor de la cara
  const numDice = parseFloat(value)
  const hasValue = value !== '' && !isNaN(numDice)
  const result = hasValue ? numDice * faceValue : null

  return (
    <div className="relative w-full">
      {/* Input siempre presente pero transparente cuando no está en foco */}
      <input
        type="number"
        inputMode="numeric"
        value={focused ? value : ''}
        onChange={e => onChange(e.target.value)}
        onFocus={e => { setFocused(true); e.target.select() }}
        onBlur={() => setFocused(false)}
        placeholder={result !== null ? '' : '—'}
        className="
          w-full text-center text-base font-semibold
          bg-white/10 text-white placeholder-white/30
          rounded-xl py-3 px-1
          border border-white/10
          focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/60
          focus:outline-none transition-all duration-150
          [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
        "
      />

      {/* Overlay con el resultado calculado (solo visible cuando no está en foco) */}
      {!focused && result !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-base font-bold text-white">{result}</span>
          <span className="text-[10px] text-white/35 ml-1 mt-0.5">({value}×{faceValue})</span>
        </div>
      )}
    </div>
  )
}
