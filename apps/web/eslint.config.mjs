import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const SERVER_ONLY_HOST_API = "ホスト API のクライアントはサーバー専用です（ID token を送る）。src/lib/host/server.ts の hostApiClient を使い、ブラウザからは /host/api/* を呼んでください。型だけの import はどこからでもよい。";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The host API client sends the host's ID token: only the server-only module may load it at runtime.
    // src/host/connect.ts (server-only) loads it for isStripeConnectUrl, to check a Stripe link before it is followed.
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["src/lib/host/server.ts", "src/lib/host/mock-niho.ts", "src/host/connect.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", {
        paths: [
          { name: "@niho-experience/api-client/host", message: SERVER_ONLY_HOST_API, allowTypeImports: true },
          { name: "@niho-experience/api-client/host/mock", message: SERVER_ONLY_HOST_API, allowTypeImports: true },
        ],
      }],
    },
  },
  globalIgnores([".next/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);
