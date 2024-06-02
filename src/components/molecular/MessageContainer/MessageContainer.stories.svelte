<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { add, sub } from "date-fns";
  import type { MessageDto } from "../../../../db/postgres";
  import MessageContainerComponent from "./MessageContainer.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<MessageContainerComponent> & { containerWidth: number; containerHeight: number }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Molecular/MessageContainer",
    component: MessageContainerComponent,
    argTypes: {
      messages: { table: { disable: true } },
      participants: { table: { disable: true } },
      loggedUserId: { table: { disable: true } },
      containerWidth: { control: { type: "range", min: 0, max: 100, step: 5 } },

      containerHeight: { control: "number" }
    },

    args: {
      containerWidth: 100,
      containerHeight: 400
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import { writable, type Writable } from "svelte/store";
  import type { RemoveIndexSignature } from "../../../types";
  import { faker } from "@faker-js/faker";
  import Button from "../../atomic/Button/Button.svelte";
  const baseDate = sub(new Date(), { hours: 10 });
  const chatId = "chatId";
  type Users = "lovelace" | "turing" | "bool";
  const users: [Users, string][] = [
    ["lovelace", "Ada"],
    ["turing", "Alan"],
    ["bool", "George"]
  ];
  const participants = new Map<Users, string>(users);

  const createMessage = (userId: string, createdAt: Date): MessageDto => {
    return {
      id: crypto.randomUUID(),
      userId,
      chatId,
      message: faker.lorem.lines({ min: 1, max: 3 }),
      createdAt,
      updatedAt: createdAt,
      deleted: false
    };
  };
  const loggedUserId = "lovelace";
  const msg: MessageDto[] = [
    createMessage("turing", baseDate),
    createMessage("turing", add(baseDate, { minutes: 10 })),
    createMessage("lovelace", add(baseDate, { minutes: 20 }))
  ];
  let messages: Writable<MessageDto[]> = writable([]);
  msg.forEach((m, i) => {
    setTimeout(() => {
      messages.update((val) => {
        val.push(m);
        return val;
      });
    }, 500 * i);
  });

  const addMessage = () => {
    const userId = users[Math.floor(Math.random() * users.length)][0];
    messages.update((msg) => {
      msg.push(createMessage(userId, add(baseDate, { minutes: msg.length * 10 })));
      return msg;
    });
  };

  const assertArgs = (args: unknown) => args as ExtendedProps;
</script>

<Template let:args>
  {@const a = assertArgs(args)}
  <div class="flex flex-col gap-2">
    <div
      style:width={`${a.containerWidth}%`}
      style:height={`${a.containerHeight}px`}
      class="rounded-md border-2"
    >
      <MessageContainerComponent {participants} {loggedUserId} messages={$messages} />
    </div>

    <div style:width={`${a.containerWidth}%`} class="flex justify-end">
      <Button
        customClasses="ml-auto"
        action="info"
        display="inline-block"
        variant="outline"
        size="sm"
        on:click={addMessage}>Add message</Button
      >
    </div>
  </div>
</Template>

<Story name="MessageContainer" />
