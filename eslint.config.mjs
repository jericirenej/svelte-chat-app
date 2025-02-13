//@ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import storybook from "eslint-plugin-storybook";
import prettierConfig from "eslint-config-prettier";
import markdown from "eslint-plugin-markdown";
import playwright from "eslint-plugin-playwright";
import * as svelteParser from "svelte-eslint-parser";
const extraFileExtensions = [".svelte"];
export default tseslint.config(
  {
    ignores: [
      "eslint.config.mjs",
      ".svelte-kit",
      "build",
      "playwright-report",
      ".env.*",
      "prodServer.ts",
      "tests/ecosystem*",
      "!.storybook"
    ]
  },

  {
    files: ["src/**/*"],
    languageOptions: { globals: { ...globals.browser } }
  },
  {
    files: ["db/**/*"],
    languageOptions: { globals: { ...globals.node } }
  },

  markdown.configs.recommended,
  prettierConfig,
  {
    extends: [playwright.configs["flat/recommended"]],
    files: ["tests/**/*.ts"],
    rules: { "playwright/no-conditional-in-test": "off", "playwright/no-networkidle": "warn" }
  },

  {
    files: ["**/*.ts", "**/*.js"],
    extends: [eslint.configs.recommended, tseslint.configs.strictTypeChecked],

    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions
      }
    },

    rules: {
      "@typescript-eslint/no-throw-literal": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/prefer-reduce-type-parameter": "off",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-deprecated": "warn"
    }
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-dynamic-delete": "off"
    }
  },
  {
    files: ["src/**/*.svelte"],
    extends: [tseslint.configs.strictTypeChecked, sveltePlugin.configs["flat/recommended"]],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        projectService: true,
        parser: tseslint.parser,
        extraFileExtensions
      }
    },
    rules: {
      "@typescript-eslint/prefer-reduce-type-parameter": "off",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-deprecated": "warn"
    }
  },
  {
    files: ["src/**/*.stories.svelte"],
    extends: storybook.configs["flat/csf"],
    rules: {
      "@typescript-eslint/prefer-reduce-type-parameter": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "error",
      // Extending component props leads to complaints about "any"
      // overriding all other intersection types
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "storybook/default-exports": "off"
    }
  }
);
