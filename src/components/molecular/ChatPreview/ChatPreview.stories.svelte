<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import ChatPreviewComponent from "./ChatPreview.svelte";
  import type { RemoveIndexSignature } from "../../../types";

  type Props = RemoveIndexSignature<ComponentProps<ChatPreviewComponent>> & {
    containerWidth: number;
    showContainerBorder: boolean;
  };

  export const meta: Meta<Props> = {
    title: "Molecular/ChatPreview",
    component: ChatPreviewComponent,
    argTypes: {
      chatLabel: { control: "text" },
      message: { control: "text" },
      unreadMessages: { control: "number" },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } },

      showContainerBorder: { control: "boolean" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const { chatLabel, containerWidth, message, unreadMessages, showContainerBorder } =
    assertArgs(args)}
  <div
    style:outline-width={showContainerBorder ? "1px" : "0px"}
    class="outline-dashed outline-neutral-500"
    style:width={`${containerWidth}%`}
  >
    <ChatPreviewComponent {chatLabel} {message} {unreadMessages} />
  </div>
</Template>
<Story
  name="ChatPreview"
  args={{
    chatLabel: "Some chat",
    message: "Some message",
    unreadMessages: 0,
    containerWidth: 50,
    showContainerBorder: true
  }}
/>
