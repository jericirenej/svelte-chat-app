<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { fn } from "@storybook/test";

  import type { ComponentProps } from "svelte";
  import type { ParticipantData, RemoveIndexSignature, SingleChatData } from "../../../types";
  import {
    baseContainerArgs,
    chatUserNames,
    createMessage,
    type ContainerProps
  } from "../../story-helpers/messageHelpers";
  import ChatContainerComponent from "./ChatContainer.svelte";

  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<ChatContainerComponent> & ContainerProps
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Organic/ChatContainer",
    component: ChatContainerComponent,
    argTypes: {
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } },
      containerHeight: { control: "number" },
      onInput: { table: { disable: true } },
      loadPrevious: { table: { disable: true } },
      initialTotal: { table: { disable: true } },
      data: { table: { disable: true } },
      usersTyping: {
        control: "check",
        options: ["Ada", "Alan", "Alonzo", "Barbara", "Charles", "Kurt"]
      }
    },

    args: { ...baseContainerArgs, onInput: fn() }
  };
</script>

<script lang="ts">
  import { Template, Story } from "@storybook/addon-svelte-csf";

  import type { MessageDto } from "@db/postgres";
  import { USERS_WITH_ID } from "@utils/users";
  import { derived, writable, type Readable, type Writable } from "svelte/store";
  import { assignAvatar } from "../../story-helpers/avatarSrc";
  import ChatStoryWrapper from "../../story-helpers/ChatStoryWrapper.svelte";
  import {
    baseMessages,
    chatUserIds,
    handleAdd,
    pickContainerArgs
  } from "../../story-helpers/messageHelpers";
  import { add } from "date-fns";
  const loggedUserId = chatUserIds[0];
  const messages: Writable<MessageDto[]> = writable(baseMessages);
  const data: Readable<SingleChatData> = derived(messages, ($messages) => {
    const participants: ParticipantData[] = chatUserNames.map((username, i) => {
      const user = USERS_WITH_ID.find((u) => u.username === username);
      if (!user) throw new Error("User not found");
      const { id, name, surname } = user;
      return { id, name, surname, username, avatar: assignAvatar(i) ?? null };
    });
    return { messages: $messages, total: $messages.length + 20, participants };
  });
  const assertArgs = (args: unknown) => {
    const typedArgs = args as ExtendedProps;
    return typedArgs;
  };
</script>

<Template let:args>
  {@const a = assertArgs(args)}
  <ChatStoryWrapper
    container={pickContainerArgs(a)}
    handleAdd={() => {
      handleAdd(messages, $data.total);
    }}
  >
    <ChatContainerComponent
      userId={loggedUserId}
      data={$data}
      sendMessage={async (msg) => {
        const lastMessage = $messages[$messages.length - 1];
        const message = createMessage(
          loggedUserId,
          add(lastMessage.createdAt, { minutes: 10 }),
          msg
        );
        messages.update((m) => [...m, message]);
        return Promise.resolve(true);
      }}
      onInput={a.onInput}
      usersTyping={a.usersTyping}
      loadPrevious={() => {
        handleAdd(messages, $data.total, true);
      }}
    />
  </ChatStoryWrapper>
</Template>

<Story name="ChatContainer" />
