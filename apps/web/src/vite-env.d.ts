/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Release number from the repo-root package.json, e.g. "1.0.3" (vite.config.ts `define`). */
declare const __APP_VERSION__: string;
