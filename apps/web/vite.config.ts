import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// Ports live in the repo-root .env so Docker Compose and local development agree.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

// The release shown in the app (Settings, menu) is the repo-root package.json version,
// so bumping it for a release is all it takes.
const rootPackage = JSON.parse(readFileSync(`${repoRoot}package.json`, 'utf8')) as {
  version: string;
};

// The app loads nothing from the internet (ADR-042): fonts, CSS, images and scripts come from
// the web server itself, and requests go only to the API. The production build carries a CSP
// so the browser refuses any other address. The dev server skips it because HMR needs inline code.
function localOnlyContentSecurityPolicy(apiBaseUrl: string): Plugin {
  const apiOrigin = URL.canParse(apiBaseUrl) ? new URL(apiBaseUrl).origin : '';
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${apiOrigin}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    name: 'local-only-content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, '');
  const apiPort = Number(rootEnv.API_PORT);
  const resolvedApiPort = Number.isInteger(apiPort) && apiPort > 0 ? apiPort : 3000;
  const apiBaseUrl =
    process.env.VITE_API_BASE_URL?.trim() ||
    rootEnv.API_BASE_URL?.trim() ||
    `http://localhost:${resolvedApiPort}`;
  const webPort = Number(rootEnv.WEB_PORT);

  return {
    plugins: [react(), tailwindcss(), localOnlyContentSecurityPolicy(apiBaseUrl)],
    server: {
      host: '0.0.0.0',
      // WEB_PORT is a promise: fail loudly instead of drifting to another port.
      ...(Number.isInteger(webPort) && webPort > 0 ? { port: webPort, strictPort: true } : {}),
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      __APP_VERSION__: JSON.stringify(rootPackage.version),
    },
  };
});
