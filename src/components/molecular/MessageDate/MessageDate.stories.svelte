<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import MessageDate from "./MessageDate.svelte";

  export const meta: Meta<MessageDate> = {
    title: "Molecular/MessageDate",
    component: MessageDate,
    argTypes: {
      date: { control: "date" },
      locale: { control: "text" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { startOfYesterday } from "date-fns/esm";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";

  const yesterday = startOfYesterday();
  const assertArgs = (args: unknown) => args as RemoveIndexSignature<ComponentProps<MessageDate>>;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <MessageDate {...storyArgs} />
</Template>

<Story
  name="Primary"
  args={{
    date: yesterday,
    locale: "sl-SI"
  }}
/>
