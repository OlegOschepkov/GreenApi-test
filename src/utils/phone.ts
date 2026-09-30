/**
 *
 * Код страны подставляет форма: пользователь вводит только 10 цифр номера
 * (`900 123-45-67`), а наружу отдаём готовые 11 цифр с семёркой — то, что
 * уходит в `CheckWhatsapp`.
 */

const RU_COUNTRY_CODE = '7'
const RU_TOTAL_LENGTH = 11
const RU_NATIONAL_LENGTH = 10

export type PhoneParseResult =
  { ok: true; digits: string } | { ok: false; error: string }

export function parsePhone(raw: string): PhoneParseResult {
  const digits = raw.replace(/\D/g, '')

  let normalized = digits

  if (digits.length === RU_NATIONAL_LENGTH) {
    if (digits.startsWith(RU_COUNTRY_CODE) || digits.startsWith('8')) {
      return {
        ok: false,
        error: 'Похоже, в нём остался код +7 — введите 10 цифр номера',
      }
    }

    normalized = RU_COUNTRY_CODE + digits
  } else if (digits.length === RU_TOTAL_LENGTH && digits.startsWith('8')) {
    // Полный номер со старым префиксом 8 нормализуем на семёрку.
    normalized = RU_COUNTRY_CODE + digits.slice(1)
  }

  if (
    normalized.length === RU_TOTAL_LENGTH &&
    normalized.startsWith(RU_COUNTRY_CODE)
  ) {
    return { ok: true, digits: normalized }
  }

  return { ok: false, error: 'Введите 10 цифр номера без кода +7' }
}

/** Представление для показа пользователю: `+7 (900) 123-45-67`. */
export function formatPhone(digits: string): string {
  if (
    digits.length !== RU_TOTAL_LENGTH ||
    !digits.startsWith(RU_COUNTRY_CODE)
  ) {
    return digits
  }

  const area = digits.slice(1, 4)
  const national = digits.slice(4)

  return `+7 (${area}) ${national.slice(0, 3)}-${national.slice(3, 5)}-${national.slice(5)}`
}
