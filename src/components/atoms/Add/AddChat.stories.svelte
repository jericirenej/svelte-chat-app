<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import AddChatComponent from "./AddChat.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<AddChatComponent> & { containerColor: string; click: (ev: Event) => unknown }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Atoms/AddChat",
    component: AddChatComponent,
    argTypes: {
      disabled: { control: "boolean" },
      size: { control: "number" },
      containerColor: { control: "color" },
      title: { control: "text" }
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
  {@const { containerColor, ...rest } = assertArgs(args)}
  <div style:color={containerColor}>
    <AddChatComponent {...rest} on:click={rest.click} />
  </div>
</Template>

<Story name="AddChat" args={{ disabled: false, containerColor: "#02a736", size: 28 }} />
