// ─── Hook de multiplayer ──────────────────────────────────────────────────
//
// Gestiona todo el ciclo de vida de la conexión WebRTC y sincronización
// de estado del juego.
//
// Uso:
//   const mp = useMultiplayer({ gameState, onRemoteState })
//   mp.startAsHost()    → devuelve código de oferta
//   mp.joinAsGuest(code) → devuelve código de respuesta
//   mp.confirmAnswer(code) → host confirma conexión
//   mp.send(state)      → envía estado al otro jugador
//   mp.status           → 'idle' | 'waiting' | 'connected' | 'error'

import { useState, useRef, useCallback } from 'react'
import { GameRTC } from './rtc'

export function useMultiplayer({ onRemoteState }) {
  const [status,    setStatus]    = useState('idle')     // idle | offering | answering | connected | error
  const [offerCode, setOfferCode] = useState('')
  const [error,     setError]     = useState('')
  const [isHost,    setIsHost]    = useState(false)

  const rtcRef = useRef(null)

  function cleanup() {
    rtcRef.current?.close()
    rtcRef.current = null
  }

  // ── Host: crear oferta ───────────────────────────────────────────────────

  const startAsHost = useCallback(async () => {
    cleanup()
    setStatus('offering')
    setError('')
    setIsHost(true)

    const rtc = new GameRTC({
      isHost: true,
      onStateUpdate: onRemoteState,
      onConnected:   () => setStatus('connected'),
      onDisconnected:() => { setStatus('idle'); setError('Conexión cerrada') },
      onError:       msg => { setStatus('error'); setError(msg) },
    })
    rtcRef.current = rtc

    try {
      const code = await rtc.createOffer()
      setOfferCode(code)
      return code
    } catch (e) {
      setStatus('error')
      setError('Error creando la oferta')
      return null
    }
  }, [onRemoteState])

  // ── Host: confirmar answer recibido del guest ────────────────────────────

  const confirmAnswer = useCallback(async (answerCode) => {
    if (!rtcRef.current) return
    setStatus('connecting')
    try {
      await rtcRef.current.receiveAnswer(answerCode)
    } catch {
      setStatus('error')
      setError('Código de respuesta inválido')
    }
  }, [])

  // ── Guest: unirse con el código de oferta ────────────────────────────────

  const joinAsGuest = useCallback(async (offerCode) => {
    cleanup()
    setStatus('answering')
    setError('')
    setIsHost(false)

    const rtc = new GameRTC({
      isHost: false,
      onStateUpdate: onRemoteState,
      onConnected:   () => setStatus('connected'),
      onDisconnected:() => { setStatus('idle'); setError('Conexión cerrada') },
      onError:       msg => { setStatus('error'); setError(msg) },
    })
    rtcRef.current = rtc

    try {
      const answerCode = await rtc.receiveOffer(offerCode)
      return answerCode
    } catch {
      setStatus('error')
      setError('Código de oferta inválido')
      return null
    }
  }, [onRemoteState])

  // ── Enviar estado al otro jugador ────────────────────────────────────────

  const sendState = useCallback((state) => {
    rtcRef.current?.send({ type: 'state', payload: state })
  }, [])

  // ── Desconectar ──────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    cleanup()
    setStatus('idle')
    setOfferCode('')
    setError('')
  }, [])

  return {
    status,       // 'idle' | 'offering' | 'answering' | 'connecting' | 'connected' | 'error'
    offerCode,    // código a compartir (host)
    error,
    isHost,
    isConnected: status === 'connected',
    startAsHost,
    confirmAnswer,
    joinAsGuest,
    sendState,
    disconnect,
  }
}
