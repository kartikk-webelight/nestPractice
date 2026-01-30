// eslint.config.mjs

// Core TypeScript ESLint utilities (flat config support)
import tseslint from "typescript-eslint";

// TypeScript parser for ESLint
import tsParser from "@typescript-eslint/parser";



// Global variables for different environments
import globals from "globals";

// Recommended Prettier + ESLint integration
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

// Plugin to automatically detect & remove unused imports
import unusedImports from "eslint-plugin-unused-imports";

// Plugin to enforce consistent import order and detect import issues
import * as esImport from "eslint-plugin-import";

// Plugin to enforce sorted keys (useful for enums & objects)
import typescriptSortKeys from "eslint-plugin-typescript-sort-keys";

// ⚠️ Flat config: do NOT include @eslint/js here
export default tseslint.config(

  /**
   * ------------------------------------------------------------------
   * 1️⃣ Files & folders ESLint should completely ignore
   * ------------------------------------------------------------------
   */
  {
    ignores: [
      "eslint.config.mjs", // avoid linting the config itself
      "node_modules",      // third-party dependencies
      "spell-check.js",    // utility scripts
      "dist",              // compiled output
      "webpack.config.js",
      "cspell.js",
      "danger.js",
      "sonar-analysis.js", // build configuration
    ],
  },

  /**
   * ------------------------------------------------------------------
   * 2️⃣ Recommended TypeScript rules WITH type-checking
   * ------------------------------------------------------------------
   * Enables strict rules that require TypeScript's type information
   */
  ...tseslint.configs.recommendedTypeChecked,

  /**
   * ------------------------------------------------------------------
   * 3️⃣ Prettier recommended config
   * ------------------------------------------------------------------
   * - Runs Prettier as an ESLint rule
   * - Disables conflicting ESLint formatting rules
   */
  eslintPluginPrettierRecommended,

  /**
   * ------------------------------------------------------------------
   * 4️⃣ Language & parser configuration
   * ------------------------------------------------------------------
   */
  {
    languageOptions: {
      // Use TypeScript parser
      parser: tsParser,

      // Support latest ECMAScript features
      ecmaVersion: "latest",

      // Enable ES modules (import/export)
      sourceType: "module",

      parserOptions: {
        // Automatically detect tsconfig (faster than manual project path)
        projectService: true,

        // Root directory for tsconfig resolution
        tsconfigRootDir: import.meta.dirname,
      },

      // Define global variables available in the project
      globals: {
        ...globals.node, // Node.js globals (process, Buffer, etc.)
        ...globals.jest, // Jest globals (describe, it, expect)
      },
    },
  },

  /**
   * ------------------------------------------------------------------
   * 5️⃣ ESLint plugins registration
   * ------------------------------------------------------------------
   */
  {
plugins: {
  import: esImport,
  "typescript-sort-keys": typescriptSortKeys,
   "unused-imports": unusedImports, 
}
  },


  /**
   * ------------------------------------------------------------------
   * 6️⃣ Import resolver configuration
   * ------------------------------------------------------------------
   * Helps ESLint understand TS path aliases & tsconfig paths
   */
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,  // Try resolving @types packages
          project: "./tsconfig.json", // Path to tsconfig
        },
      },
    },
  },

  /**
   * ------------------------------------------------------------------
   * 7️⃣ Custom rules configuration
   * ------------------------------------------------------------------
   */
  {
    rules: {
      /**
       * ------------------------
       * Import rules
       * ------------------------
       */
      "import/newline-after-import": ["error"], // Blank line after imports
          "typescript-sort-keys/string-enum": [
      "warn",
      "asc",
      { caseSensitive: true },
    ],
      "import/extensions": "off",  
      "@typescript-eslint/no-unsafe-enum-comparison": "off",             // Allow extension-less imports
      "import/prefer-default-export": "off",
      "import/no-extraneous-dependencies": "off",
      "import/no-duplicates": "error",          // No duplicate imports
      "no-duplicate-imports": "error",

      /**
       * ------------------------
       * TypeScript rules
       * ------------------------
       */
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-shadow": "warn",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-loop-func": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-empty-interface": "error",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/no-use-before-define": "warn",

      /**
       * Disable strict unsafe rules for NestJS / TypeORM compatibility
       */
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off",

      /**
       * ------------------------
       * Formatting rules (delegated to Prettier)
       * ------------------------
       */
      "@typescript-eslint/comma-dangle": "off",
      "@typescript-eslint/comma-spacing": "off",
      "@typescript-eslint/quotes": "off",
      /**
       * ------------------------
       * Import order (NestJS-friendly)
       * ------------------------
       */
 "import/order": [
  "error",
  {
    // Define import groups
    groups: [
      "builtin",   // Node built-ins (fs, path, etc.)
      "external",  // npm packages
      "internal",  // src aliases like config/**, modules/**, utils/**
      "sibling",   // ./relative imports
      "parent",    // ../relative imports
      "index",     // ./index imports
      "object",    // object imports
      "type",      // type-only imports
    ],

    // Special handling for certain patterns
    pathGroups: [
      // NestJS packages come first in external group
      { pattern: "@nestjs/**", group: "external", position: "before" },
      // Config imports should be first in internal group
      { pattern: "config/**", group: "internal", position: "before" },
      // Modules come next in internal
      { pattern: "modules/**", group: "internal", position: "before" },
      // Utils go last in internal
      { pattern: "utils/**", group: "internal", position: "after" },
    ],

    // Exclude builtins from pathGroups rules
    pathGroupsExcludedImportTypes: ["builtin"],

    // Alphabetical order inside each group
    alphabetize: { order: "asc", caseInsensitive: true },

    // No blank lines between groups (you can change to "always" if you prefer)
    "newlines-between": "never",
  },
],


      /**
       * ------------------------
       * Prettier formatting rules
       * ------------------------
       */
      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          semi: true,
          trailingComma: "all",
        },
      ],

      /**
       * ------------------------
       * General code quality rules
       * ------------------------
       */
      "no-console": "error",
      "no-var": "error",
      "no-nested-ternary": "warn",
      "no-unneeded-ternary": "warn",
      "no-empty-pattern": "error",
      "object-shorthand": "error",
      "prefer-destructuring": "warn",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],

      /**
       * Allow snake_case (DB fields, legacy APIs)
       */
      camelcase: "off",

      /**
       * Unused imports & variables handling
       */
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      /**
       * Enforce spacing before return statements
       */
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
      ],
    },
  },
);