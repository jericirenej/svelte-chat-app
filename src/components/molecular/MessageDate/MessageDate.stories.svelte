<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import MessageDateComponent from "./MessageDate.svelte";

  export const meta: Meta<MessageDateComponent> = {
    title: "Molecular/MessageDate",
    component: MessageDateComponent,
    argTypes: {
      date: { control: "date" },
      locale: { control: "text" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { startOfYesterday } from "date-fns";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";

  const yesterday = startOfYesterday();
  const assertArgs = (args: unknown) =>
    args as RemoveIndexSignature<ComponentProps<MessageDateComponent>>;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <MessageDateComponent {...storyArgs} />
</Template>

<Story
  name="MessageDate"
  args={{
    date: yesterday,
    locale: "sl-SI"
  }}
/>
