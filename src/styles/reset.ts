import { createGlobalStyle } from 'styled-components'

/**
 * Сброс стилей на уровне элементов. По замыслу не зависит от темы: ни цветов,
 * ни размеров из дизайн-системы. Стоит между `Normalize` и `GlobalStyle`, чтобы
 * наши собственные значения выигрывали при равной специфичности — normalize.css
 * задаёт `h1 { font-size: 2em; margin: 0.67em 0 }` и `line-height: 1.15` на
 * полях ввода, и то и другое в UI мессенджера не нужно.
 */
export const Reset = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  figure,
  blockquote,
  dl,
  dd {
    margin: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: inherit;
    font-weight: inherit;
  }

  ul,
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  [hidden] {
    display: none;
  }

  img,
  video,
  canvas {
    display: block;
    max-width: 100%;
  }

  /* В normalize.css 8 нет правила для inline <svg>, из-за чего слишком
     крупные иконки вылезают за пределы вёрстки. */
  svg:not(:root) {
    overflow: hidden;
  }

  button {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: none;
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  button::-moz-focus-inner {
    border-style: none;
    padding: 0;
  }

  input,
  textarea,
  select {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    line-height: inherit;
    letter-spacing: inherit;
  }

  textarea {
    resize: none;
    overflow: auto;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`
