import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
import jsxA11y from "eslint-plugin-jsx-a11y";
import promise from "eslint-plugin-promise";
import reactHooks from "eslint-plugin-react-hooks";

const hasReactHooksConfig =
  reactHooks.configs && reactHooks.configs.recommended;
const hasImportConfig =
  importPlugin.configs && importPlugin.configs.recommended;
const hasJsdocConfig = jsdoc.configs && jsdoc.configs.recommended;
const hasPromiseConfig = promise.configs && promise.configs.recommended;
const hasJsxA11yConfig = jsxA11y.configs && jsxA11y.configs.recommended;

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: { js },
    rules: js.configs.recommended.rules,
  },
  tseslint.configs.recommended,
  {
    plugins: { react: pluginReact },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-no-bind": "off",
      "react/jsx-filename-extension": [
        "warn",
        { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      ],
      "react/require-default-props": "off",
      "react/jsx-props-no-spreading": "off",
      "react/function-component-definition": [
        "error",
        {
          namedComponents: [
            "function-declaration",
            "function-expression",
            "arrow-function",
          ],
          unnamedComponents: ["function-expression", "arrow-function"],
        },
      ],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    plugins: { "react-hooks": reactHooks },
    rules: hasReactHooksConfig
      ? reactHooks.configs.recommended.rules
      : {
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn",
        },
  },
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...(hasJsxA11yConfig ? jsxA11y.configs.recommended.rules : {}),
      "jsx-a11y/label-has-associated-control": [
        "error",
        {
          labelComponents: ["CustomInputLabel"],
          labelAttributes: ["label"],
          controlComponents: ["CustomInput"],
          depth: 3,
        },
      ],
    },
  },
  {
    plugins: { import: importPlugin },
    rules: {
      ...(hasImportConfig ? importPlugin.configs.recommended.rules : {}),
      "import/no-extraneous-dependencies": "off",
      "import/prefer-default-export": "off",
      "import/extensions": "off",
      "import/no-anonymous-default-export": "off",
      "import/no-unresolved": ["off"],
      "import/named": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "@/quotes": ["error", "double"],
      "@/semi": ["error", "always"],
      "@/strict-boolean-expressions": "off",
      "@/explicit-function-return-type": "off",
    },
  },
  {
    plugins: { promise: promise },
    rules: {
      ...(hasPromiseConfig ? promise.configs.recommended.rules : {}),
    },
  },
  {
    plugins: { jsdoc: jsdoc },
    rules: {
      ...(hasJsdocConfig ? jsdoc.configs.recommended.rules : {}),
    },
  },
  {
    plugins: { prettier: prettier },
    rules: {
      "prettier/prettier": [
        "off",
        {
          semi: true,
          tabWidth: 2,
          printWidth: 80,
          singleQuote: false,
          jsxSingleQuote: false,
          singleAttributePerLine: true,
          endOfLine: "auto",
          trailingComma: "all",
        },
      ],
    },
  },
]);
