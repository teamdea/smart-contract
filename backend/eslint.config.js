const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const globals = require("globals");
const prettierConfig = require("eslint-config-prettier");
const { globalIgnores } = require("eslint/config");

module.exports = tseslint.config(globalIgnores(["dist"]), {
  files: ["**/*.ts"],
  extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
  languageOptions: {
    ecmaVersion: 2022,
    globals: globals.node,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    "@typescript-eslint/no-explicit-any": "off",
  },
});
