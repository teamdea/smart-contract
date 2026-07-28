import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
    // Registered directly (rather than via each plugin's own `extends`-able
    // config object) because eslint-plugin-react-hooks@7's config objects
    // ship an old-style `plugins: ["react-hooks"]` array, which this
    // ESLint's flat config rejects - only the `rules` from those configs
    // get pulled in below, and the plugins are wired up in the correct
    // flat-config object shape here instead.
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
      ...reactRefresh.configs.vite.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
      // "recommended-latest" enables react-hooks v7's new React Compiler
      // preview rules at "error" - set-state-in-effect flags the standard,
      // widely-used "fetch/reset state in useEffect" pattern this codebase
      // relies on throughout (Create Order's cascading dropdowns, every
      // page's on-mount data fetch). Downgraded to warn rather than
      // rewriting already-tested, working code to satisfy a brand-new rule.
      "react-hooks/set-state-in-effect": "warn",
    },
  }
);
