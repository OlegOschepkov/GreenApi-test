import { Normalize } from 'styled-normalize'

// Порядок двух импортов ниже — несущий конструк. styled-components выделяет
// слот каждому createGlobalStyle в момент СОЗДАНИЯ компонента, то есть при
// первом вычислении модуля, — а не при монтировании. Поэтому итоговый
// каскад такой: Normalize -> Reset -> GlobalStyle.
import { Reset } from './reset'
import { GlobalStyle } from './global'

/**
 * Обязательно рендерить внутри ThemeProvider. Три слоя держатся раздельно,
// чтобы у каждого была своя задача:
 *   1. Normalize   - сторонний кросс-браузерный базис (normalize.css 8)
 *   2. Reset       - наши собственные значения по умолчанию, без темы
 *   3. GlobalStyle - слой приложения, завязанный на тему
 */
export function AppStyles() {
  return (
    <>
      <Normalize />
      <Reset />
      <GlobalStyle />
    </>
  )
}
