import type { GreenApiCredentials } from '@/api/types'

/**
 * Реквизиты лежат в localStorage, чтобы не вводить их после каждой перезагрузки.
 *
 * Цена этого решения: токен GREEN-API хранится в браузере в открытом виде и
 * попадает в URL каждого запроса. Для учебного/локального приложения это
 * приемлемо, для публичного - нет. Поэтому при выходе из аккаунта данные
 * обязательно удаляются.
 */
const STORAGE_KEY = 'green-api:credentials'

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(
  source: Readonly<Record<string, unknown>>,
  key: string,
): string | null {
  const value = source[key]

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

/**
 * Читает сохранённые реквизиты. Любой мусор в хранилище (другая версия
 * приложения, ручная правка, битый JSON) считается отсутствием реквизитов,
 * а не ошибкой - пользователь просто увидит пустую форму.
 */
export function loadCredentials(): GreenApiCredentials | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (raw === null) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    if (!isRecord(parsed)) {
      return null
    }

    const idInstance = readString(parsed, 'idInstance')
    const apiTokenInstance = readString(parsed, 'apiTokenInstance')

    if (idInstance === null || apiTokenInstance === null) {
      return null
    }

    return { idInstance, apiTokenInstance }
  } catch {
    // Приватный режим Safari и переполнение квоты роняют обращения к localStorage.
    return null
  }
}

/** Сохраняет реквизиты. Возвращает false, если хранилище недоступно. */
export function saveCredentials(credentials: GreenApiCredentials): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))

    return true
  } catch {
    return false
  }
}

/** Выход из аккаунта: реквизиты удаляются из браузера. */
export function clearCredentials(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Нечего делать: хранилище и так недоступно.
  }
}
