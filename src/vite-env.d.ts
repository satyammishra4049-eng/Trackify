/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GEMINI_API_KEY: string
  // Add more env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
