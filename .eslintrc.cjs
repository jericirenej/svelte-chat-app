module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:storybook/recommended",
    "prettier",
    "plugin:svelte/recommended"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
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
      }
    },
    {
      files: ["*.spec.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": 0
      }
    }
  ]
};
