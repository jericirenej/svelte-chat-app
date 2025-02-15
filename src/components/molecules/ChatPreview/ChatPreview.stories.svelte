<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import ChatPreviewComponent from "./ChatPreview.svelte";
  import type { RemoveIndexSignature } from "../../../types";

  type Props = RemoveIndexSignature<ComponentProps<ChatPreviewComponent>> & {
    containerWidth: number;
    showContainerBorder: boolean;
    click: (ev: MouseEvent) => unknown;
  };

  export const meta: Meta<Props> = {
    title: "Molecules/ChatPreview",
    component: ChatPreviewComponent,
    argTypes: {
      chatLabel: { control: "text" },
      message: { control: "text" },
      unreadMessages: { control: "number" },
      labelOverride: { control: "text" },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } },
      showContainerBorder: { control: "boolean" }
    },
    args: { click: fn(), onDelete: fn() }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { fn } from "@storybook/test";
  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const {
    chatLabel,
    containerWidth,
    message,
    unreadMessages,
    showContainerBorder,
    click,
    labelOverride,
    onDelete: deleteCb
  } = assertArgs(args)}
  <div
    style:outline-width={showContainerBorder ? "1px" : "0px"}
    class="outline-dashed outline-neutral-500"
    style:width={`${containerWidth}%`}
  >
    <ChatPreviewComponent
      on:click={click}
      onDelete={deleteCb}
      {chatLabel}
      {message}
      {unreadMessages}
      {labelOverride}
    />
  </div>
</Template>
<Story
  name="ChatPreview"
  args={{
    chatLabel: "Some chat",
    message: "Some message",
    unreadMessages: 0,
    containerWidth: 50,
    showContainerBorder: true,
    labelOverride: undefined
  }}
/>
