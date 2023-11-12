<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import RootHeading from "./RootHeading.svelte";

  export const meta: Meta<RootHeading> = {
    title: "Atomic/RootHeading",
    component: RootHeading,
    argTypes: {
      heading: { control: "text" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
</script>

<Template let:args><RootHeading {...args} /></Template>

<Story name="Primary" args={{ heading: "Chat App" }} />
