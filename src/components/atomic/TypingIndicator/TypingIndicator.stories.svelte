<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import TypingIndicatorComponent from "./TypingIndicator.svelte";

  export const meta: Meta<ComponentProps<TypingIndicatorComponent>> = {
    title: "Atomic/TypingIndicator",
    component: TypingIndicatorComponent,
    argTypes: {
      usersTyping: {
        control: "check",
        options: ["Ada", "Alan", "Alonzo", "Barbara", "Charles", "Kurt"]
      }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";

  const assertArgs = (args: unknown) => {
    return args as RemoveIndexSignature<ComponentProps<TypingIndicatorComponent>>;
  };
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <TypingIndicatorComponent {...storyArgs} />
</Template>

<Story name="TypingIndicator" args={{ usersTyping: [] }} />
