<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import RootHeadingComponent from "./RootHeading.svelte";

  export const meta: Meta<RootHeadingComponent> = {
    title: "Atoms/RootHeading",
    component: RootHeadingComponent,
    argTypes: {
      heading: { control: "text" },
      showIcon: { control: "boolean" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  const args: ComponentProps<RootHeadingComponent> = { heading: "Chat App", showIcon: true };
</script>

<Template let:args><RootHeadingComponent {...args} /></Template>

<Story name="RootHeading" {args} />
