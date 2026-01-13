import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

const isDev = process.env.NODE_ENV !== "production";

export default [
  // ------------------------------------------------------
  // Base JS recommended rules
  // ------------------------------------------------------
  js.configs.recommended,

  // ------------------------------------------------------
  // Ignore generated & tooling files
  // ------------------------------------------------------
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "cspell.js",
      "danger.js",
    ],
  },

  // ------------------------------------------------------
  // TypeScript / NestJS files
  // ------------------------------------------------------
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
      globals: {
        ...globals.node,
        Express: "readonly", // remove if you switch to Multer.File
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
      // -----------------------------
      // Core
      // -----------------------------
      "no-undef": "off", // REQUIRED for TS
      "no-var": "error",
      "no-console": isDev ? "warn" : "error",

      // -----------------------------
      // Prettier
      // -----------------------------
      "prettier/prettier": "error",

      // -----------------------------
      // TypeScript
      // -----------------------------
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": isDev ? "warn" : "error",
      "@typescript-eslint/no-shadow": "warn",
      "@typescript-eslint/no-use-before-define": "off",

      // -----------------------------
      // Imports
      // -----------------------------
      "import/order": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // -----------------------------
      // Unused imports / vars
      // -----------------------------
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

  // ------------------------------------------------------
  // DangerJS / tooling files
  // ------------------------------------------------------
  {
    files: ["**/spell-check.js", "**/danger*.js"],
    languageOptions: {
      globals: {
        danger: "readonly",
      },
    },
  },
];


// // eslint.config.mjs
// import tseslint from "typescript-eslint";
// import tsParser from "@typescript-eslint/parser";
// import ts from "@typescript-eslint/eslint-plugin";
// import globals from "globals";
// import prettierPlugin from "eslint-plugin-prettier";
// import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import unusedImports from "eslint-plugin-unused-imports";
// import * as esImport from "eslint-plugin-import";
// import typescriptSortKeys from "eslint-plugin-typescript-sort-keys";

// // ⚠️ Do NOT include `@eslint/js` configs in flat config
// export default tseslint.config(
//   {
//     ignores: [
//       "eslint.config.mjs",
//       "node_modules",
//       "spell-check.js",
//       "dist",
//       "webpack.config.js",
//     ],
//   },
//   ...tseslint.configs.recommendedTypeChecked,
//   eslintPluginPrettierRecommended,
//   {
//     languageOptions: {
//       parser: tsParser,
//       ecmaVersion: "latest",
//       sourceType: "module",
//       parserOptions: {
//         projectService: true,
//         tsconfigRootDir: import.meta.dirname,
//       },
//       globals: {
//         ...globals.node,
//         ...globals.jest,
//       },
//     },
//   },
//   {
//     plugins: {
//       "@typescript-eslint": ts,
//       import: esImport,
//       "unused-imports": unusedImports,
//       prettier: prettierPlugin,
//       "typescript-sort-keys": typescriptSortKeys,
//     },
//   },
//   {
//     settings: {
//       "import/resolver": {
//         typescript: {
//           alwaysTryTypes: true,
//           project: "./tsconfig.json", // or correct relative path to your tsconfig
//         },
//       },
//     },
//   },
//   {
//     rules: {
//       "import/newline-after-import": ["error"],
//       "import/extensions": "off",
//       "import/prefer-default-export": "off",
//       "import/no-extraneous-dependencies": "off",
//       "import/no-duplicates": "error",
//       "no-duplicate-imports": "error",
//       "@typescript-eslint/no-explicit-any": "warn",
//       "@typescript-eslint/no-shadow": "warn",
//       "@typescript-eslint/naming-convention": "off",
//       "@typescript-eslint/no-loop-func": "warn",
//       "@typescript-eslint/no-inferrable-types": "warn",
//       "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
//       "@typescript-eslint/no-unnecessary-condition": "off",
//       "@typescript-eslint/no-var-requires": "off",
//       "@typescript-eslint/no-empty-interface": "error",
//       "@typescript-eslint/restrict-template-expressions": "warn",
//       "@typescript-eslint/no-use-before-define": "warn",
//       "@typescript-eslint/comma-dangle": [
//         "off",
//         {
//           arrays: "always-multiline",
//           objects: "always-multiline",
//           imports: "always-multiline",
//           exports: "always-multiline",
//           functions: "always-multiline",
//           generics: "always-multiline",
//         },
//       ],
//       "@typescript-eslint/comma-spacing": [
//         "off",
//         {
//           before: false,
//           after: true,
//         },
//       ],
//       "@typescript-eslint/quotes": [
//         0,
//         "single",
//         {
//           avoidEscape: true,
//         },
//       ],
//       "typescript-sort-keys/string-enum": [
//         "warn",
//         "asc",
//         { caseSensitive: true },
//       ],
//       "import/order": [
//         "error",
//         {
//           groups: [
//             "builtin", // Node built-in modules
//             "external", // npm packages (NestJS, others)
//             "internal", // alias-based absolute modules (e.g., src/**)
//             "sibling",
//             "parent",
//             "index",
//             "object", // import foo = require('foo')
//             "type", // Type-only imports
//           ],
//           pathGroups: [
//             // Prioritize NestJS core imports first among externals
//             { pattern: "@nestjs/**", group: "external", position: "before" },

