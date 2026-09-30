import type { GreenApiCredentials } from './types'

/** Имя поля, к которому относится сообщение об ошибке. */
export type CredentialsField = keyof GreenApiCredentials

export const CREDENTIAL_FIELDS = [
  'idInstance',
  'apiTokenInstance',
] as const satisfies readonly CredentialsField[]

/**
 * Строгая проверка имени поля.
 *
 * `name` у `<input>` приходит строкой, и без этой проверки любое лишнее поле
 * в форме записалось бы в состояние под чужим ключом.
 */
export function isCredentialsField(value: string): value is CredentialsField {
  return (CREDENTIAL_FIELDS as readonly string[]).includes(value)
}

export type CredentialsFormValues = Record<CredentialsField, string>

export type CredentialsValidation =
  | { ok: true; credentials: GreenApiCredentials }
  | { ok: false; errors: Partial<Record<CredentialsField, string>> }

export const EMPTY_CREDENTIALS: CredentialsFormValues = {
  idInstance: '',
  apiTokenInstance: '',
}

function validateIdInstance(raw: string): string | null {
  const value = raw.trim()

  if (value.length === 0) {
    return 'Укажите номер инстанса'
  }

  if (!/^\d+$/.test(value)) {
    return 'Номер инстанса состоит только из цифр'
  }

  return null
}

function validateToken(raw: string): string | null {
  const value = raw.trim()

  if (value.length === 0) {
    return 'Укажите токен доступа'
  }

  // Пробелы внутри токена почти всегда означают, что его скопировали из
  // сообщения вместе с обёрткой.
  if (/\s/.test(value)) {
    return 'Токен не должен содержать пробелы'
  }

  return null
}

/** Валидирует форму подключения и собирает готовые реквизиты. */
export function validateCredentials(
  values: CredentialsFormValues,
): CredentialsValidation {
  const errors: Partial<Record<CredentialsField, string>> = {}

  const idInstanceError = validateIdInstance(values.idInstance)
  const tokenError = validateToken(values.apiTokenInstance)

  if (idInstanceError !== null) {
    errors['idInstance'] = idInstanceError
  }

  if (tokenError !== null) {
    errors['apiTokenInstance'] = tokenError
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    credentials: {
      idInstance: values.idInstance.trim(),
      apiTokenInstance: values.apiTokenInstance.trim(),
    },
  }
}
