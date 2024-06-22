<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import ChatPreviewComponent from "./ChatPreview.svelte";
  import type { RemoveIndexSignature } from "../../../types";

  type Props = RemoveIndexSignature<ComponentProps<ChatPreviewComponent>> & {
    containerWidth: number;
  };

  export const meta: Meta<Props> = {
    title: "Molecular/ChatPreview",
    component: ChatPreviewComponent,
    argTypes: {
      chatLabel: { control: "text" },
      message: { control: "text" },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const { chatLabel, containerWidth, message } = assertArgs(args)}
  <div class="border-2" style:width={`${containerWidth}%`}>
    <ChatPreviewComponent {chatLabel} {message} />
  </div>
</Template>
<Story
  name="ChatPreview"
  args={{ chatLabel: "Some chat", message: "Some message", containerWidth: 50 }}
/>
