<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import FormFooterComponent from "./FormFooter.svelte";

  export const meta: Meta<FormFooterComponent> = {
    title: "Molecules/FormFooter",
    component: FormFooterComponent,
    argTypes: {
      link: { control: "text" },
      label: { control: "text" }
    },
    args: {
      label: "Follow this link to win great prizes!",
      link: "https://nowhere.anywhere"
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
</script>

<Template let:args>
  <FormFooterComponent {...args} />
</Template>

<Story name="FormFooter" />
