<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import TextAreaComponent from "./TextArea.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<TextAreaComponent> & { containerWidth: number }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Atoms/TextArea",
    component: TextAreaComponent,
    argTypes: {
      value: { table: { disable: true } },
      placeholder: { control: "text" },
      onInput: { action: "onInput" },
      containerWidth: { control: { type: "range", step: 5 } }
    },
    args: {
      containerWidth: 50,
      onInput: fn(),
      submitEvent: fn()
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
  {@const { containerWidth, placeholder, onInput, submitEvent } = assertArgs(args)}
  <div style:width={`${containerWidth}%`}>
    <TextAreaComponent bind:value {placeholder} {onInput} {submitEvent} />
  </div>
</Template>

<Story name="TextArea" args={{ placeholder: "Write something..." }} />
