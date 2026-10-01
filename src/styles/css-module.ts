/**
 * Типизация CSS Modules в vite/client - это `Record<string, string>`, поэтому
 * опечатка в имени класса (`styles.buble`) спокойно компилируется и в рантайме
 * даёт undefined, а элемент молча теряет стили. styled-components от этого
 * защищался типизированными пропсами, здесь ловим в dev-режиме.
 *
 * Использование:
 *   import rawStyles from './MessageBubble.module.scss'
 *   const styles = cssModule(rawStyles, 'MessageBubble.module.scss')
 */
export function cssModule(
  styles: Readonly<Record<string, string>>,
  fileName: string,
): Record<string, string> {
  if (!import.meta.env.DEV) {
    return { ...styles }
  }

  return new Proxy(
    { ...styles },
    {
      get(target, property) {
        if (typeof property === 'string' && !(property in target)) {
          console.warn(
            `[css] В "${fileName}" нет класса "${property}". Проверь написание в .module.scss.`,
          )
        }

        return Reflect.get(target, property)
      },
    },
  )
}
