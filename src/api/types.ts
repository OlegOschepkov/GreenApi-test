/** Реквизиты доступа. Брать из личного кабинета GREEN-API. */
export type GreenApiCredentials = {
  /** Номер инстанса. В URL подставляется как `waInstance{id}`. */
  idInstance: string
  /** Токен доступа. В URL подставляется последним сегментом пути. */
  apiTokenInstance: string
}

/* ── GetStateInstance ─────────────────────────────────────────────────────── */

/**
 * sleepMode и yellowCard помечены устаревшими, но всё ещё приходят от сервера - поэтому оставлены.
 */
export const INSTANCE_STATES = [
  'authorized',
  'notAuthorized',
  'starting',
  'blocked',
  'sleepMode',
  'suspended',
  'yellowCard',
] as const

export type KnownInstanceState = (typeof INSTANCE_STATES)[number]

export type GetStateInstanceResponse = {
  stateInstance: string
}

export function isKnownInstanceState(
  value: string,
): value is KnownInstanceState {
  return (INSTANCE_STATES as readonly string[]).includes(value)
}

/* ── CheckAccount ─────────────────────────────────────────────────────────── */

export type CheckAccountRequest = {
  /** Номер без плюса и пробелов, только цифры: `79991234567`. */
  phoneNumber: number
}

export type CheckAccountResponse = {
  /** false - такого номера в MAX нет. */
  exist: boolean
  /** С этим chatId работают `getChatHistory` и `sendMessage`. */
  chatId: string
}

/* ── SendMessage ─────────────────────────────────────────────────────────── */

export type SendMessageRequest = {
  chatId: string
  message: string
  typingTime?: number
}

/** Ответ */
export type SendMessageResponse = {
  idMessage: string
}

/* ── ReceiveNotification ─────────────────────────────────────────────────── */

export const RECEIVE_TIMEOUT_MIN_SECONDS = 5
export const RECEIVE_TIMEOUT_MAX_SECONDS = 60
export const RECEIVE_TIMEOUT_DEFAULT_SECONDS = 5

/**
 * Уведомление, приведённое к тому, что нужно мессенджеру.
 *
 * `text === null` означает «пришло не текстовое сообщение»: уведомление всё
 * равно нужно подтвердить через DeleteNotification, иначе очередь встанет.
 * `chatId` пустой, только если сервер прислал нестандартный `senderData` -
 * такое уведомление некуда маршрутизировать, его просто подтверждают.
 */
export type IncomingNotification = {
  /** Обязателен для подтверждения через DeleteNotification. */
  receiptId: number
  chatId: string
  messageId: string
  timestamp: number
  /** Тип из `messageData.typeMessage`: текст, изображение, стикер и так далее. */
  typeMessage: string
  text: string | null
  isFromMe: boolean
}

/* ── DeleteNotification ──────────────────────────────────────────────────── */

/** `receiptId` передаётся в ПУТИ, а не в теле запроса. HTTP-метод - DELETE. */
export type DeleteNotificationResponse = {
  result: boolean
}

/* ── GetChatHistory ──────────────────────────────────────────────────────── */

export type GetChatHistoryRequest = {
  chatId: string
  count?: number
}

/**
 * История
 */
export type ChatHistoryMessage = {
  type: 'incoming' | 'outgoing'
  idMessage: string
  timestamp: number
  chatId: string
  typeMessage: string
  statusMessage?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  /** Текст для textMessage и extendedTextMessage. */
  textMessage?: string
  senderName?: string
}
