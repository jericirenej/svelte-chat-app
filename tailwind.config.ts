import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors.js";

const config: Config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    colors: { ...colors },
    extend: {}
  },
  plugins: []
};
export default config;
