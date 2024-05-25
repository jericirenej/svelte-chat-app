<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import SendIconComponent from "./SendIcon.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<SendIconComponent> & { containerColor: string; click: (ev: Event) => unknown }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Atomic/SendIcon",
    component: SendIconComponent,
    argTypes: {
      disabled: { control: "boolean" },
      containerColor: { control: "color" }
    },
    args: {
      click: fn()
    }
  };
</script>

<script lang="ts">
  import { Template, Story } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ComponentProps } from "svelte";
  import { fn } from "@storybook/test";
  const assertArgs = (args: unknown): ExtendedProps => args as ExtendedProps;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <div style:color={storyArgs.containerColor}>
    <SendIconComponent disabled={storyArgs.disabled} on:click={storyArgs.click} />
  </div>
</Template>

<Story name="SendIcon" args={{ disabled: false, containerColor: "#02a736", isActive: false }} />
