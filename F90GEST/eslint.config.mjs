import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Script Node.js standalone (eseguiti direttamente da un runtime Node
    // portatile senza transpilazione, es. dall'installer Windows): CommonJS
    // deliberato, fuori dal codice TypeScript/ESM dell'app.
    "scripts/**",
  ]),
]);

export default eslintConfig;
