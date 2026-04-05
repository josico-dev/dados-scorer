// ─── Componente SVG de un dado ──────────────────────────────────────────────
//
// Renderiza un dado con los puntos/pips según su valor (1-6).
// Si está bloqueado, muestra borde dorado. Si no, borde gris/oscuro.
// Tamaño mínimo 64x64px para fácil toque en móvil.

// Posiciones de los pips para cada cara (coordenadas en viewBox 0 0 60 60)
const PIP_POSITIONS = {
  1: [[30, 30]],
  2: [[18, 18], [42, 42]],
  3: [[18, 18], [30, 30], [42, 42]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 15], [42, 15], [18, 30], [42, 30], [18, 45], [42, 45]],
}

/**
 * @param {number}   value    - Valor del dado (1-6), o 0 si no ha sido lanzado
 * @param {boolean}  locked   - Si está bloqueado (borde dorado)
 * @param {boolean}  rolling  - Si está animándose (dado girando)
 * @param {function} onClick  - Callback al hacer clic
 * @param {string}   className - Clases adicionales
 */
export default function Die({ value, locked, rolling, onClick, className = '' }) {
  const pips = value >= 1 && value <= 6 ? PIP_POSITIONS[value] : []

  // Color del borde según estado
  const borderColor = locked
    ? '#f59e0b'   // dorado si bloqueado
    : rolling
      ? '#64748b' // gris oscuro si rodando
      : '#94a3b8' // gris claro si disponible

  const bgColor = locked ? '#1e1a0e' : '#1e293b'

  return (
    <button
      onClick={onClick}
      className={`relative touch-manipulation select-none focus:outline-none ${className}`}
      style={{ width: 64, height: 64, minWidth: 64, minHeight: 64 }}
      aria-label={value ? `Dado ${value}${locked ? ' (bloqueado)' : ''}` : 'Dado'}
    >
      <svg
        viewBox="0 0 60 60"
        width="64"
        height="64"
        style={{
          filter: rolling ? 'brightness(0.7)' : locked ? 'drop-shadow(0 0 6px #f59e0b88)' : 'none',
          transition: 'filter 0.15s',
        }}
      >
        {/* Fondo del dado */}
        <rect
          x="3" y="3"
          width="54" height="54"
          rx="10"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="3"
        />

        {/* Pips */}
        {pips.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="5"
            fill={locked ? '#f59e0b' : '#e2e8f0'}
          />
        ))}

        {/* Si no hay valor, mostrar "?" */}
        {!value && (
          <text
            x="30" y="38"
            textAnchor="middle"
            fontSize="24"
            fill="#475569"
            fontWeight="bold"
          >?</text>
        )}
      </svg>

      {/* Indicador de bloqueado */}
      {locked && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center"
          style={{ fontSize: 9, color: '#000' }}
        >
          🔒
        </div>
      )}
    </button>
  )
}
