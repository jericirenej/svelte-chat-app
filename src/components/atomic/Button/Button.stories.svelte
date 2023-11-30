<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import Button from "./Button.svelte";
  export const meta: Meta<Button> = {
    title: "Atomic/Button",
    component: Button,
    argTypes: {
      disabled: { control: "boolean" },
      display: { control: { type: "radio" }, options: ["inline-block", "block"] },
      action: { control: { type: "radio" }, options: ["confirm", "cancel", "info", "danger"] },
      size: { control: { type: "radio" }, options: ["sm", "md", "lg"] },
      type: { control: { type: "radio" }, options: ["button", "submit"] },
      variant: { table: { disable: true } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { capitalize } from "../../../utils/text-utils.js";
  const buttonVariants = ["primary", "outline"] as const;
</script>

<Template let:args>
  {@const isInline = args.display === "inline-block" || !args.display}
  <fieldset
    class={`flex 
    ${isInline ? "flex-row gap-x-5 w-fit" : "flex-col gap-y-5"}
    py-5
    px-4
    border-2
    border-stone-400
    rounded
    `}
  >
    <legend class="text-xs uppercase tracking-wide">{args.display}</legend>
    {#each buttonVariants as variant}
      <Button {...args} {variant} on:click>{capitalize(variant)} button</Button>
    {/each}
  </fieldset>
</Template>

<Story name="Primary" args={{ disabled: false, display: "inline-block" }} />
