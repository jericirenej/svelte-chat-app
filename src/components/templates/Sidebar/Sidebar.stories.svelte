<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { fn } from "@storybook/test";
  import { type ComponentProps } from "svelte";
  import {
    activeUserOptions,
    chatPreviewList,
    chatUnreadList,
    simulateUsersTyping
  } from "../../organic/ChatPreviewList/story-helpers";
  import SidebarComponent from "./Sidebar.svelte";

  import type { RemoveIndexSignature } from "../../../types";
  type Props = RemoveIndexSignature<ComponentProps<SidebarComponent>> & {
    containerWidth: number;
    containerHeight: number;
    activeUsers: string[];
  };

  export const meta: Meta<Props> = {
    title: "Templates/Sidebar",
    component: SidebarComponent,
    argTypes: {
      chatPreviewList: { table: { disable: true } },
      containerWidth: { control: { type: "range", min: 10, max: 500, step: 5 } },
      containerHeight: { control: { type: "range", min: 10, max: 100, step: 5 } },
      activeUsers: {
        control: "multi-select",
        options: activeUserOptions,
        description:
          "Not the actual prop of ChatPreviewList. Here we are setting active users throughout the chats, while in actual use each chat id has its own set of currently active users."
      },
      usersTyping: { table: { disable: true } },
      handleLogout: { table: { disable: true } },
      handleChatDelete: { table: { disable: true } },
      onActivateHandler: { table: { disable: true } },
      routeId: { table: { disable: true } },
      chatUnreadList: { table: { disable: true } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";

  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const { containerHeight, containerWidth, activeUsers, ...rest } = assertArgs(args)}
  <div
    class="overflow-auto"
    style:width={`${containerWidth}px`}
    style:height={`${containerHeight}vh`}
  >
    <SidebarComponent {...rest} usersTyping={simulateUsersTyping(activeUsers)} />
  </div>
</Template>

<Story
  name="Sidebar"
  args={{
    chatPreviewList,
    chatUnreadList,
    containerWidth: 350,
    containerHeight: 100,
    activeUsers: [],
    handleChatDelete: fn(),
    handleLogout: fn(),
    onActivateHandler: fn()
  }}
/>
