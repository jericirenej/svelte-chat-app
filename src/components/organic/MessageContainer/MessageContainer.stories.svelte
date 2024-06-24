<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { MessageDto } from "../../../../db/postgres";
  import MessageContainerComponent from "./MessageContainer.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<MessageContainerComponent> & {
      containerWidth: number;
      containerHeight: number;
      initialTotal: number;
    }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Organic/MessageContainer",
    component: MessageContainerComponent,
    argTypes: {
      messages: { table: { disable: true } },
      participants: { table: { disable: true } },
      loggedUserId: { table: { disable: true } },
      containerWidth: { control: { type: "range", min: 0, max: 100, step: 5 } },
      initialTotal: { type: "number" },

      containerHeight: { control: "number" }
    },

    args: {
      containerWidth: 100,
      containerHeight: 400,
      initialTotal: 20
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { add } from "date-fns";
  import type { ComponentProps } from "svelte";
  import { get, writable, type Writable } from "svelte/store";
  import type { RemoveIndexSignature } from "../../../types";
  import Button from "../../atomic/Button/Button.svelte";
  import {
    addMessage,
    baseDate,
    chatParticipants,
    chatUserIds,
    createMessage
  } from "../../story-helpers/messageHelpers";

  const loggedUserId = chatUserIds[0];
  let total: number = 0;
  const msg: MessageDto[] = [
    createMessage(chatUserIds[1], baseDate),
    createMessage(chatUserIds[1], add(baseDate, { minutes: 10 })),
    createMessage(chatUserIds[0], add(baseDate, { minutes: 20 }))
  ];
  let messages: Writable<MessageDto[]> = writable(msg);

  const handleAdd = (atBeginning?: boolean) => {
    if (atBeginning) {
      let toLoad = Math.min(5, get(messages).length);
      new Array(toLoad).fill(0).forEach(() => {
        addMessage(messages, atBeginning);
      });
      return;
    }
    addMessage(messages);
    total++;
  };

  const assertArgs = (args: unknown) => {
    const typedArgs = args as ExtendedProps;
    total = typedArgs.initialTotal;
    return typedArgs;
  };
</script>

<Template let:args>
  {@const a = assertArgs(args)}
  <div class="flex flex-col gap-2">
    <div
      style:width={`${a.containerWidth}%`}
      style:height={`${a.containerHeight}px`}
      class="rounded-md border-2"
    >
      <MessageContainerComponent
        {total}
        loadPrevious={() => {
          handleAdd(true);
        }}
        participants={chatParticipants}
        {loggedUserId}
        messages={$messages}
      />
    </div>

    <div style:width={`${a.containerWidth}%`} class="flex justify-end">
      <Button
        customClasses="ml-auto"
        action="info"
        display="inline-block"
        variant="outline"
        size="sm"
        on:click={() => {
          handleAdd();
        }}>Add message</Button
      >
    </div>
  </div>
</Template>

<Story name="MessageContainer" />
