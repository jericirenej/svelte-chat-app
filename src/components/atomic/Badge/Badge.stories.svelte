<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import BadgeComponent from "./Badge.svelte";

  export const meta: Meta<BadgeComponent> = {
    title: "Atomic/Badge",
    component: BadgeComponent,
    argTypes: {
      label: { control: "text" },
      num: { control: "number" },
      status: { control: "radio", options: ["confirm", "cancel", "info", "danger"] }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
</script>

<Template let:args>
  <BadgeComponent {...args} />
</Template>

<Story name="Badge" args={{ label: "Number of unread messages", num: 2, status: "confirm" }} />
