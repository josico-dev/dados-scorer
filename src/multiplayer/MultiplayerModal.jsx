// ─── Modal de configuración de sala multijugador ─────────────────────────
//
// Pasos:
//   HOST:  Crear sala → copiar código → esperar respuesta → pegar respuesta
//   GUEST: Pegar código de sala → copiar respuesta → enviar al host

import { useState } from 'react'

export default function MultiplayerModal({ onClose, mp, isDark, players, onConfirmPlayer }) {
  const [view,       setView]       = useState('menu')
  const [inputCode,  setInputCode]  = useState('')
  const [answerCode, setAnswerCode] = useState('')
  const [copied,     setCopied]     = useState(false)
  const [nameInput,  setNameInput]  = useState('')

  const t = isDark
    ? { bg: '#1a1730', border: 'rgba(255,255,255,0.1)', text: '#f1f5f9', muted: 'rgba(255,255,255,0.5)', input: 'rgba(255,255,255,0.08)' }
    : { bg: '#ffffff',  border: 'rgba(0,0,0,0.12)',       text: '#0f172a', muted: '#6b7280',              input: 'rgba(0,0,0,0.06)'       }

  async function handleCreateRoom() {
    setView('host-pick-player')
  }

  async function handleHostPickedPlayer() {
    const name = nameInput.trim() || players?.[0] || 'Jugador 1'
    onConfirmPlayer?.(0, name)  // host = índice 0
    setView('host-offer')
    const code = await mp.startAsHost()
    if (!code) setView('menu')
  }

  async function handleJoin() {
    if (!inputCode.trim()) return
    setView('guest-answer')
    const answer = await mp.joinAsGuest(inputCode.trim())
    if (answer) {
      setAnswerCode(answer)
      setView('guest-pick-player')
    } else {
      setView('guest-offer')
    }
  }

  function handleGuestPickedPlayer() {
    const name = nameInput.trim() || players?.[1] || 'Jugador 2'
    onConfirmPlayer?.(1, name)  // guest = índice 1
    setView('guest-answer-show')
  }

  async function handleConfirmAnswer() {
    if (!inputCode.trim()) return
    await mp.confirmAnswer(inputCode.trim())
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Si ya estamos conectados → mostrar estado de conexión + desconectar
  if (mp.isConnected && !mp.pickingPlayer) {
    return (
      <Modal onClose={onClose} t={t}>
        <div className="text-center">
          <div className="text-4xl mb-2">🤝</div>
          <h2 className="font-black text-lg mb-1" style={{ color: '#22c55e' }}>¡Conectados!</h2>
          <p className="text-sm mb-1" style={{ color: t.muted }}>
            Juegas como <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{mp.myName || (mp.isHost ? 'Jugador 1' : 'Jugador 2')}</span>
          </p>
          <p className="text-xs mb-5" style={{ color: t.muted }}>
            {mp.isHost ? 'Host — fuente de verdad del juego' : 'Guest — sincronizado con el host'}
          </p>
          <button onClick={() => { mp.disconnect(); onClose() }}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            Desconectar
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} t={t}>
      {/* ── Menú principal ── */}
      {view === 'menu' && (
        <>
          <h2 className="font-black text-lg mb-1 text-center" style={{ color: t.text }}>🌐 Multijugador</h2>
          <p className="text-xs text-center mb-5" style={{ color: t.muted }}>
            Conexión P2P directa — comparte el código por WhatsApp
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleCreateRoom}
              className="w-full py-3 rounded-xl font-black text-sm transition active:scale-95"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>
              🎲 Crear sala (Host)
            </button>
            <button onClick={() => setView('guest-offer')}
              className="w-full py-3 rounded-xl font-black text-sm transition active:scale-95"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#000' }}>
              🔗 Unirse a sala (Guest)
            </button>
          </div>
        </>
      )}

      {/* ── Host: elegir jugador ── */}
      {view === 'host-pick-player' && (
        <PlayerPicker
          title="¿Cómo te llamas?"
          subtitle="Serás el Jugador 1 (Host)"
          defaultName={players?.[0] || 'Jugador 1'}
          nameInput={nameInput}
          setNameInput={setNameInput}
          onConfirm={handleHostPickedPlayer}
          t={t}
        />
      )}

      {/* ── Guest: elegir jugador ── */}
      {view === 'guest-pick-player' && (
        <PlayerPicker
          title="¿Cómo te llamas?"
          subtitle="Serás el Jugador 2 (Guest)"
          defaultName={players?.[1] || 'Jugador 2'}
          nameInput={nameInput}
          setNameInput={setNameInput}
          onConfirm={handleGuestPickedPlayer}
          t={t}
        />
      )}

      {/* ── Host: mostrar código de oferta ── */}
      {view === 'host-offer' && (
        <>
          <h2 className="font-black text-base mb-1" style={{ color: t.text }}>Paso 1 — Comparte este código</h2>
          <p className="text-xs mb-3" style={{ color: t.muted }}>
            Envía este código al otro jugador por WhatsApp. Cuando te mande su respuesta, pégala abajo.
          </p>
          {mp.offerCode ? (
            <>
              <CodeBox code={mp.offerCode} onCopy={copyCode} copied={copied} t={t} label="Tu código de sala" />
              <div className="my-3 border-t" style={{ borderColor: t.border }} />
              <p className="text-xs mb-2 font-bold" style={{ color: t.muted }}>Paso 2 — Pega la respuesta del guest:</p>
              <textarea
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                placeholder="Pega aquí el código de respuesta..."
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-xs font-mono resize-none focus:outline-none mb-3"
                style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}
              />
              <button onClick={handleConfirmAnswer} disabled={!inputCode.trim()}
                className="w-full py-2.5 rounded-xl font-black text-sm transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: '#000' }}>
                ✅ Confirmar conexión
              </button>
            </>
          ) : (
            <div className="text-center py-4" style={{ color: t.muted }}>
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-sm">Generando código...</p>
            </div>
          )}
        </>
      )}

      {/* ── Guest: pegar código de oferta ── */}
      {view === 'guest-offer' && (
        <>
          <h2 className="font-black text-base mb-1" style={{ color: t.text }}>Paso 1 — Pega el código del host</h2>
          <p className="text-xs mb-3" style={{ color: t.muted }}>
            El host te habrá enviado un código. Pégalo aquí.
          </p>
          <textarea
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            placeholder="Pega aquí el código de sala..."
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-xs font-mono resize-none focus:outline-none mb-3"
            style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}
          />
          <button onClick={handleJoin} disabled={!inputCode.trim()}
            className="w-full py-2.5 rounded-xl font-black text-sm transition disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#000' }}>
            🔗 Conectar
          </button>
        </>
      )}

      {/* ── Guest: mostrar código de respuesta (tras elegir jugador) ── */}
      {view === 'guest-answer-show' && (
        <>
          <h2 className="font-black text-base mb-1" style={{ color: t.text }}>Paso 2 — Manda esto al host</h2>
          <p className="text-xs mb-3" style={{ color: t.muted }}>Copia este código y mándalo al host por WhatsApp.</p>
          <CodeBox code={answerCode} onCopy={copyCode} copied={copied} t={t} label="Tu código de respuesta" />
          <p className="text-xs mt-3 text-center" style={{ color: t.muted }}>Esperando que el host confirme...</p>
        </>
      )}

      {/* ── Guest: mostrar código de respuesta ── */}
      {view === 'guest-answer' && (
        <>
          <h2 className="font-black text-base mb-1" style={{ color: t.text }}>Paso 2 — Manda esto al host</h2>
          <p className="text-xs mb-3" style={{ color: t.muted }}>
            Copia este código y mándalo al host por WhatsApp.
          </p>
          {answerCode ? (
            <>
              <CodeBox code={answerCode} onCopy={copyCode} copied={copied} t={t} label="Tu código de respuesta" />
              <p className="text-xs mt-3 text-center" style={{ color: t.muted }}>
                Esperando que el host confirme...
              </p>
            </>
          ) : (
            <div className="text-center py-4" style={{ color: t.muted }}>
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-sm">Generando respuesta...</p>
            </div>
          )}
        </>
      )}

      {/* Error */}
      {mp.error && (
        <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
          ⚠️ {mp.error}
        </div>
      )}

      {view !== 'menu' && (
        <button onClick={() => { setView('menu'); setInputCode(''); mp.disconnect?.() }}
          className="mt-3 w-full py-2 rounded-xl text-xs transition"
          style={{ color: t.muted, border: `1px solid ${t.border}` }}>
          ← Volver
        </button>
      )}
    </Modal>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────

