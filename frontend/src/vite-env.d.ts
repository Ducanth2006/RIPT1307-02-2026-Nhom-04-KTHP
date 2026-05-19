/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIMARY_COLOR: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
