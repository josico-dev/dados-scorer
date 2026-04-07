// ─── Header compartido ────────────────────────────────────────────────────

export default function Header({
  mode, isDark, theme,
  isConnected,
  showDicePanel,
  onToggleMode,
  onOpenMultiplayer,
  onOpenPlayers,
  onOpenReset,
  onToggleTheme,
  onToggleDice,
  showDiceButton = false,   // solo en modo dados
}) {
  const t = theme ?? {}

  function ModeToggle() {
    return (
      <div className="flex rounded-2xl p-1 gap-1"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
        {[
          { id: 'dados',      label: '🃏 Dados'      },
          { id: 'dice-party', label: '🎲 Dice Party' },
        ].map(m => (
          <button key={m.id} onClick={() => onToggleMode(m.id)}
            className="px-4 py-2 rounded-xl text-sm font-black transition-all"
            style={mode === m.id
              ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }
              : { color: t.textMuted }}>
            {m.label}
          </button>
        ))}
      </div>
    )
  }

  const buttons = [
    showDiceButton && {
      label: '🎲', title: 'Dados',
      active: showDicePanel, onClick: onToggleDice,
      activeColor: '#f59e0b',
    },
    {
      label: isConnected ? '🌐 ●' : '🌐', title: 'Online',
      active: isConnected, onClick: onOpenMultiplayer,
      activeColor: '#22c55e',
    },
    { label: '👥', title: 'Jugadores', active: false, onClick: onOpenPlayers },
    { label: '🔄', title: 'Reset',     active: false, onClick: onOpenReset, danger: true },
    { label: isDark ? '☀️' : '🌙', title: 'Tema', active: false, onClick: onToggleTheme },
  ].filter(Boolean)

  return (
    <header className="shrink-0 backdrop-blur border-b px-3 pt-2 pb-2 flex flex-col gap-2"
      style={{ background: t.headerBg, borderColor: t.borderSubtle }}>

      <div className="flex items-center">
        <span className="text-xl w-8">🎲</span>
        <div className="flex-1 flex justify-center"><ModeToggle /></div>
        <div className="w-8" />
      </div>

      <div className="flex items-center justify-between gap-1">
        {buttons.map(btn => (
          <button key={btn.title} onClick={btn.onClick}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition flex flex-col items-center gap-0.5"
            style={{
              background: btn.active
                ? (btn.activeColor === '#f59e0b'
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(34,197,94,0.2)')
                : btn.danger
                  ? 'rgba(239,68,68,0.12)'
                  : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
              color: btn.active
                ? btn.activeColor
                : btn.danger ? '#f87171' : t.textMuted,
            }}>
            <span className="text-sm leading-none">{btn.label}</span>
            <span className="text-[9px] leading-none">{btn.title}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
