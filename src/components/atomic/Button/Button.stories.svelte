<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import ButtonComponent from "./Button.svelte";
  type StoryProps = RemoveIndexSignature<ComponentProps<ButtonComponent>>;
  export const meta: Meta<StoryProps> = {
    title: "Atomic/Button",
    component: ButtonComponent,
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
  const assertArgs = (args: unknown) => args as StoryProps;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  {@const isInline = storyArgs.display === "inline-block" || !storyArgs.display}
  <fieldset
    class={`flex 
    ${isInline ? "w-fit flex-row gap-x-5" : "flex-col gap-y-5"}
    rounded
    border-2
    border-stone-400
    px-4
    py-5
    `}
  >
    <legend class="text-xs uppercase tracking-wide">{storyArgs.display}</legend>
    {#each buttonVariants as variant}
      <ButtonComponent {...storyArgs} {variant} on:click
        >{capitalize(variant)} button</ButtonComponent
      >
    {/each}
  </fieldset>
</Template>

<Story name="Button" args={{ disabled: false, display: "inline-block" }} />
