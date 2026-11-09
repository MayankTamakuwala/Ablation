import globals from "globals";
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";

export default [
  {
    ignores: ["**/node_modules/**", "client/dist/**", ".vercel/**"],
  },
  {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },

    plugins: {
      prettier: prettier,
    },

    rules: {
      ...js.configs.recommended.rules,

      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-console": 0,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

      "prettier/prettier": [
        "error",
        {
          endOfLine: "lf",
          trailingComma: "es5",
          singleQuote: false,
        },
      ],
    },
  },
  {
    files: ["client/**/*.{js,jsx}"],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
    },

    settings: {
      react: { version: "detect" },
    },

    plugins: {
      react: react,
      "react-hooks": reactHooks,
    },

    rules: {
      ...react.configs.flat.recommended.rules,

      // The new JSX transform means React does not need to be in scope.
      "react/react-in-jsx-scope": "off",

      // Rubric item 24: every component declares its PropTypes.
      "react/prop-types": "error",

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  eslintConfigPrettier,
];
