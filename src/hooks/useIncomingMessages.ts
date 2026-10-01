import { useEffect, useRef } from 'react'

import type { GreenApi } from '@/api/greenApi'
import type { IncomingNotification } from '@/api/types'

/**
 * Живое получение сообщений.
 *
 * GREEN-API отдаёт уведомления только длинным опросом: один вызов висит до
 * `receiveTimeout` секунд и возвращает либо уведомление, либо пустой ответ.
 * Поэтому «получение» — это бесконечный цикл таких вызовов, а каждое
 * уведомление обязательно подтверждается DeleteNotification: без этого
 * очередь перестанет разбираться и сообщения перестанут приходить.
 */

/** Долгий таймаут вместо дефолтных пяти секунд — меньше запросов к инстансу. */
const RECEIVE_TIMEOUT_SECONDS = 30

/** Пауза перед повтором после ошибки, чтобы не долбить инстанс. */
const RETRY_DELAY_MS = 3000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Вызывает `onNotification` для каждого уведомления, пока `api` не станет
 * `null` или компонент не размонтируется. Непрочитанные чаты, на которые
 * нет подписчика, просто подтверждаются и теряются.
 */
export function useIncomingMessages(
  api: GreenApi | null,
  onNotification: (notification: IncomingNotification) => void,
): void {
  // Колбэк пересоздаётся на каждом рендере, но опрос из-за него
  // перезапускать нельзя, поэтому храним его в ref.
  const notifyRef = useRef(onNotification)

  useEffect(() => {
    notifyRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    // Внутри функции опроса `api` уже не сузить проверкой ниже, поэтому
    // заводим локальную ссылку — так же сделано в SessionProvider.
    const client = api

    const controller = new AbortController()
    const { signal } = controller

    // Один слушатель отмены на весь цикл: на каждый таймаут ожидания
    // новый вешать не нужно.
    const aborted = new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => resolve(), { once: true })
    })

    async function poll(): Promise<void> {
      // Клиента нет — опроса нет. Контролер всё равно нужен, чтобы
      // cleanup был не пустым.
      if (client === null) {
        return
      }

      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification({
            receiveTimeout: RECEIVE_TIMEOUT_SECONDS,
            signal,
          })

          // null — за receiveTimeout ничего не пришло, это норма.
          if (notification === null) {
            continue
          }

          notifyRef.current(notification)

          // Подтверждать нужно даже то, что не нашлось подписчика: пока
          // receiptId не удалён, уведомление лежит в очереди. receiptId 0 —
          // сервер не прислал, подтверждать нечем.
          if (notification.receiptId !== 0) {
            await client.deleteNotification(notification.receiptId, signal)
          }
        } catch {
          if (signal.aborted) {
            return
          }

          // Обрыв связи или ошибка инстанса. Молча ждём и опрашиваем снова.
          await Promise.race([sleep(RETRY_DELAY_MS), aborted])
        }
      }
    }

    void poll()

    return () => {
      controller.abort()
    }
  }, [api])
}
