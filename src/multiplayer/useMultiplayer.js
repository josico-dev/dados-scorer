// ─── Hook de multiplayer ──────────────────────────────────────────────────
//
// Arquitectura: SYNC SIMÉTRICO DE STATE.
// Ambos peers son iguales. Quien hace un cambio lo aplica localmente y emite
// su state completo al otro. El receptor reemplaza su state.
//
// La única asimetría es el handshake (uno crea oferta, otro responde), y de
// ahí derivan los índices: el "iniciador" (creador de sala) es el jugador 0,
// el que se une es el jugador 1. Tras conectar, no hay autoridad: cada uno
// modifica su lado y se sincronizan.

import { useState, useRef, useCallback, useEffect } from 'react'
import { GameRTC } from './rtc'

export function useMultiplayer({ onRemoteState, onConnected }) {
  const [status,    setStatus]    = useState('idle')
  const [offerCode, setOfferCode] = useState('')
  const [error,     setError]     = useState('')
  // null offline, 0 iniciador (creador de sala), 1 quien se une
  const [myIndex,   setMyIndex]   = useState(null)

  const rtcRef         = useRef(null)
  const onStateRef     = useRef(onRemoteState)
  const onConnectedRef = useRef(onConnected)
  useEffect(() => { onStateRef.current     = onRemoteState }, [onRemoteState])
  useEffect(() => { onConnectedRef.current = onConnected   }, [onConnected])

  function cleanup() {
    rtcRef.current?.close()
    rtcRef.current = null
  }

  function makeRTC(isInitiator) {
    return new GameRTC({
      isHost: isInitiator,
      onStateUpdate: msg => onStateRef.current?.(msg),
      onConnected: () => {
        setStatus('connected')
        onConnectedRef.current?.(isInitiator)
      },
      onDisconnected: () => { setStatus('idle'); setError('Conexión cerrada') },
      onError:        msg => { setStatus('error'); setError(msg) },
    })
  }

  // ── Iniciador: crea oferta ───────────────────────────────────────────────
  const startAsHost = useCallback(async () => {
    cleanup()
    setStatus('offering')
    setError('')
    setMyIndex(0)
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

  // ── Iniciador: confirmar answer ───────────────────────────────────────────
  const confirmAnswer = useCallback(async (answerCode) => {
    if (!rtcRef.current) return
    try { await rtcRef.current.receiveAnswer(answerCode) }
    catch { setStatus('error'); setError('Código de respuesta inválido') }
  }, [])

  // ── Quien se une ──────────────────────────────────────────────────────────
  const joinAsGuest = useCallback(async (code) => {
    cleanup()
    setStatus('answering')
    setError('')
    setMyIndex(1)
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

  // ── Emitir state completo al peer ─────────────────────────────────────────
  const sendState = useCallback((state) => {
    rtcRef.current?.send({ type: 'state', payload: state })
  }, [])

  const disconnect = useCallback(() => {
    cleanup()
    setStatus('idle')
    setOfferCode('')
    setError('')
    setMyIndex(null)
  }, [])

  return {
    status,
    offerCode,
    error,
    myIndex,
    isInitiator: myIndex === 0,
    isConnected: status === 'connected',
    startAsHost,
    confirmAnswer,
    joinAsGuest,
    sendState,
    disconnect,
  }
}
