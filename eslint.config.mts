import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/",
      "**/.next/",
      "**/out/",
      "**/build/",
      "**/dist/",
      "**/coverage/",
      "**/.env.*",
      "**/.vscode/",
      "**/.idea/",
      "**/*.log"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js, "react/jsx-runtime": pluginReact },
    extends: ["js/recommended"],
    languageOptions: { globals: {...globals.browser, ...globals.node} }
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    settings: { react: { version: "18.2.0" } }
  },
  {
    rules: {
       "react/react-in-jsx-scope": "off",
       "react/jsx-uses-react": "off",
       "@typescript-eslint/no-explicit-any": "warn",
    }
  }
]);
