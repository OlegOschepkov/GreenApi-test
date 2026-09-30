import {
  RECEIVE_TIMEOUT_DEFAULT_SECONDS,
  RECEIVE_TIMEOUT_MAX_SECONDS,
  RECEIVE_TIMEOUT_MIN_SECONDS,
} from './types'
import type {
  CheckWhatsappRequest,
  CheckWhatsappResponse,
  ChatHistoryMessage,
  DeleteNotificationResponse,
  GetChatHistoryRequest,
  GetStateInstanceResponse,
  GreenApiCredentials,
  IncomingNotification,
  SendMessageRequest,
  SendMessageResponse,
} from './types'

/* ── Ошибки ──────────────────────────────────────────────────────────────── */

/**
 * Домен GREEN-API.
 *
 * Пользователю его вводить не нужно: значение из личного кабинета у всех
 * облачных инстансов одинаковое (старый домен `api.green-api.com` тоже
 * работает, проверено пробами). Если инстанс развёрнут на своём сервере —
 * это единственная строка, которую надо поменять.
 */
const GREEN_API_URL = 'https://api.greenapi.com'

/**
 * `config` — неверный адрес в коде, `network` — нет связи или CORS,
 * `http` — сервер ответил ошибкой, `parse` — ответ не разобрался.
 */
export type GreenApiErrorKind = 'config' | 'network' | 'http' | 'parse'

export class GreenApiError extends Error {
  readonly kind: GreenApiErrorKind
  readonly status: number | null
  /** Тело ответа как есть — для диагностики. */
  readonly rawBody: string

  constructor(
    message: string,
    kind: GreenApiErrorKind,
    options: { status?: number | null; rawBody?: string } = {},
  ) {
    super(message)
    this.name = 'GreenApiError'
    this.kind = kind
    this.status = options.status ?? null
    this.rawBody = options.rawBody ?? ''
  }
}

/** Тексты для кодов, которые чаще всего видит пользователь. */
const STATUS_FALLBACK: Readonly<Record<number, string>> = {
  401: 'Неверный idInstance или apiTokenInstance',
  403: 'Доступ запрещён: проверьте реквизиты и имя метода',
  429: 'Слишком много запросов — попробуйте позже',
  466: 'Исчерпан лимит тарифа GREEN-API',
}

/* ── Вспомогательные функции ─────────────────────────────────────────────── */

/**
 * Разобранный объект JSON.
 *
 * Называется не `Record`, чтобы не затенять встроенный `Record<K, V>` из
 * стандартной библиотеки: внутри собственной декларации такой алиас сослался
 * бы на сам себя, и получилась бы циклическая ссылка в типах.
 */
type JsonObject = Readonly<Record<string, unknown>>

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(source: JsonObject, key: string): string | null {
  const value = source[key]

  return typeof value === 'string' && value.length > 0 ? value : null
}

function required<T>(value: T | null, method: string): T {
  if (value === null) {
    throw new TypeError(`GREEN-API вернул пустой ответ на ${method}`)
  }

  return value
}

function clampReceiveTimeout(value: number): number {
  return Math.min(
    RECEIVE_TIMEOUT_MAX_SECONDS,
    Math.max(RECEIVE_TIMEOUT_MIN_SECONDS, Math.trunc(value)),
  )
}

/**
 * Достаёт текст ошибки из тела любой формы: JSON с `message`, JSON с
 * вложенным `invokeStatus`, голый текст. HTML-заглушка nginx и пустое тело
 * (так приходит 401) текста не дают — подставляется STATUS_FALLBACK.
 */
function extractErrorMessage(rawBody: string): string | null {
  const trimmed = rawBody.trim()

  if (trimmed.length === 0 || trimmed.startsWith('<')) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)

    if (typeof parsed === 'string') {
      return parsed
    }

    if (isRecord(parsed)) {
      const invokeStatus = parsed['invokeStatus']

      if (isRecord(invokeStatus)) {
        return readString(invokeStatus, 'description')
      }

      return readString(parsed, 'message')
    }
  } catch {
    // Не JSON — покажем текст как есть.
  }

  return trimmed
}

