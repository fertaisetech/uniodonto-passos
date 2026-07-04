/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_DATA?: string;
  readonly VITE_SECURITY_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
