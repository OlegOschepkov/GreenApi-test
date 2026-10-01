import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { createGreenApi, toUserMessage } from '@/api/greenApi'
import { describeInstanceState, isReadyState } from '@/api/instance-state'
import type { GreenApiCredentials } from '@/api/types'
import { clearCredentials, saveCredentials } from './storage'
import { SessionContext } from './session-context'
import type {
  SessionContextValue,
  SessionResult,
  SessionStatus,
} from './session-context'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('disconnected')
  const [api, setApi] = useState<SessionContextValue['api']>(null)
  const [instanceState, setInstanceState] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attemptedCredentials, setAttemptedCredentials] =
    useState<GreenApiCredentials | null>(null)

  // Текущая попытка подключения, чтобы отменять её на размонтировании и при выходе.
  const abortRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  const logout = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null

    clearCredentials()

    setStatus('disconnected')
    setApi(null)
    setInstanceState(null)
    setError(null)
    setAttemptedCredentials(null)
  }, [])

  const connect = useCallback(
    async (credentials: GreenApiCredentials): Promise<SessionResult> => {
      // Предыдущая попытка, если она ещё висит, больше не нужна.
      abortRef.current?.abort()

      const controller = new AbortController()
      abortRef.current = controller

      setStatus('connecting')
      setError(null)
      setAttemptedCredentials(credentials)

      const client = createGreenApi(credentials)

      try {
        const { stateInstance } = await client.getStateInstance(
          controller.signal,
        )

        // Отменённая попытка не должна ни падать, ни менять состояние.
        if (controller.signal.aborted) {
          return { ok: false, error: 'Подключение отменено' }
        }

        setInstanceState(stateInstance)

        if (!isReadyState(stateInstance)) {
          // Реквизиты верны - сервер ответил осмысленным состоянием.
          // Сохраняем их, чтобы пользователь не вводил всё заново после QR-скана.
          saveCredentials(credentials)

          setStatus('disconnected')
          setApi(null)

          const message = describeInstanceState(stateInstance)

          setError(message)

          return { ok: false, error: message }
        }

        saveCredentials(credentials)

        setApi(client)
        setStatus('connected')

        return { ok: true, stateInstance }
      } catch (caught) {
        if (controller.signal.aborted) {
          return { ok: false, error: 'Подключение отменено' }
        }

        setStatus('disconnected')
        setApi(null)

        const message = toUserMessage(caught)

        setError(message)

        return { ok: false, error: message }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    [],
  )

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      api,
      instanceState,
      error,
      attemptedCredentials,
      connect,
      logout,
    }),
    [status, api, instanceState, error, attemptedCredentials, connect, logout],
  )

  return <SessionContext value={value}>{children}</SessionContext>
}
