import type { StorybookConfig } from "@storybook/sveltekit";
import { searchForWorkspaceRoot } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx|svelte)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-a11y"
  ],
  framework: {
    name: "@storybook/sveltekit",
    options: {}
  },
  docs: {
    autodocs: "tag"
  },
  core: {
    disableTelemetry: true
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      server: {
        fs: {
          allow: [searchForWorkspaceRoot(process.cwd()), "./utils"]
        }
      }
    });
  }
};
export default config;
