<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import MessageContainerComponent from "./MessageContainer.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<MessageContainerComponent> & { containerWidth: number }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Molecular/MessageContainer",
    component: MessageContainerComponent,
    argTypes: {
      messages: { table: { disable: true } },
      containerWidth: { control: "number" }
    }
  };
</script>

<script lang="ts">
  import { Template, Story } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ComponentProps } from "svelte";
  import type { MessageDto } from "../../../../db/postgres";
  import { add, sub } from "date-fns";
  const baseDate = sub(new Date(), { hours: 5 });
  const chatId = "chatId";
  const messages: MessageDto[] = [
    { message: "Message from someone else", userId: "Them", createdAt: baseDate },
    {
      message: "Another message from someone else",
      userId: "Them",
      createdAt: add(baseDate, { minutes: 2 })
    },
    { message: "Message from me", userId: "me", createdAt: add(baseDate, { minutes: 10 }) }
  ].map(({ message, userId, createdAt }, index) => ({
    id: `message-${index}`,
    message,
    userId,
    createdAt,
    updatedAt: createdAt,
    chatId,
    deleted: false
  }));
</script>

<Template>
  <MessageContainerComponent loggedUserId="me" {messages} />
</Template>

<Story name="MessageContainer" />
