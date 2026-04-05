// ─── Error Boundary ────────────────────────────────────────────────────────
// Captura cualquier error de renderizado y muestra una pantalla de recuperación
// en lugar de dejar la app en blanco.

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  recover() {
    // Limpia todo el localStorage y recarga — solución nuclear pero efectiva
    try { localStorage.clear() } catch {}
    window.location.reload()
  }

  render() {
    if (!this.state.crashed) return this.props.children
    return (
      <div style={{
        height: '100svh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: 'white', padding: 24, textAlign: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🎲</div>
        <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#f59e0b' }}>Algo salió mal</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Los datos guardados pueden estar corruptos.
        </p>
        <button
          onClick={() => this.recover()}
          style={{
            marginTop: 8, padding: '12px 24px', borderRadius: 12,
            background: '#f59e0b', color: '#000', fontWeight: 'bold', fontSize: 15, border: 'none',
          }}
        >
          Reiniciar app
        </button>
      </div>
    )
  }
}
