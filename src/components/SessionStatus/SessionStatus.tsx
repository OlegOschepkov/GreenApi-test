import { describeInstanceState } from '@/api/instance-state'
import { cssModule } from '@/styles/css-module'
import { useSession } from '@/services/session-context'
import rawStyles from './SessionStatus.module.scss'

const styles = cssModule(rawStyles, 'SessionStatus.module.scss')

/**
 * Заглушка подключённого состояния: переписка появится на следующем этапе,
 * но показать, что подключение состоялось и реквизиты приняты, нужно уже сейчас.
 */
export function SessionStatus() {
  const { instanceState, attemptedCredentials, logout } = useSession()

  return (
    <main className={styles['screen']}>
      <section className={styles['card']}>
        <p className={styles['badge']} data-state={instanceState ?? 'unknown'}>
          Подключено
        </p>

        <h1 className={styles['title']}>Инстанс авторизован</h1>
        <p className={styles['subtitle']}>
          {describeInstanceState(instanceState ?? '')}
        </p>

        <dl className={styles['facts']}>
          <dt className={styles['term']}>idInstance</dt>
          <dd className={styles['value']}>
            {attemptedCredentials?.idInstance ?? '—'}
          </dd>
        </dl>

        <p className={styles['note']}>
          Реквизиты приняты. Список чатов, переписка и отправка сообщений
          появятся на следующем этапе.
        </p>

        <button className={styles['logout']} type="button" onClick={logout}>
          Выйти и удалить реквизиты
        </button>
      </section>
    </main>
  )
}
