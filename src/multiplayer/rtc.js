// ─── WebRTC Multiplayer — señalización manual ─────────────────────────────
//
// Flujo:
//   Host → crea oferta (offer) → comparte código por WhatsApp
//   Guest → pega oferta, genera respuesta (answer) → manda de vuelta
//   Host → pega respuesta → conexión P2P establecida
//
// Una vez conectados, se sincronizan:
//   - Estado completo del juego (al conectar y en cada cambio)
//   - Acciones del guest → host las aplica y re-emite el estado

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// Comprime un objeto a base64 para copiar/pegar
export function encode(obj) {
  return btoa(JSON.stringify(obj))
}

// Descomprime base64 a objeto
export function decode(str) {
  try { return JSON.parse(atob(str.trim())) } catch { return null }
}

// ── Clase principal ───────────────────────────────────────────────────────

export class GameRTC {
  constructor({ isHost, onStateUpdate, onConnected, onDisconnected, onError }) {
    this.isHost       = isHost
    this.onStateUpdate  = onStateUpdate   // (state) → void
    this.onConnected    = onConnected     // () → void
    this.onDisconnected = onDisconnected  // () → void
    this.onError        = onError         // (msg) → void

    this.pc      = null  // RTCPeerConnection
    this.channel = null  // RTCDataChannel
  }

  // ── HOST: paso 1 — crear oferta ──────────────────────────────────────────

  async createOffer() {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this._setupPeerHandlers()

    // El host crea el DataChannel
    this.channel = this.pc.createDataChannel('game', { ordered: true })
    this._setupChannelHandlers()

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // Esperar a que se recojan todos los candidatos ICE
    return new Promise(resolve => {
      this.pc.onicecandidate = e => {
        if (e.candidate === null) {
          // ICE gathering completado
          resolve(encode(this.pc.localDescription))
        }
      }
      // Timeout por si ya están todos los candidatos
      setTimeout(() => resolve(encode(this.pc.localDescription)), 3000)
    })
  }

  // ── HOST: paso 3 — recibir answer del guest ──────────────────────────────

  async receiveAnswer(answerCode) {
    const answer = decode(answerCode)
    if (!answer) { this.onError?.('Código de respuesta inválido'); return }
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  // ── GUEST: paso 2 — recibir oferta y crear answer ────────────────────────

  async receiveOffer(offerCode) {
    const offer = decode(offerCode)
    if (!offer) { this.onError?.('Código de oferta inválido'); return null }

    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this._setupPeerHandlers()

    // El guest recibe el DataChannel
    this.pc.ondatachannel = e => {
      this.channel = e.channel
      this._setupChannelHandlers()
    }

    await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    return new Promise(resolve => {
      this.pc.onicecandidate = e => {
        if (e.candidate === null) {
          resolve(encode(this.pc.localDescription))
        }
      }
      setTimeout(() => resolve(encode(this.pc.localDescription)), 3000)
    })
  }

  // ── Enviar estado/acción al otro jugador ─────────────────────────────────

  send(message) {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(message))
    }
  }

  // ── Cerrar conexión ──────────────────────────────────────────────────────

  close() {
    this.channel?.close()
    this.pc?.close()
    this.pc = null
    this.channel = null
  }

  // ── Privados ─────────────────────────────────────────────────────────────

  _setupPeerHandlers() {
    this.pc.onconnectionstatechange = () => {
      const s = this.pc?.connectionState
      if (s === 'connected')    this.onConnected?.()
      if (s === 'disconnected' || s === 'failed' || s === 'closed') {
        this.onDisconnected?.()
      }
    }
  }

  _setupChannelHandlers() {
    this.channel.onopen    = () => this.onConnected?.()
    this.channel.onclose   = () => this.onDisconnected?.()
    this.channel.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'state') this.onStateUpdate?.(msg.payload)
      } catch {}
    }
  }
}
