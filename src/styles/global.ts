import { createGlobalStyle } from 'styled-components'

/**
 * Слой приложения, завязанный на тему. Рендерится последним в каскаде, поэтому
 * при одинаковой специфичности перебивает и `Normalize`, и `Reset`.
 */
export const GlobalStyle = createGlobalStyle`
  html,
  body,
  #root {
    height: 100%;
  }

  body {
    overflow: hidden;
    background: ${({ theme }) => theme.color.background.page};
    color: ${({ theme }) => theme.color.text.primary};
    font-family: ${({ theme }) => theme.font.family};
    font-size: ${({ theme }) => theme.fontSize.body};
    line-height: ${({ theme }) => theme.lineHeight.body};
    letter-spacing: 0.15px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* iOS Safari зумит вьюпорт при фокусе поля с кеглем меньше 16px. */
  input,
  textarea,
  select {
    font-size: ${({ theme }) => theme.fontSize.body};
  }

  input::placeholder,
  textarea::placeholder {
    color: ${({ theme }) => theme.color.text.muted};
  }

  a:hover {
    color: ${({ theme }) => theme.color.accent.default};
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.default};
    outline-offset: 2px;
  }

  ::selection {
    background: ${({ theme }) => theme.color.accent.soft};
  }

  /* В MAX скроллбары в списке чатов и в переписке тонкие и незаметные. */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(6, 7, 8, 0.2) transparent;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: ${({ theme }) => theme.radius.round};
    background: rgba(6, 7, 8, 0.2);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 7, 8, 0.32);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`