function Modal({ children, onClose, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5 shadow-2xl mb-2"
        style={{ background: t.bg, border: `1px solid ${t.border}` }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function PlayerPicker({ title, subtitle, defaultName, nameInput, setNameInput, onConfirm, t }) {
  return (
    <>
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">👤</div>
        <h2 className="font-black text-lg" style={{ color: t.text }}>{title}</h2>
        <p className="text-xs mt-1" style={{ color: t.muted }}>{subtitle}</p>
      </div>
      <input
        autoFocus
        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        placeholder={defaultName}
        className="w-full rounded-xl px-4 py-3 text-base font-bold text-center focus:outline-none mb-4"
        style={{ background: t.input, color: t.text, border: `2px solid rgba(124,58,237,0.4)` }}
      />
      <button
        onClick={onConfirm}
        className="w-full py-3 rounded-xl font-black text-sm transition active:scale-95"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>
        ¡Listo!
      </button>
    </>
  )
}

function CodeBox({ code, onCopy, copied, t, label }) {
  return (
    <div>
      <p className="text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: t.muted }}>{label}</p>
      <div className="relative">
        <textarea
          readOnly
          value={code}
          rows={3}
          className="w-full rounded-xl px-3 py-2 text-[10px] font-mono resize-none focus:outline-none pr-16"
          style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}
        />
        <button onClick={() => onCopy(code)}
          className="absolute right-2 top-2 px-2 py-1 rounded-lg text-[10px] font-bold transition"
          style={{ background: copied ? '#22c55e' : 'rgba(124,58,237,0.4)', color: '#fff' }}>
          {copied ? '✓' : '📋 Copiar'}
        </button>
      </div>
    </div>
  )
}
