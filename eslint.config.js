import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
import jsxA11y from "eslint-plugin-jsx-a11y";
import promise from "eslint-plugin-promise";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/build/**",
      "**/out/**",
      "**/.next/**",
      "**/coverage/**",
      "**/generated/**",
      "**/*.js",
    ],
  },

  // Base configuration for all TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // ESLint recommended rules
  {
    files: ["**/*.{ts,tsx}"],
    ...js.configs.recommended,
  },

  // TypeScript ESLint recommended configuration
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  // Backend-specific configuration
  {
    files: ["packages/backend/**/*.{ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // React configuration
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: pluginReact,
    },
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

  // React Hooks configuration
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // JSX A11Y configuration
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
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

  // Import plugin configuration
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      "import/no-extraneous-dependencies": "off",
      "import/prefer-default-export": "off",
      "import/extensions": "off",
      "import/no-anonymous-default-export": "off",
      "import/no-unresolved": "off",
      "import/named": "off",
    },
  },

  // TypeScript specific rules
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Disable conflicting quotes rule in favor of prettier
      // quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Relax TypeScript rules for development
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      // Allow console statements in backend development
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-case-declarations": "warn",
      "no-console": "off",
      // Relax JSDoc requirements for development
      "jsdoc/require-returns": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/no-undefined-types": "off",
    },
  },

  // Backend-specific overrides
  {
    files: ["packages/backend/**/*.{ts}"],
    rules: {
      // More lenient for backend development
      "no-console": "off", // Allow console statements in backend
      "@typescript-eslint/no-explicit-any": "warn", // Allow any type with warning
      "promise/param-names": "off", // Allow flexible promise parameter names
    },
  },

  // Test file overrides
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "jsdoc/require-jsdoc": "off",
    },
  },

  // Prettier configuration (must be last to override other formatting rules)
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // JSDoc configuration - relaxed for development
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      jsdoc,
    },
    rules: {
      // Turn off most JSDoc rules for development
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/no-undefined-types": "off",
      "jsdoc/valid-types": "off",
      "jsdoc/check-types": "off",
    },
  },

  // Promise configuration
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      promise,
    },
    rules: {
      ...promise.configs.recommended.rules,
    },
  },
];
