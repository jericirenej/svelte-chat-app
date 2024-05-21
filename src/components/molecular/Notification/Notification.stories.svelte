<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import NotificationComponent from "./Notification.svelte";

  export const meta: Meta<NotificationComponent> = {
    title: "Molecular/Notification",
    component: NotificationComponent,
    argTypes: {
      type: { control: "radio", options: ["default", "secondary", "failure"] },
      lifespan: { control: "number" },
      content: { control: "text" },
      close: { table: { disable: true } },
      action: { table: { disable: true } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import StoryFieldsetWrapper from "../../helpers/StoryFieldsetWrapper.svelte";

  $: show = true;

  const handleClose = () => {
    show = false;
  };
  const assertArgs = (args: unknown) =>
    args as RemoveIndexSignature<ComponentProps<NotificationComponent>>;
</script>

<Template let:args>
  <StoryFieldsetWrapper
    labelCallback={() => (show = !show)}
    label={`${show ? "Hide" : "Show"} notification`}
  >
    {#if show}
      {@const storyArgs = assertArgs(args)}
      <NotificationComponent
        close={handleClose}
        type={storyArgs.type}
        content={storyArgs.content}
        lifespan={storyArgs.lifespan}
      />
    {/if}
  </StoryFieldsetWrapper>
</Template>

<Story
  name="Notification"
  args={{
    type: "default",
    content: "Notification content",
    lifespan: 0
  }}
/>
