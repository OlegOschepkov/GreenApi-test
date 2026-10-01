import { createContext, useContext } from 'react'

import type { GreenApi } from '@/api/greenApi'
import type { GreenApiCredentials } from '@/api/types'

/**
 * `disconnected` - нет подключения или последняя попытка не удалась,
 * `connecting` - идёт проверка реквизитов,
 * `connected` - инстанс авторизован, можно работать с сообщениями.
 */
export type SessionStatus = 'disconnected' | 'connecting' | 'connected'

export type SessionResult =
  { ok: true; stateInstance: string } | { ok: false; error: string }

export type SessionContextValue = {
  status: SessionStatus
  /** Готовый клиент. Не null только в статусе `connected`. */
  api: GreenApi | null
  /** Последнее известное состояние инстанса, даже если не удалось подключиться. */
  instanceState: string | null
  /** Текст последней ошибки для показа пользователю. */
  error: string | null
  /**
   * Реквизиты последней попытки. Нужны форме, чтобы не стирать введённое
   * при неудачном подключении.
   */
  attemptedCredentials: GreenApiCredentials | null
  connect: (credentials: GreenApiCredentials) => Promise<SessionResult>
  /**
   * Выход: отменяет попытку, удаляет реквизиты из localStorage и сбрасывает
   * состояние. Очистка хранилища спрятана здесь намеренно - вызывающий код не
   * сможет забыть про неё.
   */
  logout: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Достаёт сессию. Бросает ошибку, если компонент оказался вне провайдера -
 * это ошибка разработки, а не пользовательский сценарий.
 */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)

  if (value === null) {
    throw new Error('useSession можно вызывать только внутри <SessionProvider>')
  }

  return value
}