function buildUrl(
  credentials: GreenApiCredentials,
  method: string,
  options: { pathSuffix?: string; query?: Record<string, number> } = {},
): URL {
  const suffix =
    options.pathSuffix === undefined ? '' : `/${options.pathSuffix}`

  let url: URL

  try {
    // Формат подтверждён пробами: {домен}/waInstance{id}/{method}/{token}
    url = new URL(
      `${GREEN_API_URL}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${suffix}`,
    )
  } catch {
    throw new GreenApiError(
      `Некорректный адрес GREEN-API в коде: «${GREEN_API_URL}». Ожидается https://api.greenapi.com`,
      'config',
    )
  }

  for (const [key, value] of Object.entries(options.query ?? {})) {
    url.searchParams.set(key, String(value))
  }

  return url
}

/**
 * Один вызов GREEN-API. Возвращает `null`, если ответ 200 с ПУСТЫМ телом —
 * это нормальный сценарий ReceiveNotification по истечении receiveTimeout.
 */
async function call<T = unknown>(
  credentials: GreenApiCredentials,
  method: string,
  options: {
    httpMethod?: 'GET' | 'POST' | 'DELETE'
    pathSuffix?: string
    query?: Record<string, number>
    body?: unknown
    signal?: AbortSignal
  } = {},
): Promise<T | null> {
  const url = buildUrl(credentials, method, options)
  const headers: Record<string, string> = {}

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response

  try {
    response = await fetch(url, {
      method: options.httpMethod ?? 'GET',
      headers,
      body: options.body === undefined ? null : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    // fetch бросает и на сетевых сбоях, и на CORS, и на отмену через AbortSignal.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new GreenApiError(
      'Не удалось соединиться с GREEN-API: проверьте интернет-соединение',
      'network',
    )
  }

  const rawBody = await response.text()

  if (!response.ok) {
    const message =
      extractErrorMessage(rawBody) ??
      STATUS_FALLBACK[response.status] ??
      `GREEN-API вернул HTTP ${response.status}`

    throw new GreenApiError(message, 'http', {
      status: response.status,
      rawBody,
    })
  }

  if (rawBody.trim().length === 0) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(rawBody)

    // Граница доверия к сети: полная проверка каждой формы ответа означала бы
    // продублировать types.ts ещё раз. Контракт описан типами, и это единственное
    // место в проекте, где ответ из сети превращается в типизированное значение.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- обоснование выше
    return parsed as T
  } catch {
    throw new GreenApiError(
      'GREEN-API вернул ответ, который не является JSON',
      'parse',
      {
        status: response.status,
        rawBody,
      },
    )
  }
}

/* ── Разбор входящего уведомления ────────────────────────────────────────── */

/** Оба исходящих вебхука: отправлено через API и отправлено с телефона. */
const OUTGOING_WEBHOOKS = new Set([
  'outgoingAPIMessageReceived',
  'outgoingMessageReceived',
])

/**
 * Вытаскивает из вебхука то, что нужно мессенджеру: адресат, текст и флаг
 * «своё или чужое». Вложенность `senderData`/`messageData` разбирается
 * с проверкой типов, потому что приходит из сети.
 */
function normalizeNotification(
  body: unknown,
  receiptId: number,
): IncomingNotification {
  const source = isRecord(body) ? body : {}
  const sender = isRecord(source['senderData']) ? source['senderData'] : {}
  const messageData = isRecord(source['messageData'])
    ? source['messageData']
    : {}
  const textData = isRecord(messageData['textMessageData'])
    ? messageData['textMessageData']
    : {}
  const extended = isRecord(messageData['extendedTextMessageData'])
    ? messageData['extendedTextMessageData']
    : {}

  return {
    // 0 означает, что сервер не прислал receiptId и подтверждать нечем.
    receiptId,
    chatId: readString(sender, 'chatId') ?? '',
    messageId: readString(source, 'idMessage') ?? '',
    timestamp:
      typeof source['timestamp'] === 'number' ? source['timestamp'] : 0,
    // Присылают либо textMessage, либо extendedTextMessage.
    text: readString(textData, 'textMessage') ?? readString(extended, 'text'),
    isFromMe: OUTGOING_WEBHOOKS.has(readString(source, 'typeWebhook') ?? ''),
  }
}

