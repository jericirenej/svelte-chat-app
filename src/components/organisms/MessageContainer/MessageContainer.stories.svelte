<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import type { MessageDto } from "../../../../db/postgres";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ContainerProps } from "../../story-helpers/messageHelpers";
  import MessageContainerComponent from "./MessageContainer.svelte";

  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<MessageContainerComponent> & ContainerProps & { initialTotal: number }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Organisms/MessageContainer",
    component: MessageContainerComponent,
    argTypes: {
      messages: { table: { disable: true } },
      participants: { table: { disable: true } },
      loggedUserId: { table: { disable: true } },
      containerWidth: { control: { type: "range", min: 0, max: 100, step: 5 } },
      initialTotal: { type: "number" },
      containerHeight: { control: "number" },
      chatId: { table: { disable: true } }
    },

    args: baseContainerArgs
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { writable, type Writable } from "svelte/store";
  import ChatStoryWrapper from "../../story-helpers/ChatStoryWrapper.svelte";
  import {
    baseContainerArgs,
    baseMessages,
    chatParticipants,
    chatUserIds,
    handleAdd,
    pickContainerArgs
  } from "../../story-helpers/messageHelpers";

  const loggedUserId = chatUserIds[0];
  let total = 0;
  const messages: Writable<MessageDto[]> = writable(baseMessages);

  const assertArgs = (args: unknown) => {
    const typedArgs = args as ExtendedProps;
    total = typedArgs.initialTotal;
    return typedArgs;
  };
</script>

<Template let:args>
  {@const a = assertArgs(args)}
  <ChatStoryWrapper
    container={pickContainerArgs(a)}
    handleAdd={() => {
      handleAdd(messages, total);
    }}
  >
    <MessageContainerComponent
      {total}
      loadPrevious={() => {
        handleAdd(messages, total, true);
      }}
      participants={chatParticipants}
      {loggedUserId}
      messages={$messages}
      chatId={$messages[0].chatId}
    />
  </ChatStoryWrapper>
</Template>

<Story name="MessageContainer" />
