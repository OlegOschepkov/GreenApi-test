/* oxlint-disable react-perf/jsx-no-new-function-as-prop */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { toUserMessage } from '@/api/greenApi'
import type { ChatHistoryMessage, IncomingNotification } from '@/api/types'
import { useIncomingMessages } from '@/hooks/useIncomingMessages'
import { useSession } from '@/services/session-context'
import { cssModule } from '@/styles/css-module'
import { formatTime, messageText, shouldShowAuthor } from '@/utils/chat'
import { formatPhone, parsePhone } from '@/utils/phone'
import rawStyles from './ChatScreen.module.scss'

const styles = cssModule(rawStyles, 'ChatScreen.module.scss')

const PHONE_FIELD_ID = 'chat-phone'
const PHONE_ERROR_ID = 'chat-phone-error'

const HISTORY_LIMIT = 50

/** Разумный предел длины текста: GREEN-API лимит не документирует. */
const MAX_MESSAGE_LENGTH = 4096

type ChatTarget = {
  chatId: string
  digits: string
  title: string
}

export function ChatScreen() {
  const { api, instanceState, logout } = useSession()

  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatTarget | null>(null)
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Отменяем поиск, если пользователь ушёл или начал новый раньше времени.
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Открытый чат нужен обработчику уведомлений, но опрос перезапускать при
  // смене чата нельзя, поэтому держим его в ref.
  const chatRef = useRef<ChatTarget | null>(null)

  chatRef.current = chat

  // Писать можно только в открытый чат, и не одновременно с поиском и отправкой.
  const composerDisabled = sending || busy || chat === null

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  /* oxlint-disable-next-line react/exhaustive-deps */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>): void {
    setPhone(event.target.value.replace(/\D/g, ''))
    setPhoneError(null)
  }

  function handleDraftChange(event: ChangeEvent<HTMLInputElement>): void {
    setDraft(event.target.value)
  }

  const handleNotification = useCallback(
    (notification: IncomingNotification): void => {
      // Без idMessage сообщение не приклеить к списку: ключи React должны
      // быть уникальны. Подтверждение уведомления всё равно произойдёт.
      if (notification.messageId === '') {
        return
      }

      setMessages((current) => {
        // То же самое сообщение приходит и из истории, и вебхуком
        // `outgoingAPIMessageReceived` — второй раз не показываем.
        if (current.some((item) => item.idMessage === notification.messageId)) {
          return current
        }

        // Чужие чаты подтверждены, но в открытый чат не попадают.
        if (notification.chatId !== chatRef.current?.chatId) {
          return current
        }

        return [
          ...current,
          {
            type: notification.isFromMe ? 'outgoing' : 'incoming',
            idMessage: notification.messageId,
            timestamp: notification.timestamp,
            chatId: notification.chatId,
            typeMessage: notification.typeMessage,
            textMessage: notification.text ?? undefined,
          },
        ]
      })
    },
    [],
  )

  useIncomingMessages(api, handleNotification)

  async function search(): Promise<void> {
    if (api === null) {
      return
    }

    const parsed = parsePhone(phone)

    if (!parsed.ok) {
      setPhoneError(parsed.error)

      return
    }

    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    setBusy(true)
    setError(null)
    setPhoneError(null)

    setPhone(parsed.digits.slice(1))

    try {
      const account = await api.checkAccount(
        { phoneNumber: Number(parsed.digits) },
        controller.signal,
      )

      if (controller.signal.aborted) {
        return
      }

      if (!account.exist) {
        setChat(null)
        setMessages([])
        setError('Этот номер не зарегистрирован в MAX')

        return
      }

      const history = await api.getChatHistory(
        { chatId: account.chatId, count: HISTORY_LIMIT },
        controller.signal,
      )

      if (controller.signal.aborted) {
        return
      }

      setChat({
        chatId: account.chatId,
        digits: parsed.digits,
        title: formatPhone(parsed.digits),
      })

      // getChatHistory уже отдаёт сообщения от старых к новым.
      setMessages(history)
    } catch (caught) {
      if (controller.signal.aborted) {
        return
      }

      setChat(null)
      setMessages([])
      setError(toUserMessage(caught))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }

      setBusy(false)
    }
  }

  async function send(): Promise<void> {
    const text = draft.trim()

    if (api === null || chat === null || text === '') {
      return
    }

    setSending(true)
    setError(null)

    try {
      const { idMessage } = await api.sendMessage({
        chatId: chat.chatId,
        message: text,
      })

      // Пустой ответ GREEN-API — это тоже отсутствие сообщения.
      if (idMessage !== '') {
        // Пузырь появляется после ответа сервера и с его idMessage: когда
        // придёт вебхук `outgoingAPIMessageReceived`, повтор отсеется.
        setMessages((current) => [
          ...current,
          {
            type: 'outgoing',
            idMessage,
            timestamp: Math.floor(Date.now() / 1000),
            chatId: chat.chatId,
            typeMessage: 'textMessage',
            textMessage: text,
          },
        ])
      }

      setDraft('')
    } catch (caught) {
      // Текст в поле и открытый чат сохраняем: сообщение можно повторить.
      setError(toUserMessage(caught))
    } finally {
      setSending(false)
    }
  }

  // Обёртка нужна, чтобы обработчик оставался синхронным: промис, который
  // провалится, попадёт в обработчик события и станет необработанным.
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    void search()
  }

  function handleSendSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    void send()
  }

  return (
    <main className={styles['screen']}>
      <section className={styles['panel']}>
        <header className={styles['header']}>
          <div className={styles['identity']}>
            <h1 className={styles['title']}>
              {chat === null ? 'Чат' : chat.title}
            </h1>
            <p className={styles['subtitle']}>
              {chat === null ? 'Найдите чат по номеру телефона' : chat.chatId}
            </p>
          </div>

          <div className={styles['header-actions']}>
            <span
              className={styles['badge']}
              data-state={instanceState ?? 'unknown'}
            >
              {instanceState ?? 'unknown'}
            </span>
            <button className={styles['logout']} type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </header>

        <form
          className={styles['search']}
          noValidate
          onSubmit={handleSearchSubmit}
        >
          <label className={styles['phone-prefix']} htmlFor={PHONE_FIELD_ID}>
            +7
          </label>
          <input
            className={styles['phone-input']}
            id={PHONE_FIELD_ID}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="900 123-45-67"
            value={phone}
            onChange={handlePhoneChange}
            aria-invalid={phoneError !== null}
            aria-describedby={phoneError === null ? undefined : PHONE_ERROR_ID}
            disabled={busy}
          />
          <button
            className={styles['search-button']}
            type="submit"
            disabled={busy}
          >
            {busy ? 'Ищем…' : 'Найти'}
          </button>
        </form>

        {phoneError !== null && (
          <p className={styles['error']} id={PHONE_ERROR_ID} role="alert">
            {phoneError}
          </p>
        )}

        {error !== null && (
          <p className={styles['error']} role="alert">
            {error}
          </p>
        )}

        <div className={styles['thread']}>
          {chat === null ? (
            <p className={styles['placeholder']}>
              Введите номер и нажмите «Найти», чтобы открыть переписку.
            </p>
          ) : messages.length === 0 ? (
            <p className={styles['placeholder']}>
              Сообщений в этом чате пока нет.
            </p>
          ) : (
            messages.map((message) => (
              <article
                key={message.idMessage}
                className={styles['bubble']}
                data-side={message.type}
              >
                {shouldShowAuthor(message.type) &&
                  message.senderName !== undefined &&
                  message.senderName !== '' && (
                    <span className={styles['author']}>
                      {message.senderName}
                    </span>
                  )}

                <p className={styles['bubble-text']}>{messageText(message)}</p>

                <time className={styles['bubble-time']}>
                  {formatTime(message.timestamp)}
                </time>
              </article>
            ))
          )}

          <div ref={bottomRef} />
        </div>

        <form className={styles['composer']} onSubmit={handleSendSubmit}>
          <input
            className={styles['composer-input']}
            type="text"
            placeholder="Сообщение"
            autoComplete="off"
            maxLength={MAX_MESSAGE_LENGTH}
            value={draft}
            onChange={handleDraftChange}
            disabled={composerDisabled}
            aria-label="Текст сообщения"
          />
          <button
            className={styles['send-button']}
            type="submit"
            disabled={composerDisabled || draft.trim() === ''}
          >
            {sending ? 'Отправляем…' : 'Отправить'}
          </button>
        </form>
      </section>
    </main>
  )
}
