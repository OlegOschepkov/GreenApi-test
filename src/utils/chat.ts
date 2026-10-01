/**
 * Показ сообщений в переписке.
 *
 * История приходит от сервера простым массивом, и почти всё в ней - текст.
 * Всё, что текстом не является, показываем подписью по типу: молчаливый пропуск
 * выглядел бы как потеря сообщения.
 */

/** Типы `typeMessage`, которые встречаются чаще всего. */
const TYPE_LABELS: Readonly<Record<string, string>> = {
  textMessage: 'Текстовое сообщение',
  extendedTextMessage: 'Текстовое сообщение',
  imageMessage: 'Изображение',
  videoMessage: 'Видео',
  voiceMessage: 'Голосовое сообщение',
  audioMessage: 'Аудио',
  documentMessage: 'Файл',
  stickerMessage: 'Стикер',
  locationMessage: 'Местоположение',
  contactMessage: 'Контакт',
  reactionMessage: 'Реакция',
  pollMessage: 'Опрос',
}

/** `HH:MM` по местному времени. */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

/** Текст пузыря: сам текст, а для прочих типов - подпись по типу. */
export function messageText(message: {
  typeMessage: string
  textMessage?: string
}): string {
  const text = message.textMessage?.trim()

  if (text !== undefined && text.length > 0) {
    return text
  }

  return TYPE_LABELS[message.typeMessage] ?? `Тип ${message.typeMessage}`
}

export function shouldShowAuthor(type: 'incoming' | 'outgoing'): boolean {
  return type === 'incoming'
}
