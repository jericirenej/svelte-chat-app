<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import Notification from "./Notification.svelte";

  export const meta: Meta<Notification> = {
    title: "Molecular/Notification",
    component: Notification,
    argTypes: {
      type: { control: "radio", options: ["default", "secondary", "failure"] },
      lifespan: {control:"number"},
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
  const assertArgs = (args: unknown) => args as RemoveIndexSignature<ComponentProps<Notification>>;
</script>
<Template let:args>
  <StoryFieldsetWrapper
    labelCallback={() => (show = !show)}
    label={`${show ? "Hide" : "Show"} notification`}
  >
    {#if show}
      {@const storyArgs = assertArgs(args)}
      <Notification close={handleClose} type={storyArgs.type} content={storyArgs.content} lifespan={storyArgs.lifespan} />
    {/if}
  </StoryFieldsetWrapper>
</Template>

<Story
  name="Primary"
  args={{
    type: "default",
    content: "Notification content",
    lifespan: 0
  }}
/>
