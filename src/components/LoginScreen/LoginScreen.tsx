/* oxlint-disable react-perf/jsx-no-new-function-as-prop */

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import {
  EMPTY_CREDENTIALS,
  isCredentialsField,
  validateCredentials,
} from '@/api/credentials'
import type { CredentialsField, CredentialsFormValues } from '@/api/credentials'
import { cssModule } from '@/styles/css-module'
import { useSession } from '@/services/session-context'
import { loadCredentials } from '@/services/storage'
import rawStyles from './LoginScreen.module.scss'

const styles = cssModule(rawStyles, 'LoginScreen.module.scss')

type FieldErrors = Partial<Record<CredentialsField, string>>

const ID_INSTANCE_FIELD_ID = 'login-id-instance'
const TOKEN_FIELD_ID = 'login-token'
const ID_INSTANCE_ERROR_ID = 'login-id-instance-error'
const TOKEN_ERROR_ID = 'login-token-error'

export function LoginScreen() {
  const { status, error, connect } = useSession()
  const [values, setValues] = useState<CredentialsFormValues>(
    () => loadCredentials() ?? EMPTY_CREDENTIALS,
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [tokenVisible, setTokenVisible] = useState(false)

  const isConnecting = status === 'connecting'

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target

    if (!isCredentialsField(name)) {
      return
    }

    setValues((previous) => ({ ...previous, [name]: value }))
    // Ошибку поля снимаем сразу, чтобы подсказка не мешала печатать.
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  async function submit(): Promise<void> {
    const validation = validateCredentials(values)

    if (!validation.ok) {
      setFieldErrors(validation.errors)

      return
    }

    setFieldErrors({})

    await connect(validation.credentials)
  }

  // Обёртка нужна, чтобы обработчик оставался синхронным: промис, который
  // провалится, попадёт в обработчик события и станет необработанным.
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    void submit()
  }

  return (
    <main className={styles['screen']}>
      <section className={styles['card']}>
        <header className={styles['header']}>
          <div className={styles['badge']} aria-hidden="true">
            MAX
          </div>
          <h1 className={styles['title']}>Подключение к GREEN-API</h1>
          <p className={styles['subtitle']}>
            Реквизиты берутся в личном кабинете GREEN-API. Проверим их запросом{' '}
            <code className={styles['code']}>GetStateInstance</code>.
          </p>
        </header>

        {error !== null && (
          <p className={styles['error']} role="alert">
            {error}
          </p>
        )}

        <form className={styles['form']} noValidate onSubmit={handleSubmit}>
          <div className={styles['field']}>
            <label className={styles['label']} htmlFor={ID_INSTANCE_FIELD_ID}>
              Номер инстанса (idInstance)
            </label>
            <input
              className={styles['input']}
              id={ID_INSTANCE_FIELD_ID}
              name="idInstance"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1100123456"
              value={values.idInstance}
              onChange={handleChange}
              aria-invalid={fieldErrors['idInstance'] !== undefined}
              aria-describedby={
                fieldErrors['idInstance'] === undefined
                  ? undefined
                  : ID_INSTANCE_ERROR_ID
              }
              disabled={isConnecting}
            />
            {fieldErrors['idInstance'] !== undefined && (
              <p className={styles['field-error']} id={ID_INSTANCE_ERROR_ID}>
                {fieldErrors['idInstance']}
              </p>
            )}
          </div>

          <div className={styles['field']}>
            <label className={styles['label']} htmlFor={TOKEN_FIELD_ID}>
              Токен доступа (apiTokenInstance)
            </label>
            <div className={styles['input-row']}>
              <input
                className={styles['input']}
                id={TOKEN_FIELD_ID}
                name="apiTokenInstance"
                type={tokenVisible ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={values.apiTokenInstance}
                onChange={handleChange}
                aria-invalid={fieldErrors['apiTokenInstance'] !== undefined}
                aria-describedby={
                  fieldErrors['apiTokenInstance'] === undefined
                    ? undefined
                    : TOKEN_ERROR_ID
                }
                disabled={isConnecting}
              />
              <button
                className={styles['reveal']}
                type="button"
                onClick={() => {
                  setTokenVisible((visible) => !visible)
                }}
                disabled={isConnecting}
              >
                {tokenVisible ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {fieldErrors['apiTokenInstance'] !== undefined && (
              <p className={styles['field-error']} id={TOKEN_ERROR_ID}>
                {fieldErrors['apiTokenInstance']}
              </p>
            )}
          </div>

          <button
            className={styles['submit']}
            type="submit"
            disabled={isConnecting}
            data-busy={isConnecting ? 'true' : 'false'}
          >
            {isConnecting ? 'Подключение…' : 'Подключиться'}
          </button>
        </form>

        <p className={styles['note']}>
          Реквизиты сохраняются в этом браузере, чтобы не вводить их каждый раз.
          Токен передаётся в адресе запроса - не используйте его на общем
          компьютере. Выход удаляет данные.
        </p>
      </section>
    </main>
  )
}
