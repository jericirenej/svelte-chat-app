<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { fn } from "@storybook/test";
  import type { ComponentProps } from "svelte";
  import ChatPreviewListComponent from "./ChatPreviewList.svelte";

  import type { RemoveIndexSignature } from "../../../types";
  import {
    activeUserOptions,
    chatPreviewList,
    chatUnreadList,
    simulateUsersTyping
  } from "./story-helpers";

  type Props = RemoveIndexSignature<ComponentProps<ChatPreviewListComponent>> & {
    containerWidth: number;
    activeUsers: string[];
  };

  export const meta: Meta<Props> = {
    title: "Organisms/ChatPreviewList",
    component: ChatPreviewListComponent,
    argTypes: {
      chatPreviewList: { table: { disable: true } },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } },
      activeUsers: {
        control: "multi-select",
        options: activeUserOptions,
        description:
          "Not the actual prop of ChatPreviewList. Here we are setting active users throughout the chats, while in actual use each chat id has its own set of currently active users."
      },
      usersTyping: { table: { disable: true } },
      onDelete: { table: { disable: true } },
      onActive: { table: { disable: true } }
    },
    args: {
      chatPreviewList,
      chatUnreadList,
      containerWidth: 50,
      activeUsers: [],
      onDelete: fn(),
      onActive: fn()
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const { containerWidth, activeUsers, ...rest } = assertArgs(args)}
  <div style:width={`${containerWidth}%`}>
    <ChatPreviewListComponent {...rest} usersTyping={simulateUsersTyping(activeUsers)} />
  </div>
</Template>

<Story name="ChatPreviewList" />
