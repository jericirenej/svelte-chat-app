import { $ as shell, spinner } from "zx";
const $ = shell({ verbose: true });
process.env.FORCE_COLOR = "3";
const start = performance.now();
await spinner("Running lint", async () => {
  await $`npx prettier --check .`.nothrow();
  await $`npx eslint .`;
});
const end = performance.now() - start;

console.log("\n", `Linting finished in ${Math.round(end / 1e3)} seconds`, "\n");
