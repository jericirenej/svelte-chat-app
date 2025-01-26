/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:storybook/recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:svelte/recommended",
    "plugin:markdown/recommended-legacy",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "unused-imports"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    project: ["./tsconfig.json", "./db/tsconfig.json"],
    tsconfigRootDir: __dirname,
    extraFileExtensions: [".svelte"]
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  },
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser"
      },
      rules: {
        "@typescript-eslint/prefer-reduce-type-parameter": 0,
        "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        "unused-imports/no-unused-imports": "error"
      }
    },
    {
      files: ["*.stories.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser"
      },
      rules: {
        "@typescript-eslint/prefer-reduce-type-parameter": 0,
        // Temporarily turn off until typed args can be passed to <Template let:args />
        // Or until upgrade to Svelte 5 is made and type assertions are allowed in templates.
        "@typescript-eslint/no-unsafe-member-access": 1,
        "@typescript-eslint/no-unsafe-argument": 0,
        "@typescript-eslint/no-unsafe-assignment": 0,
        "@typescript-eslint/no-unsafe-return": 1,
        // Extending component props leads to complaints about "any"
        // overriding all other intersection types
        "@typescript-eslint/no-redundant-type-constituents": 0
      }
    },
    {
      files: ["*.ts"],
      rules: {
        "@typescript-eslint/no-throw-literal": 0,
        "@typescript-eslint/only-throw-error": 0,
        "@typescript-eslint/no-dynamic-delete": 0,
        "@typescript-eslint/prefer-reduce-type-parameter": 0,
        "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        "unused-imports/no-unused-imports": "error",
        "@typescript-eslint/no-extraneous-class": "off",
        "@typescript-eslint/consistent-type-exports": "error",
        "@typescript-eslint/consistent-type-imports": "error"
      }
    },
    {
      files: ["*.spec.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": 0,
        "@typescript-eslint/no-dynamic-delete": 0
      }
    },
    {
      files: ["tests/**/*.spec.ts"],
      extends: "plugin:playwright/recommended",
      rules: { "playwright/no-conditional-in-test": "off" }
    }
  ]
};
