// ─── Estilos de los dados (Dice Party) ─────────────────────────────────────
// Separado del componente Die para mantener un único export por archivo
// (compatible con react-refresh).

export const PIP_POSITIONS = {
  1: [[30, 30]],
  2: [[18, 18], [42, 42]],
  3: [[18, 18], [30, 30], [42, 42]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 15], [42, 15], [18, 30], [42, 30], [18, 45], [42, 45]],
}

// Color por VALOR de la cara
export const FACE_COLORS = {
  1: { bg: '#3b0f0f', border: '#ef4444', pip: '#fca5a5', glow: '#ef444488' }, // rojo
  2: { bg: '#2e2200', border: '#eab308', pip: '#fde047', glow: '#eab30888' }, // amarillo
  3: { bg: '#0f1f3b', border: '#3b82f6', pip: '#93c5fd', glow: '#3b82f688' }, // azul
  4: { bg: '#0f2e1a', border: '#22c55e', pip: '#86efac', glow: '#22c55e88' }, // verde
  5: { bg: '#1f0f3b', border: '#a855f7', pip: '#d8b4fe', glow: '#a855f788' }, // morado
  6: { bg: '#2a0f2e', border: '#ec4899', pip: '#f9a8d4', glow: '#ec489988' }, // rosa/fucsia
  0: { bg: '#1e293b', border: '#475569', pip: '#94a3b8', glow: '#47556944' }, // sin valor
}

// Bloqueado: blanco — no se confunde con ningún valor
export const LOCKED_COLORS = { bg: '#1e293b', border: '#ffffff', pip: '#ffffff', glow: '#ffffff99' }
