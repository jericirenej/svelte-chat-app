<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import DeleteButtonComponent from "./DeleteButton.svelte";
  type Props = RemoveIndexSignature<ComponentProps<DeleteButtonComponent>> & {
    click: (ev: Event) => unknown;
  };
  export const meta: Meta<Props> = {
    title: "Atomic/DeleteButton",
    component: DeleteButtonComponent,
    argTypes: {
      label: { control: "text" },
      color: { control: "color" }
    },
    args: { click: fn() }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { fn } from "@storybook/test";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ComponentProps } from "svelte";
  const assertArgs = (args: unknown): Props => args as Props;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <DeleteButtonComponent {...storyArgs} on:click={storyArgs.click} />
</Template>

<Story name="DeleteButton" args={{ id: "1", label: "Remove Item" }} />