/* ── Публичный клиент ────────────────────────────────────────────────────── */

/**
 * Тонкая обёртка над HTTP. Создаётся один раз на подключение и передаётся по
 * приложению через контекст сессии.
 */
export function createGreenApi(credentials: GreenApiCredentials) {
  /** Ответ содержит только `stateInstance`. */
  async function getStateInstance(
    signal?: AbortSignal,
  ): Promise<GetStateInstanceResponse> {
    return required(
      await call<GetStateInstanceResponse>(credentials, 'getStateInstance', {
        signal,
      }),
      'getStateInstance',
    )
  }

  /** Проверка наличия WhatsApp и получение chatId. */
  async function checkWhatsapp(
    payload: CheckWhatsappRequest,
    signal?: AbortSignal,
  ): Promise<CheckWhatsappResponse> {
    if (
      (payload.chatId === undefined) ===
      (payload.phoneNumber === undefined)
    ) {
      throw new TypeError(
        'checkWhatsapp требует ровно одно из chatId или phoneNumber',
      )
    }

    return required(
      await call<CheckWhatsappResponse>(credentials, 'checkWhatsapp', {
        httpMethod: 'POST',
        body: payload,
        signal,
      }),
      'checkWhatsapp',
    )
  }

  /** Отправка текстового сообщения. Ответ содержит только `idMessage`. */
  async function sendMessage(
    payload: SendMessageRequest,
    signal?: AbortSignal,
  ): Promise<SendMessageResponse> {
    return required(
      await call<SendMessageResponse>(credentials, 'sendMessage', {
        httpMethod: 'POST',
        body: payload,
        signal,
      }),
      'sendMessage',
    )
  }

  /**
   * Длинный опрос. `null` — за `receiveTimeout` секунд ничего не пришло, и это
   * норма, а не ошибка. Полученное уведомление нужно подтвердить через
   * deleteNotification, иначе очередь встанет.
   */
  async function receiveNotification(
    options: { receiveTimeout?: number; signal?: AbortSignal } = {},
  ): Promise<IncomingNotification | null> {
    const receiveTimeout =
      options.receiveTimeout === undefined
        ? RECEIVE_TIMEOUT_DEFAULT_SECONDS
        : clampReceiveTimeout(options.receiveTimeout)

    const response = await call<{ receiptId?: unknown; body?: unknown }>(
      credentials,
      'receiveNotification',
      { query: { receiveTimeout }, signal: options.signal },
    )

    if (response === null) {
      return null
    }

    return normalizeNotification(
      response.body,
      typeof response.receiptId === 'number' ? response.receiptId : 0,
    )
  }

  /** Подтверждение уведомления. `receiptId` уходит в путь, метод DELETE. */
  async function deleteNotification(
    receiptId: number,
    signal?: AbortSignal,
  ): Promise<DeleteNotificationResponse> {
    return required(
      await call<DeleteNotificationResponse>(
        credentials,
        'deleteNotification',
        {
          httpMethod: 'DELETE',
          pathSuffix: String(receiptId),
          signal,
        },
      ),
      'deleteNotification',
    )
  }

  /** История чата: ПЛОСКИЙ МАССИВ по времени убыванием, пагинации нет. */
  async function getChatHistory(
    payload: GetChatHistoryRequest,
    signal?: AbortSignal,
  ): Promise<ChatHistoryMessage[]> {
    const messages = await call<ChatHistoryMessage[]>(
      credentials,
      'getChatHistory',
      {
        httpMethod: 'POST',
        body: payload,
        signal,
      },
    )

    return messages ?? []
  }

  return {
    getStateInstance,
    checkWhatsapp,
    sendMessage,
    receiveNotification,
    deleteNotification,
    getChatHistory,
  }
}

export type GreenApi = ReturnType<typeof createGreenApi>
