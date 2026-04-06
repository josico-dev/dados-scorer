// ─── Error Boundary ────────────────────────────────────────────────────────

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error) {
    return { crashed: true, errorMsg: error?.message ?? '' }
  }

  componentDidCatch(error, info) {
    // Si el error parece de localStorage, lo limpiamos automáticamente y recargamos
    const isStorageError = error?.message?.includes('JSON') ||
                           error?.message?.includes('undefined') ||
                           error?.message?.includes('null') ||
                           error?.message?.includes('Cannot read')
    if (isStorageError) {
      try { localStorage.clear() } catch {}
      window.location.reload()
    }
  }

  recover() {
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
          Pulsa el botón para reiniciar la app y limpiar los datos guardados.
        </p>
        {this.state.errorMsg && (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: 'monospace', maxWidth: 300, wordBreak: 'break-all' }}>
            {this.state.errorMsg}
          </p>
        )}
        <button onClick={() => this.recover()}
          style={{ marginTop: 8, padding: '12px 24px', borderRadius: 12, background: '#f59e0b', color: '#000', fontWeight: 'bold', fontSize: 15, border: 'none' }}>
          Reiniciar app
        </button>
      </div>
    )
  }
}
