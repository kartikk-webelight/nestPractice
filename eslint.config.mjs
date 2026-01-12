import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const isDev = process.env.NODE_ENV !== "production";

export default [
  js.configs.recommended,

  // ✅ Ignore build & tooling
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "cspell.js",
      "danger.js",
    ],
  },

  // ✅ Node globals everywhere
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // ✅ DangerJS tooling
  {
    files: ["**/spell-check.js", "**/danger*.js"],
    languageOptions: {
      globals: {
        danger: "readonly",
      },
    },
  },

  // ✅ TypeScript source files
  {
    files: ["**/*.ts"],
    ignores: ["**/*.d.ts"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module",
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      "unused-imports": unusedImports,
      prettier: prettierPlugin,
      "simple-import-sort": simpleImportSort,
    },

    rules: {
      "no-unused-vars": "off",
      "no-console": isDev ? "warn" : "error",
      "no-var": "error",

      "prettier/prettier": "error",

      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": isDev ? "warn" : "error",
      "@typescript-eslint/no-shadow": "warn",
      "@typescript-eslint/no-use-before-define": "warn",

      // ⚠ detects order, but weak auto-fix
"import/order": "off",

"simple-import-sort/imports": "error",
"simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