//             // Internal group with granular ordering (alias paths for your src)
//             { pattern: "config/**", group: "internal", position: "before" },
//             { pattern: "logger{,/**}", group: "internal", position: "before" },
//             { pattern: "constants/**", group: "internal", position: "before" },
//             { pattern: "enums{,/**}", group: "internal", position: "before" },
//             { pattern: "interfaces/**", group: "internal", position: "before" },
//             {
//               pattern: "decorators{,/**}",
//               group: "internal",
//               position: "before",
//             },
//             { pattern: "guards{,/**}", group: "internal", position: "before" },
//             {
//               pattern: "interceptors{,/**}",
//               group: "internal",
//               position: "before",
//             },
//             { pattern: "filters/**", group: "internal", position: "before" },
//             {
//               pattern: "validators{,/**}",
//               group: "internal",
//               position: "before",
//             },
//             { pattern: "dtos/**", group: "internal", position: "before" },
//             { pattern: "swagger/**", group: "internal", position: "before" },
//             { pattern: "database/**", group: "internal", position: "before" },
//             { pattern: "modules/**", group: "internal", position: "before" },
//             { pattern: "shared/**", group: "internal", position: "before" },
//             { pattern: "cron/**", group: "internal", position: "before" },
//             { pattern: "utils/**", group: "internal", position: "after" },
//           ],
//           pathGroupsExcludedImportTypes: ["builtin"],
//           alphabetize: {
//             order: "asc",
//             caseInsensitive: true,
//           },
//           "newlines-between": "never",
//         },
//       ],
//       "prettier/prettier": [
//         "error",
//         { singleQuote: false, semi: true, trailingComma: "all" },
//       ],
//       "no-console": "error",
//       "no-var": "error",
//       "no-nested-ternary": "warn",
//       "no-unneeded-ternary": "warn",
//       "no-empty-pattern": "error",
//       "no-restricted-exports": "off",
//       "object-shorthand": "error",
//       "prefer-destructuring": "warn",
//       "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
//       camelcase: "off", // typeorm compatibility
//       "max-params": "off",
//       "object-curly-newline": [
//         "off",
//         {
//           ObjectExpression: {
//             minProperties: 4,
//             multiline: true,
//             consistent: true,
//           },
//           ObjectPattern: {
//             minProperties: 4,
//             multiline: true,
//             consistent: true,
//           },
//           ImportDeclaration: {
//             minProperties: 4,
//             multiline: true,
//             consistent: true,
//           },
//           ExportDeclaration: {
//             minProperties: 4,
//             multiline: true,
//             consistent: true,
//           },
//         },
//       ],
//       "object-curly-spacing": ["off", "always"],
//       "object-property-newline": [
//         "off",
//         {
//           allowAllPropertiesOnSameLine: true,
//           allowMultiplePropertiesPerLine: false,
//         },
//       ],
//       "operator-linebreak": ["off"],
//       "implicit-arrow-linebreak": ["off", "beside"],
//       "@typescript-eslint/explicit-function-return-type": "off",
//       "@typescript-eslint/explicit-module-boundary-types": "off",
//       "@typescript-eslint/no-unsafe-call": "off",
//       "@typescript-eslint/no-unused-vars": "off",
//       "@typescript-eslint/no-unsafe-assignment": "off",
//       "@typescript-eslint/no-unsafe-member-access": "off",
//       "@typescript-eslint/no-unsafe-argument": "off",
//       "@typescript-eslint/no-unsafe-return": "off",
//       "@typescript-eslint/require-await": "off",
//       "unused-imports/no-unused-imports": "warn",
//       "unused-imports/no-unused-vars": [
//         "warn",
//         {
//           vars: "all",
//           varsIgnorePattern: "^_",
//           args: "after-used",
//           argsIgnorePattern: "^_",
//           ignoreRestSiblings: false,
//         },
//       ],
//       "padding-line-between-statements": [
//         "error",
//         {
//           blankLine: "always",
//           prev: "*",
//           next: "return",
//         },
//       ],
//     },
//   },
// );
