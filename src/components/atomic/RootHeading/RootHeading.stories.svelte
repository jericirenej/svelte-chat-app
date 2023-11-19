<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import RootHeading from "./RootHeading.svelte";

  export const meta: Meta<RootHeading> = {
    title: "Atomic/RootHeading",
    component: RootHeading,
    argTypes: {
      heading: { control: "text" },
      showIcon: { control: "boolean" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  const args: ComponentProps<RootHeading> = { heading: "Chat App", showIcon: true };
</script>

<Template let:args><RootHeading {...args} /></Template>

<Story name="Primary" {args} />
