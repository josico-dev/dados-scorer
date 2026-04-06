// ─── Hook de multiplayer ──────────────────────────────────────────────────
//
// Arquitectura: el HOST es la fuente de verdad.
// - Host recibe ACCIONES del guest y actualiza el estado
// - Host emite el ESTADO completo a todos tras cada cambio
// - Guest recibe el ESTADO y lo aplica (read-only salvo sus propias acciones)

import { useState, useRef, useCallback, useEffect } from 'react'
import { GameRTC } from './rtc'

export function useMultiplayer({ onRemoteState, onRemoteAction }) {
  const [status,    setStatus]    = useState('idle')
  const [offerCode, setOfferCode] = useState('')
  const [error,     setError]     = useState('')
  const [isHost,    setIsHost]    = useState(false)

  const rtcRef         = useRef(null)
  // Refs para callbacks para evitar referencias stale
  const onStateRef     = useRef(onRemoteState)
  const onActionRef    = useRef(onRemoteAction)

  useEffect(() => { onStateRef.current  = onRemoteState  }, [onRemoteState])
  useEffect(() => { onActionRef.current = onRemoteAction }, [onRemoteAction])

  function cleanup() {
    rtcRef.current?.close()
    rtcRef.current = null
  }

  function makeRTC(host) {
    return new GameRTC({
      isHost: host,
      onStateUpdate: (msg) => {
        if (msg._type === 'action') {
          onActionRef.current?.(msg)
        } else {
          onStateRef.current?.(msg)
        }
      },
      onConnected: () => {
        setStatus('connected')
        if (!host) {
          // Guest pide el estado inicial al host
          setTimeout(() => {
            rtcRef.current?.send({ type: 'state', payload: { _type: 'action', action: 'requestState' } })
          }, 400)
        }
      },
      onDisconnected: () => { setStatus('idle'); setError('Conexión cerrada') },
      onError:        msg => { setStatus('error'); setError(msg) },
    })
  }

  // ── Host: crear oferta ───────────────────────────────────────────────────
  const startAsHost = useCallback(async () => {
    cleanup()
    setStatus('offering')
    setError('')
    setIsHost(true)
    const rtc = makeRTC(true)
    rtcRef.current = rtc
    try {
      const code = await rtc.createOffer()
      setOfferCode(code)
      return code
    } catch {
      setStatus('error')
      setError('Error creando la oferta')
      return null
    }
  }, [])

  // ── Host: confirmar answer ────────────────────────────────────────────────
  const confirmAnswer = useCallback(async (answerCode) => {
    if (!rtcRef.current) return
    try {
      await rtcRef.current.receiveAnswer(answerCode)
    } catch {
      setStatus('error')
      setError('Código de respuesta inválido')
    }
  }, [])

  // ── Guest: unirse ─────────────────────────────────────────────────────────
  const joinAsGuest = useCallback(async (code) => {
    cleanup()
    setStatus('answering')
    setError('')
    setIsHost(false)
    const rtc = makeRTC(false)
    rtcRef.current = rtc
    try {
      const answerCode = await rtc.receiveOffer(code)
      return answerCode
    } catch {
      setStatus('error')
      setError('Código de oferta inválido')
      return null
    }
  }, [])

  // ── Enviar estado completo (host → guest) ─────────────────────────────────
  const sendState = useCallback((state) => {
    rtcRef.current?.send({ type: 'state', payload: state })
  }, [])

  // ── Enviar acción (guest → host) ──────────────────────────────────────────
  const sendAction = useCallback((action) => {
    rtcRef.current?.send({ type: 'state', payload: { ...action, _type: 'action' } })
  }, [])

  // ── Desconectar ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    cleanup()
    setStatus('idle')
    setOfferCode('')
    setError('')
  }, [])

  return {
    status,
    offerCode,
    error,
    isHost,
    isConnected: status === 'connected',
    startAsHost,
    confirmAnswer,
    joinAsGuest,
    sendState,
    sendAction,
    disconnect,
  }
}
