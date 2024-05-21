<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import NotificationWrapperComponent from "./NotificationWrapper.svelte";

  export const meta: Meta<NotificationWrapperComponent> = {
    title: "Molecular/NotificationWrapper",
    component: NotificationWrapperComponent,
    argTypes: {
      notifications: { table: { disable: true } },
      lifespan: { control: "number" }
    }
  };
  const baseNotifications = (): [string, NotificationEntry][] => [
    [
      v4(),
      {
        content: "First notification with action",
        action: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          console.log("Triggered action");
        }
      }
    ],
    [
      v4(),
      {
        content: "Second notification"
      }
    ],
    [v4(), { content: "Third notification", type: "secondary" }],
    [v4(), { content: "Fourth notification", type: "failure" }],
    [
      v4(),
      {
        content: "Fifth notification with a custom lifespan (3000ms)",
        type: "failure",
        lifespan: 3000
      }
    ]
  ];
  const createMap = () => new Map<string, NotificationEntry>(baseNotifications());
</script>

<script lang="ts">
  import { NotificationStore } from "$lib/client/stores";
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import { v4 } from "uuid";
  import type { NotificationEntry, RemoveIndexSignature } from "../../../../types";
  import StoryFieldsetWrapper from "../../../helpers/StoryFieldsetWrapper.svelte";
  const notifications = new NotificationStore();
  const resetNotifications = () => {
    notifications.set(createMap());
  };
  const assertArgs = (args: unknown) =>
    args as RemoveIndexSignature<ComponentProps<NotificationWrapperComponent>>;
</script>

<Template let:args>
  <StoryFieldsetWrapper labelCallback={resetNotifications} label="Reset notifications">
    {@const storyArgs = assertArgs(args)}
    <NotificationWrapperComponent {notifications} lifespan={storyArgs.lifespan} />
  </StoryFieldsetWrapper>
</Template>

<Story name="NotificationWrapper" args={{ lifespan: 10000 }} />
