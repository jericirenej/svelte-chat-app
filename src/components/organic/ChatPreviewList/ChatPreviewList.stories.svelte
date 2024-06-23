<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import ChatPreviewListComponent from "./ChatPreviewList.svelte";
  import type { RemoveIndexSignature } from "../../../types";

  type Props = RemoveIndexSignature<ComponentProps<ChatPreviewListComponent>> & {
    containerWidth: number;
  };

  export const meta: Meta<Props> = {
    title: "Organic/ChatPreviewList",
    component: ChatPreviewListComponent,
    argTypes: {
      chatPreviewList: { table: { disable: true } },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } }
    },
    args: {
      chatPreviewList: [
        {
          chatId: "chatWithTwoParticipants",
          chatLabel: "Linda Lovelace",
          message: "I think so too!"
        },
        {
          chatId: "chatWithMultipleParticipants",
          chatLabel: "Linda Lovelace, Alan Turing",
          message: "Well that's never going to work..."
        },
        {
          chatId: "labelledChat",
          chatLabel: "On the meaning of life",
          message: "That might be complicated, I think"
        }
      ],
      containerWidth: 50
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const { containerWidth, chatPreviewList } = assertArgs(args)}
  <div style:width={`${containerWidth}%`}>
    <ChatPreviewListComponent {chatPreviewList} />
  </div>
</Template>

<Story name="ChatPreviewList" />
