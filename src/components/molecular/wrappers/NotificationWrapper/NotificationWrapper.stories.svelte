<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import NotificationWrapper from "./NotificationWrapper.svelte";

  export const meta: Meta<NotificationWrapper> = {
    title: "Molecular/NotificationWrapper",
    component: NotificationWrapper,
    argTypes: {
      notifications: { table: { disable: true } }
    }
  };
  const baseNotifications: [string, NotificationEntry][] = [
    ["1", { content: "First notification" }],
    ["2", { content: "Second notification" }],
    ["3", { content: "Third notification", type: "secondary" }],
    ["4", { content: "Fourth notification", type: "failure" }]
  ];
  const createMap = () =>
    new Map<string, NotificationEntry>(JSON.parse(JSON.stringify(baseNotifications)));
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { writable } from "svelte/store";
  import type { NotificationEntry } from "../../../../types";
  import StoryFieldsetWrapper from "../../../helpers/StoryFieldsetWrapper.svelte";
  const notifications = writable(createMap());

  const resetNotifications = () => {
    notifications.set(createMap());
  };
</script>

<Template>
  <StoryFieldsetWrapper labelCallback={resetNotifications} label="Reset notifications">
    <NotificationWrapper {notifications} />
  </StoryFieldsetWrapper>
</Template>

<Story
  name="Primary"
/>
