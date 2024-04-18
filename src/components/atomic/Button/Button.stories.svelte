<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import Button from "./Button.svelte";
  type StoryProps = RemoveIndexSignature<ComponentProps<Button>>
  export const meta: Meta<StoryProps> = {
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
  import { capitalize } from "../../../helpers";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  const buttonVariants = ["primary", "outline"] as const;
  const assertArgs = (args:unknown) => args as StoryProps;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  {@const isInline = storyArgs.display === "inline-block" || !storyArgs.display}
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
    <legend class="text-xs uppercase tracking-wide">{storyArgs.display}</legend>
    {#each buttonVariants as variant}
      <Button {...storyArgs} {variant} on:click>{capitalize(variant)} button</Button>
    {/each}
  </fieldset>
</Template>

<Story name="Primary" args={{ disabled: false, display: "inline-block" }} />
