<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import TypingIndicator from "./TypingIndicator.svelte";
  import type { ComponentProps } from "svelte";

  export const meta: Meta<ComponentProps<TypingIndicator>> = {
    title: "Atomic/TypingIndicator",
    component: TypingIndicator,
    argTypes: {
      usersTyping: {
        control: "check",
        options: ["Ada", "Alan", "Alonzo", "Barbara", "Charles", "Kurt"]
      }
      // debounceTime: { type: "number" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";

  const assertArgs = (args: unknown) => {
    return args as RemoveIndexSignature<ComponentProps<TypingIndicator>>;
  };
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <TypingIndicator {...storyArgs} />
</Template>

<Story name="Primary" args={{ usersTyping: [] }} />
