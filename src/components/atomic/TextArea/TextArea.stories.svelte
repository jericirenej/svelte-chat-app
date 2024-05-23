<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import TextAreaComponent from "./TextArea.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<TextAreaComponent> & { containerWidth: number }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Atomic/TextArea",
    component: TextAreaComponent,
    argTypes: {
      value: { table: { disable: true } },
      onInput: { action: "onInput" },
      containerWidth: { control: { type: "range", step: 5 } }
    },
    args: {
      containerWidth: 50,
      onInput: fn()
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { fn } from "@storybook/test";
  let value = "";
  const assertArgs = (args: unknown) => args as ExtendedProps;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <div style:width={`${storyArgs.containerWidth}%`}>
    <TextAreaComponent bind:value onInput={storyArgs.onInput} />
  </div>
</Template>

<Story name="TextArea" />
