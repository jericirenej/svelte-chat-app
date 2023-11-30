import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      transitionProperty: {
        "max-width": "max-width"
      }
    }
  },
  plugins: []
};
export default config;
