// ─── Celda de puntuación ───────────────────────────────────────────────────

import { useState } from 'react'

export default function ScoreCell({ value, faceValue, onChange, theme, isDark }) {
  const [focused, setFocused] = useState(false)

  const numDice = parseFloat(value)
  const hasValue = value !== '' && !isNaN(numDice)
  const result = hasValue ? numDice * faceValue : null

  const t = theme ?? {}

  return (
    <div className="relative w-full">
      <input
        type="number"
        inputMode="numeric"
        value={focused ? value : ''}
        onChange={e => onChange(e.target.value)}
        onFocus={e => { setFocused(true); e.target.select() }}
        onBlur={() => setFocused(false)}
        placeholder={result !== null ? '' : '—'}
        className="w-full text-center text-base font-semibold rounded-xl py-3 px-1 focus:outline-none transition-all duration-150 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        style={{
          background: t.inputBg ?? 'rgba(255,255,255,0.08)',
          color: t.text ?? '#f1f5f9',
          border: focused
            ? '2px solid #a78bfa'
            : `1px solid ${t.borderSubtle ?? 'rgba(255,255,255,0.1)'}`,
        }}
      />
      {!focused && result !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-base font-bold" style={{ color: t.text ?? '#f1f5f9' }}>{result}</span>
          <span className="text-[10px] ml-1 mt-0.5" style={{ color: t.textMuted ?? 'rgba(255,255,255,0.35)' }}>
            ({value}×{faceValue})
          </span>
        </div>
      )}
    </div>
  )
}
