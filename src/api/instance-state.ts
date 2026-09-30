import { isKnownInstanceState } from './types'
import type { KnownInstanceState } from './types'

const STATE_EXPLANATIONS: Readonly<Record<KnownInstanceState, string>> = {
  authorized: 'Инстанс авторизован и готов к работе',
  notAuthorized:
    'Инстанс не привязан к WhatsApp. Отсканируйте QR-код в личном кабинете GREEN-API',
  starting: 'Инстанс запускается. Повторите подключение через несколько секунд',
  blocked:
    'WhatsApp заблокировал инстанс. Скорее всего, слишком много попыток входа или жалоба на спам',
  sleepMode:
    'Инстанс в спящем режиме. Выведите его из сна в личном кабинете — спящий инстанс не принимает сообщения',
  suspended: 'Инстанс приостановлен в личном кабинете GREEN-API',
  yellowCard:
    'WhatsApp выдал инстансу жёлтую карточку за нарушения. Нужна проверка аккаунта',
}

/** Пояснение для состояния; при неизвестном значении показываем его как есть. */
export function describeInstanceState(state: string): string {
  if (isKnownInstanceState(state)) {
    return STATE_EXPLANATIONS[state]
  }

  return `Неизвестное состояние инстанса: ${state}`
}

/** Единственное состояние, при котором можно работать с сообщениями. */
export function isReadyState(state: string): boolean {
  return state === 'authorized'
}
