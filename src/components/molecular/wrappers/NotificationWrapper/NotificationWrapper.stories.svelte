<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import NotificationWrapper from "./NotificationWrapper.svelte";

  export const meta: Meta<NotificationWrapper> = {
    title: "Molecular/NotificationWrapper",
    component: NotificationWrapper,
    argTypes: {
      notifications: { table: { disable: true } },
      lifespan: { control: "number" }
    }
  };
  const baseNotifications = (): [string, NotificationEntry][] => [
    [v4(), { content: "First notification" }],
    [
      v4(),
      {
        content: "Second notification with action",
        action: () => {
          console.log("Triggered action");
        }
      }
    ],
    [v4(), { content: "Third notification", type: "secondary" }],
    [v4(), { content: "Fourth notification", type: "failure" }]
  ];
  const createMap = () => new Map<string, NotificationEntry>(baseNotifications());
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { writable } from "svelte/store";
  import type { NotificationEntry, RemoveIndexSignature } from "../../../../types";
  import StoryFieldsetWrapper from "../../../helpers/StoryFieldsetWrapper.svelte";
  import type { ComponentProps } from "svelte";
  import { v4 } from "uuid";
  const notifications = writable(createMap());

  const resetNotifications = () => {
    notifications.set(createMap());
  };
  const assertArgs = (args: unknown) =>
    args as RemoveIndexSignature<ComponentProps<NotificationWrapper>>;
</script>

<Template let:args>
  <StoryFieldsetWrapper labelCallback={resetNotifications} label="Reset notifications">
    {@const storyArgs = assertArgs(args)}
    <NotificationWrapper {notifications} lifespan={storyArgs.lifespan} />
  </StoryFieldsetWrapper>
</Template>

<Story name="Primary" args={{ lifespan: 10000 }} />
