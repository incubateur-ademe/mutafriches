import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  // Ignorer les fichiers de build et dépendances
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/dist-ui/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/public/dsfr/**",
      "**/*.spec.ts",
      "**/*.test.ts",
    ],
  },

  // Configuration de base JavaScript
  js.configs.recommended,

  {
    rules: {
      "no-unused-vars": "off", // Désactiver la règle JS de base
    },
  },

  // Configuration globale
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Configuration TypeScript pour tous les fichiers TS/TSX
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // Règles TypeScript essentielles seulement
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // DÉSACTIVÉ pour le MVP - trop restrictif
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Garde seulement les erreurs critiques
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  // Configuration React pour l'app UI
  {
    files: ["apps/ui/**/*.{jsx,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-refresh/only-export-components": "warn",

      // Ajout de la règle permissive pour les entités non échappées (french)
      "react/no-unescaped-entities": [
        "error",
        {
          forbid: [">", "}"],
        },
      ],
    },
  },

  // Configuration spécifique NestJS
  {
    files: ["apps/api/**/*.ts"],
    rules: {
      // Désactiver la règle JS de base pour NestJS
      "no-unused-vars": "off",

      // NestJS utilise beaucoup de décorateurs et any
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          // Ignore les décorateurs NestJS et les paramètres de constructeur
          ignoreRestSiblings: true,
          args: "after-used", // Important pour NestJS
        },
      ],
    },
  },

  // Désactiver les règles pour les tests
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "**/test/**", "**/tests/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "no-console": "off",
    },
  },

  // Prettier doit être en dernier
  prettier,
];
