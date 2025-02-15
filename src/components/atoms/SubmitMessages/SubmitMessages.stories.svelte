<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import SubmitMessagesComponent from "./SubmitMessages.svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ComponentProps } from "svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<SubmitMessagesComponent> & { containerWidth: number }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Atoms/SubmitMessages",
    component: SubmitMessagesComponent,
    argTypes: {
      alignment: { control: "inline-radio", options: ["center", "left"] },
      messages: { control: "object" },
      success: { control: "boolean" },
      containerWidth: { control: { type: "range", min: 0, max: 100, step: 1 } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  const assertArgs = (args: unknown) => args as ExtendedProps;
</script>

<Template let:args>
  {@const { containerWidth, ...rest } = assertArgs(args)}
  <div class="relative border-2" style:width={`${containerWidth}vw`}>
    <span>Anchor div</span>
    <SubmitMessagesComponent {...rest} />
  </div>
</Template>

<Story
  name="SubmitMessages"
  args={{
    success: true,
    messages: ["Successful action performed", "Some other message"],
    alignment: "center",
    containerWidth: 50
  }}
/>
