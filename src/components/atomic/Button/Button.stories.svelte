<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import Button from "./Button.svelte";
  export const meta: Meta<Button> = {
    title: "Atomic/Button",
    component: Button,
    argTypes: {
      disabled: { control: "boolean" },
      display: { control: { type: "select" }, options: ["inlineBlock", "block"] },
      action: { control: { type: "select" }, options: ["confirm", "cancel", "danger"] },
      size: { control: { type: "select" }, options: ["sm", "md", "lg", undefined] }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { capitalize } from "../../../utils/text-utils.js";
  const buttonVariants = ["primary", "outline"] as const;
</script>

<Template let:args>
  {@const isInline = args.display === "inlineBlock" || !args.display}
  <div
    class={`flex 
    ${isInline ? "flex-row gap-x-5 w-fit" : "flex-col gap-y-5 w-100"}
    py-5
    px-4
    border-2
    border-stone-300
    rounded
    `}
  >
    {#each buttonVariants as variant}
      <Button {...args} {variant} on:click>{capitalize(variant)} button</Button>
    {/each}
  </div>
</Template>

<Story name="Primary" args={{ display: "inlineBlock" }} />
