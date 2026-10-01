interface ImportMetaEnv {
  /**
   * Базовый адрес GREEN-API, см. `.env.example`.
   *
   * Необязателен: без `.env` переменной нет, и клиент сообщит об этом сам.
   */
  readonly VITE_GREEN_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
